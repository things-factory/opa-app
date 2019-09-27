import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { openPopup } from '@things-factory/layout-base'
import { css, html, LitElement } from 'lit-element'
import '../components/import-pop-up'
import Swal from 'sweetalert2'

export class ContactPointList extends localize(i18next)(LitElement) {
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
      bizplaceId: String,
      bizplaceName: String,
      _searchFields: Array,
      config: Object,
      importHandler: Object
    }
  }

  render() {
    return html`
      <h2>${i18next.t('title.contact_point')} ${this.bizplaceName}</h2>

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
        <mwc-button @click=${this._saveContactPoints}>${i18next.t('button.save')}</mwc-button>
        <mwc-button @click=${this._deleteContactPoints}>${i18next.t('button.delete')}</mwc-button>
      </div>
    `
  }

  // get context() {
  //   return {
  //     title: i18next.t('title.contact_point'),
  //     actions: [
  //       {
  //         title: i18next.t('button.save'),
  //         action: this._saveContactPoints.bind(this)
  //       },
  //       {
  //         title: i18next.t('button.delete'),
  //         action: this._deleteContactPoints.bind(this)
  //       }
  //     ],
  //     exportable: {
  //       name: i18next.t('title.contact_point'),
  //       data: this._exportableData.bind(this)
  //     },
  //     importable: {
  //       handler: this._importableData.bind(this)
  //     }
  //   }
  // }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  pageInitialized() {
    this._searchFields = [
      {
        label: i18next.t('label.name'),
        name: 'name',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('label.name')
        }
      },
      {
        label: i18next.t('label.email'),
        name: 'email',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('label.email')
        }
      },
      {
        label: i18next.t('label.name'),
        name: 'fax',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('label.fax')
        }
      },
      {
        label: i18next.t('label.phone'),
        name: 'phone',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('label.phone')
        }
      },
      {
        label: i18next.t('label.description'),
        name: 'description',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('label.description')
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
          type: 'string',
          name: 'email',
          record: {
            align: 'left',
            editable: true
          },
          header: 'field.email',
          width: 120
        },
        {
          type: 'string',
          name: 'fax',
          record: {
            align: 'left',
            editable: true
          },
          header: 'field.fax',
          width: 120
        },
        {
          type: 'string',
          name: 'phone',
          record: {
            align: 'left',
            editable: true
          },
          header: 'field.phone',
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
          record: {
            align: 'left'
          },
          header: 'field.updated_at',
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
    if (this.bizplaceId) {
      filters.push({
        name: 'bizplace_id',
        operator: 'eq',
        value: this.bizplaceId
      })
    }

    const response = await client.query({
      query: gql`
        query {
          contactPoints(${gqlBuilder.buildArgs({
            filters: [...filters, ...this.searchForm.queryFilters],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              email
              fax
              phone
              description
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

    return {
      total: response.data.contactPoints.total || 0,
      records: response.data.contactPoints.items || []
    }
  }

  async importHandler(patches) {
    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleContactPoint(${gqlBuilder.buildArgs({
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

  async _saveContactPoints() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(contactPoint => {
        let patchField = contactPoint.id ? { id: contactPoint.id } : {}
        const dirtyFields = contactPoint.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.bizplace = { id: this.bizplaceId }
        patchField.cuFlag = contactPoint.__dirty__

        return patchField
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleContactPoint(${gqlBuilder.buildArgs({
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

  async _deleteContactPoints() {
    Swal.fire({
      title: i18next.t('text.are_you_sure?'),
      text: i18next.t('text.you_wont_be_able_to_revert_this!'),
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22a6a7',
      cancelButtonColor: '#cfcfcf',
      confirmButtonText: i18next.t('button.delete')
    }).then(async result => {
      if (result.value) {
        const names = this.dataGrist.selected.map(record => record.name)
        if (names && names.length > 0) {
          const response = await client.query({
            query: gql`
            mutation {
              deleteContactPoints(${gqlBuilder.buildArgs({ names })})
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
    })
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

window.customElements.define('contact-point-list', ContactPointList)
