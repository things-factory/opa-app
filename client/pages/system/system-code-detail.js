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

        .button-container {
          padding: 10px 0 12px 0;
          text-align: center;
        }
        .button-container > button {
          background-color: var(--button-background-color);
          border: var(--button-border);
          border-radius: var(--button-border-radius);
          margin: var(--button-margin);
          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container > button:hover,
        .button-container > button:active {
          background-color: var(--button-background-focus-color);
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
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler=${this.fetchHandler.bind(this)}
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click=${this._saveCommonCodeDetails}>${i18next.t('button.save')}</button>
        <button @click=${this._deleteCommonCodeDetails}>${i18next.t('button.delete')}</button>
      </div>
    `
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        label: i18next.t('field.name'),
        type: 'text',
        props: {
          searchOper: 'i_like'
        }
      },

      {
        name: 'description',
        label: i18next.t('field.description'),
        type: 'text',
        props: {
          searchOper: 'i_like'
        }
      },
      {
        name: 'rank',
        label: i18next.t('field.rank'),
        type: 'int',
        props: {
          searchOper: 'i_like'
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
          header: i18next.t('field.name'),
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.description'),
          sortable: true,
          width: 220
        },
        {
          type: 'integer',
          name: 'rank',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.rank'),
          sortable: true,
          width: 120
        },
        {
          type: 'object',
          name: 'updater',
          record: {
            align: 'left',
            editable: false
          },
          header: i18next.t('field.updater'),
          sortable: true,
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

    await this.updateComplete

    this.dataGrist.fetch()
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
            filters: [...filters, ...this.searchForm.queryFilters],
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
                message: i18next.t('text.data_deleted_successfully')
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
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('system-code-detail', SystemCodeDetail)
