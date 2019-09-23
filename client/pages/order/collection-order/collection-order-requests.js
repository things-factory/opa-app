import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../constants/order'

class CollectionOrderRequests extends localize(i18next)(PageView) {
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
      title: i18next.t('title.collection_order_requests'),
      exportable: {
        name: i18next.t('title.collection_orders'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: () => {}
      }
    }
  }

  activated(active) {
    if (JSON.parse(active) && this.dataGrist) {
      this.dataGrist.fetch()
    }
  }

  async firstUpdated() {
    this._searchFields = [
      {
        label: i18next.t('label.co_no'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.co_no') }
      },
      {
        label: i18next.t('label.collection_date'),
        name: 'collectionDateTime',
        type: 'datetime-local',
        props: { searchOper: 'like', placeholder: i18next.t('label.collection_date') }
      },
      {
        label: i18next.t('label.status'),
        name: 'status',
        type: 'select',
        options: [
          { value: '' },
          { name: i18next.t(`label.${ORDER_STATUS.PENDING_RECEIVE.name}`), value: ORDER_STATUS.PENDING_RECEIVE.value },
          {
            name: i18next.t(`label.${ORDER_STATUS.READY_TO_DISPATCH.name}`),
            value: ORDER_STATUS.READY_TO_DISPATCH.value
          },
          { name: i18next.t(`label.${ORDER_STATUS.COLLECTING.name}`), value: ORDER_STATUS.DELIVERING.value },
          { name: i18next.t(`label.${ORDER_STATUS.DONE.name}`), value: ORDER_STATUS.DONE.value }
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
              if (status === ORDER_STATUS.PENDING_RECEIVE.value) {
                navigate(`receive_collection_order/${record.name}`) // 1. move to order collection page
              } else if (status === ORDER_STATUS.READY_TO_DISPATCH.value) {
                navigate(`execute_collection_order/${record.name}`) // 2. move to execeuting collection page
              } else if (status === ORDER_STATUS.COLLECTING.value) {
                navigate(`complete_collection_order/${record.name}`) // 3. move to complete collection page
              } else if (status === ORDER_STATUS.DONE.value) {
                navigate(`completed_collection_order/${record.name}`) // 4. move to completed collection page
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.co_no'),
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
          type: 'datetime',
          name: 'collectionDateTime',
          header: i18next.t('field.collection_date'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'object',
          name: 'transportVehicle',
          header: i18next.t('field.transport_vehicle'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'object',
          name: 'transportDriver',
          header: i18next.t('field.transport_driver'),
          record: { align: 'center' },
          sortable: true,
          width: 250
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
          collectionOrderRequests(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              telNo
              description
              bizplace {
                id
                name
              }
              transportDriver {
                id
                name
              }
              transportVehicle {
                id
                name
              }
              collectionDateTime
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
        total: response.data.collectionOrderRequests.total || 0,
        records: response.data.collectionOrderRequests.items || []
      }
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

window.customElements.define('collection-order-requests', CollectionOrderRequests)
