import '@things-factory/form-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import '@things-factory/import-ui'
import { client, CustomAlert, PageView, navigate } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class CreateCycleCount extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }

        .grist-container {
          overflow-y: hidden;
          display: flex;
          flex: 1;
        }

        data-grist {
          overflow-y: hidden;
          flex: 1;
        }

        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .button-container {
          padding: var(--button-container-padding);
          margin: var(--button-container-margin);
          text-align: var(--button-container-align);
          background-color: var(--button-container-background);
          height: var(--button-container-height);
        }
        .button-container button {
          background-color: var(--button-container-button-background-color);
          border-radius: var(--button-container-button-border-radius);
          height: var(--button-container-button-height);
          border: var(--button-container-button-border);
          margin: var(--button-container-button-margin);

          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container button:hover,
        .button-container button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  render() {
    return html`
      <form id="input-form" name="cycleCount" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.cycle_count_information')}</legend>
          <label>${i18next.t('label.execute_date')}</label>
          <input name="executionDate" type="date" min="${this._getStdDate()}" required />
        </fieldset>
      </form>

      <h2>${i18next.t('label.customer')}</h2>
      <search-form id="search-form" .fields=${this._searchFields} @submit=${() => this.dataGrist.fetch()}></search-form>

      <div class="grist-container">
        <div class="grist">
          <data-grist
            id="userBizplaces"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .fetchHandler="${this.fetchBizplaces.bind(this)}"
          ></data-grist>
        </div>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.create_cycle_count'),
      actions: [
        {
          title: i18next.t('button.create'),
          action: this._createCycleCount.bind(this)
        }
      ]
    }
  }

  Updated(changes) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  firstUpdated() {
    this.config = {
      list: {
        fields: ['name', 'description']
      },
      pagination: { pages: [10, 20, 50, 2500] },
      rows: {
        selectable: {
          multiple: false
        },
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: false },
        {
          type: 'string',
          name: 'name',
          record: { align: 'left' },
          header: i18next.t('field.name'),
          width: 300
        },
        {
          type: 'string',
          name: 'description',
          record: { align: 'left' },
          header: i18next.t('field.description'),
          width: 350
        }
      ]
    }

    this._searchFields = [
      {
        label: i18next.t('label.customer'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get date() {
    return this.shadowRoot.querySelector('input[name=executionDate]')
  }

  get cycleCountForm() {
    return this.shadowRoot.querySelector('form[name=cycleCount]')
  }

  async fetchBizplaces({ page, limit, sorters = [] }) {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: [...filters],
              pagination: { page, limit },
              sortings: sorters
            })}) {
              items{
                id
                name
                description
              }
              total
            }
          }
        `
    })

    return {
      total: response.data.bizplaces.total || 0,
      records: response.data.bizplaces.items || []
    }
  }

  async _createCycleCount() {
    try {
      this._validate()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_cycle_count_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      CustomAlert({
        title: i18next.t('text.please_wait'),
        text: i18next.t('text.creating_cycle_count_worksheet'),
        allowOutsideClick: false,
        allowEscapeKey: false
      })

      const worksheetNo = await this.generateCycleCountWorksheet(this.dataGrist.selected[0].id, this.date.value)

      if (worksheetNo) {
        await CustomAlert({
          title: i18next.t('title.completed'),
          text: i18next.t('text.complete_x', { state: { x: i18next.t('text.creating_cycle_count_worksheet') } }),
          confirmButton: { text: i18next.t('button.confirm') }
        })

        navigate(`worksheet_cycle_count/${worksheetNo}`)
      } else {
        CustomAlert({
          title: i18next.t('title.error'),
          text: i18next.t('text.x_error', { state: { x: i18next.t('text.create_cycle_count_worksheet') } }),
          confirmButton: { text: i18next.t('button.confirm') }
        })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validate() {
    const _selectedInventory = this.dataGrist.selected
    if (_selectedInventory && _selectedInventory.length == 0) {
      throw new Error(i18next.t('text.there_no_selected'))
    }

    if (!this.cycleCountForm.checkValidity()) {
      throw new Error(i18next.t('text.cycle_count_date_invalid'))
    }
  }

  async generateCycleCountWorksheet(customerId, executionDate) {
    const response = await client.query({
      query: gql`
        mutation {
          generateCycleCountWorksheet(${gqlBuilder.buildArgs({
            customerId,
            executionDate
          })}) {
            cycleCountWorksheet {
              name
            }
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.generateCycleCountWorksheet.cycleCountWorksheet.name
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  _showToast({ type, message }) {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          type,
          message
        }
      })
    )
  }
}

window.customElements.define('create-cycle-count', CreateCycleCount)
