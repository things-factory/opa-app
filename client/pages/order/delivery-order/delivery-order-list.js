import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../constants/order'

class DeliveryOrderList extends localize(i18next)(PageView) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        search-form {
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

  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.delivery_orders'),
      exportable: {
        name: i18next.t('title.delivery_orders'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: () => {}
      }
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
        label: i18next.t('label.do_no'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.do_no') }
      },
      {
        label: i18next.t('label.delivery_date'),
        name: 'deliveryDateTime',
        type: 'datetime-local',
        props: { searchOper: 'like', placeholder: i18next.t('label.delivery_date') }
      },
      {
        label: i18next.t('label.status'),
        name: 'status',
        type: 'select',
        options: [
          { value: '' },
          ...Object.keys(ORDER_STATUS).map(key => {
            const status = ORDER_STATUS[key]
            return { name: i18next.t(`label.${status.name}`), value: status.value }
          })
        ],
        props: { searchOper: 'eq', placeholder: i18next.t('label.status') }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const status = record.status
              if (status === ORDER_STATUS.REJECTED.value) {
                navigate(`rejected_delivery_order/${record.name}`) // 1. move to rejected detail page
              } else {
                navigate(`delivery_order_detail/${record.name}`) // 2. move to order detail page
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.do_no'),
          record: { align: 'center' },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'from',
          header: i18next.t('field.from'),
          record: { align: 'center' },
          sortable: true,
          width: 250
        },
        {
          type: 'string',
          name: 'to',
          header: i18next.t('field.to'),
          record: { align: 'center' },
          sortable: true,
          width: 250
        },
        {
          type: 'object',
          name: 'transportVehicle',
          header: i18next.t('field.assigned_truck'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'transportDriver',
          header: i18next.t('field.assigned_driver'),
          record: { align: 'center' },
          sortable: true,
          width: 250
        },

        {
          type: 'string',
          name: 'telNo',
          header: i18next.t('field.tel_no'),
          record: { align: 'center' },
          sortable: true,
          width: 250
        },
        {
          type: 'datetime',
          name: 'deliveryDateTime',
          header: i18next.t('field.delivery_date'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'center' },
          sortable: true,
          width: 160
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

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          deliveryOrders(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              from
              to
              telNo
              loadType
              transportDriver {
                id
                name
              }
              transportVehicle {
                id
                name
              }
              deliveryDateTime
              status
              updatedAt
              updater {
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
        total: response.data.deliveryOrders.total || 0,
        records: response.data.deliveryOrders.items || []
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

window.customElements.define('delivery-order-list', DeliveryOrderList)
