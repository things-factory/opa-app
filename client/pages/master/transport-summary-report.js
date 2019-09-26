import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../components/import-pop-up'
import Swal from 'sweetalert2'

class TransportSummaryReport extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object,
      importHandler: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        search-form {
          overflow: visible;
        }
        search-form-total {
          overflow: visible;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>

      
        <fieldset>
          <!-- <label>${i18next.t('label.balance')}</label>
          <input name="balance" /> -->

          <label>${i18next.t('label.total_price')}</label>
          <input name="totalPrice" />
        </fieldset>
      </form>
    `
  }

  get context() {
    return {
      title: i18next.t('title.transport_summary_report'),
      actions: [
        // {
        //   title: i18next.t('button.save'),
        //   action: this._saveTransportDriver.bind(this)
        // },
        {
          title: i18next.t('button.print_to_pdf')
          // action: this._printToPdf.bind(this)
        }
      ]
      // ],
      // exportable: {
      //   name: i18next.t('title.transport_driver'),
      //   data: this._exportableData.bind(this)
      // },
      // importable: {
      //   handler: this._importableData.bind(this)
      // }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  pageInitialized() {
    this._searchFields = [
      {
        label: i18next.t('driver_code'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.driver_code') }
      },
      {
        label: i18next.t('start_date'),
        name: 'startDate',
        type: 'datetime-local',
        props: { searchOper: 'like', placeholder: i18next.t('label.start_date') }
      },
      {
        label: i18next.t('end_date'),
        name: 'endDate',
        type: 'datetime-local',
        props: { searchOper: 'like', placeholder: i18next.t('label.end_date') }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'driverCode',
          header: i18next.t('field.driver_code'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'truck number',
          header: i18next.t('field.truck_number'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'bizplace',
          record: {
            align: 'center',
            editable: true,
            options: {
              queryName: 'bizplaces'
              // basicArgs: {
              //   filters: [
              //     {
              //       name: 'name',
              //       value: 'o',
              //       operator: 'like',
              //       dataType: 'string'
              //     }
              //   ]
              // }
            }
          },
          header: i18next.t('field.bizplace'),
          width: 200
        },
        {
          type: 'string',
          name: 'tolls',
          header: i18next.t('field.tolls'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'parking',
          header: i18next.t('field.parking'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.forklift_charge'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 200
        },

        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
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

  get searchForm() {
    return this.shadowRoot.querySelector('search-form-total')
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
          size: 'large'
        }
      )
    }, 500)
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          transportDrivers(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              bizplace{
                id
                name
              }
              driverCode
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
      total: response.data.transportDrivers.total || 0,
      records: response.data.transportDrivers.items || []
    }
  }

  async importHandler(patches) {
    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleTransportDriver(${gqlBuilder.buildArgs({
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

  _openContactPoints(bizplaceId, bizplaceName) {
    openPopup(
      html`
        <contact-point-list .bizplaceId="${bizplaceId}" .bizplaceName="${bizplaceName}"></contact-point-list>
      `,
      {
        backdrop: true,
        size: 'large'
      }
    )
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

  async _saveTransportDriver() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(transportDriver => {
        let patchField = transportDriver.id ? { id: transportDriver.id } : {}
        const dirtyFields = transportDriver.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.cuFlag = transportDriver.__dirty__

        return patchField
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleTransportDriver(${gqlBuilder.buildArgs({
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

  async _deleteTransportDriver() {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async result => {
      if (result.value) {
        const names = this.dataGrist.selected.map(record => record.name)
        if (names && names.length > 0) {
          const response = await client.query({
            query: gql`
              mutation {
                deleteTransportDrivers(${gqlBuilder.buildArgs({ names })})
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

window.customElements.define('transport-summary-report', TransportSummaryReport)
