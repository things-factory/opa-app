import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import '../components/import-pop-up'

export class SystemCodeDetail extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }

        search-form {
          overflow: visible;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
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
          display: flex;
          margin-left: auto;
        }
        .button-container > mwc-button {
          padding: 10px;
        }
      `
    ]
  }

  static get properties() {
    return {
      commonCodeId: String,
      commonCodeName: String,
      _searchFields: Array,
      config: Object,
      importHandler: Object
    }
  }

  render() {
    return html`
      <h2>${i18next.t('title.system-code-details')} ${this.comonCodeName}</h2>

      <search-form
        id="search-form"
        .fields=${this._searchFields}
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler=${this.fetchHandler.bind(this)}
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click=${this._saveCommonCodeDetails}>${i18next.t('button.save')}</mwc-button>
        <mwc-button @click=${this._deleteCommonCodeDetails}>${i18next.t('button.delete')}</mwc-button>
      </div>
    `
  }

  activated(active) {
    if (JSON.parse(active) && this.dataGrist) {
      this.dataGrist.fetch()
    }
  }

  languageUpdated() {
    this.dataGrist.refresh()
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.name')
        }
      },

      {
        name: 'description',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.description')
        }
      },
      {
        name: 'rank',
        type: 'int',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.rank')
        }
      }
    ]

    this.config = {
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'dirty'
        },
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: true
        },
        {
          type: 'string',
          name: 'name',
          record: {
            align: 'left',
            editable: true
          },
          header: 'field.name',
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          record: {
            align: 'left',
            editable: true
          },
          header: 'field.description',
          width: 220
        },
        {
          type: 'integer',
          name: 'rank',
          record: {
            align: 'left',
            editable: true
          },
          header: 'field.rank',
          width: 120
        },
        {
          type: 'object',
          name: 'updater',
          record: {
            align: 'left',
            editable: false
          },
          header: 'field.updater',
          width: 150
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  _importableData(records) {
    setTimeout(() => {
      openPopup(
        html`
          <import-pop-up
            .records=${records}
            .config=${this.config}
            .importHandler="${this.importHandler.bind(this)}"
          ></import-pop-up>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.import')
        }
      )
    }, 500)
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    let filters = []
    if (this.commonCodeId) {
      filters.push({
        name: 'common_code_id',
        operator: 'eq',
        value: this.commonCodeId
      })
    }

    const response = await client.query({
      query: gql`
        query {
          commonCodeDetails(${gqlBuilder.buildArgs({
            filters: [...filters, ...this._conditionParser()],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              rank
              updatedAt
              updater{
                id
                name
                description
              }
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      return {
        total: response.data.commonCodeDetails.total || 0,
        records: response.data.commonCodeDetails.items || []
      }
    }
  }

  async importHandler(patches) {
    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleCommonCodeDetail(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
    })

    if (!response.errors) {
      history.back()
      this.dataGrist.fetch()
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            message: i18next.t('text.data_imported_successfully')
          }
        })
      )
    }
  }

  _conditionParser() {
    return this.searchForm
      .getFields()
      .filter(field => (field.type !== 'checkbox' && field.value && field.value !== '') || field.type === 'checkbox')
      .map(field => {
        return {
          name: field.name,
          value:
            field.type === 'text'
              ? field.value
              : field.type === 'checkbox'
              ? field.checked
              : field.type === 'number'
              ? parseFloat(field.value)
              : field.value,
          operator: field.getAttribute('searchOper')
        }
      })
  }

  async _saveCommonCodeDetails() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(commonCodeDetail => {
        let patchField = commonCodeDetail.id ? { id: commonCodeDetail.id } : {}
        const dirtyFields = commonCodeDetail.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.commonCode = { id: this.commonCodeId }
        patchField.cuFlag = commonCodeDetail.__dirty__

        return patchField
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleCommonCodeDetail(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.data_updated_successfully')
            }
          })
        )
      }
    }
  }

  async _deleteCommonCodeDetails() {
    let confirmDelete = confirm('Are you sure?')
    if (confirmDelete) {
      const names = this.dataGrist.selected.map(record => record.name)
      if (names && names.length > 0) {
        const response = await client.query({
          query: gql`
            mutation {
              deleteCommonCodeDetails(${gqlBuilder.buildArgs({ names })})
            }
          `
        })

        if (!response.errors) {
          this.dataGrist.fetch()
          document.dispatchEvent(
            new CustomEvent('notify', {
              detail: {
                message: i18next.t('text.data_updated_successfully')
              }
            })
          )
        }
      }
    }
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = this.dataGrist.data.records
    }

    return records.map(item => {
      return this._columns
        .filter(column => column.type !== 'gutter')
        .reduce((record, column) => {
          record[column.name] = item[column.name]
          return record
        }, {})
    })
  }
}

window.customElements.define('system-code-detail', SystemCodeDetail)
