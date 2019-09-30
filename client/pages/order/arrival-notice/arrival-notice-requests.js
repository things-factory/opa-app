import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../constants/order'

class ArrivalNoticeRequests extends localize(i18next)(PageView) {
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
      title: i18next.t('title.arrival_notice_requests'),
      exportable: {
        name: i18next.t('title.arrival_notice_requests'),
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
        label: i18next.t('field.gan'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.eta'),
        name: 'eta',
        type: 'datetime-local',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.collection_date'),
        name: 'collectionDateTime',
        type: 'datetime-local',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'select',
        options: [
          { value: '' },
          { name: i18next.t(`label.${ORDER_STATUS.PENDING_RECEIVE.name}`), value: ORDER_STATUS.PENDING_RECEIVE.value },
          { name: i18next.t(`label.${ORDER_STATUS.INTRANSIT.name}`), value: ORDER_STATUS.INTRANSIT.value },
          { name: i18next.t(`label.${ORDER_STATUS.ARRIVED.name}`), value: ORDER_STATUS.ARRIVED.value },
          { name: i18next.t(`label.${ORDER_STATUS.PROCESSING.name}`), value: ORDER_STATUS.PROCESSING.value }
        ],
        props: { searchOper: 'eq' }
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
              if (status === ORDER_STATUS.PENDING_RECEIVE.value) {
                navigate(`receive_arrival_notice/${record.name}`) // 1. move to order receiving page
              } else if (status === ORDER_STATUS.INTRANSIT.value) {
                navigate(`check_arrived_notice/${record.name}`) // 2. move to order arriving check page
              } else if (status === ORDER_STATUS.ARRIVED.value) {
                navigate(`assign_buffer_location/${record.name}`) // 3. move to assign buffer location
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.gan'),
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
          width: 200
        },
        {
          type: 'datetime',
          name: 'eta',
          header: i18next.t('field.eta'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'datetime',
          name: 'collectionDateTime',
          header: i18next.t('field.collection_date'),
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
          type: 'string',
          name: 'deliveryOrderNo',
          header: i18next.t('field.do_no'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'object',
          name: 'collectionOrder',
          header: i18next.t('field.co_no'),
          record: { align: 'center' },
          sortable: true,
          width: 200
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
          arrivalNoticeRequests(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              bizplace {
                id
                name
                description
              }
              name
              eta
              collectionDateTime
              status
              collectionOrder {
                id
                name
                description
              }
              deliveryOrderNo
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
        total: response.data.arrivalNoticeRequests.total || 0,
        records: response.data.arrivalNoticeRequests.items || []
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

window.customElements.define('arrival-notice-requests', ArrivalNoticeRequests)
