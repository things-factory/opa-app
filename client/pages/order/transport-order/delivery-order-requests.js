import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../constants/order'

class DeliveryOrderRequests extends localize(i18next)(PageView) {
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
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

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
      title: i18next.t('title.delivery_order_requests'),
      exportable: {
        name: i18next.t('title.delivery_orders'),
        data: this._exportableData.bind(this)
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async pageInitialized() {
    this._searchFields = [
      {
        label: i18next.t('field.do_no'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.delivery_date'),
        name: 'deliveryDate',
        type: 'date',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'select',
        options: [
          { value: '' },
          { name: i18next.t(`label.${ORDER_STATUS.PENDING_RECEIVE.name}`), value: ORDER_STATUS.PENDING_RECEIVE.value },
          {
            name: i18next.t(`label.${ORDER_STATUS.READY_TO_DISPATCH.name}`),
            value: ORDER_STATUS.READY_TO_DISPATCH.value
          },
          { name: i18next.t(`label.${ORDER_STATUS.DELIVERING.name}`), value: ORDER_STATUS.DELIVERING.value },
          { name: i18next.t(`label.${ORDER_STATUS.DONE.name}`), value: ORDER_STATUS.DONE.value },
          { name: i18next.t(`label.${ORDER_STATUS.REJECTED.name}`), value: ORDER_STATUS.REJECTED.value }
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true }, appendable: false },
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
              if (status === ORDER_STATUS.PENDING_RECEIVE.value) {
                navigate(`receive_delivery_order/${record.name}`) // 1. move to order receiving page
              } else if (status === ORDER_STATUS.READY_TO_DISPATCH.value) {
                navigate(`execute_delivery_order/${record.name}`) // 2. move to execeuting delivery page
              } else if (status === ORDER_STATUS.DELIVERING.value) {
                navigate(`complete_delivery_order/${record.name}`) // 3. move to complete delivery page
              } else if (status === ORDER_STATUS.DONE.value) {
                navigate(`completed_delivery_order/${record.name}`) // 4. move to completed delivery page
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
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'center' },
          sortable: true,
          width: 250
        },
        {
          type: 'checkbox',
          name: 'urgency',
          header: i18next.t('field.urgency'),
          record: { align: 'center' },
          sortable: true,
          width: 180
        },
        {
          type: 'date',
          name: 'deliveryDate',
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
          deliveryOrderRequests(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              telNo
              description
              urgency
              bizplace {
                id
                name
              }
              deliveryDate
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
        total: response.data.deliveryOrderRequests.total || 0,
        records: response.data.deliveryOrderRequests.items || []
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

window.customElements.define('delivery-order-requests', DeliveryOrderRequests)
