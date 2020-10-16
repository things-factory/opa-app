import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, navigate, PageView } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import {
  getOrderStatusCandidates,
  getWorksheetStatusCandidates,
  ORDER_STATUS,
  ORDER_TYPES,
  WORKSHEET_TYPE
} from '../constants'
import './search-popup'
class InventoryCheckList extends localize(i18next)(PageView) {
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
        data-grist {
          overflow-y: auto;
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

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.inventory_check_list'),
      exportable: {
        name: i18next.t('title.inventory_check_list'),
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
    const _worksheetStatus = getWorksheetStatusCandidates(WORKSHEET_TYPE.CYCLE_COUNT)
    const _orderStatus = getOrderStatusCandidates(ORDER_TYPES.CYCLE_COUNT)

    this._bizplaces = [...(await this._fetchBizplaceList())]

    this._searchFields = [
      {
        name: 'bizplace',
        label: i18next.t(`field.customer`),
        type: 'object',
        queryName: 'bizplaces',
        field: 'name',
        handlers: {
          click: this._showSearchCustomer.bind(this)
        },
        props: { searchOper: 'eq', readonly: true }
      },
      {
        name: 'inventoryCheckNo',
        label: i18next.t('field.inventory_check_no'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'executionDate',
        label: i18next.t('field.execution_date'),
        type: 'date',
        props: { searchOper: 'eq' }
      },
      {
        name: 'orderStatus',
        label: i18next.t('field.order_status'),
        type: 'select',
        options: [
          { value: '' },
          ..._orderStatus.map(status => {
            return { name: i18next.t(`label.${status.name}`), value: status.value }
          })
        ],
        props: { searchOper: 'eq' }
      },
      {
        name: 'status',
        label: i18next.t('field.task_status'),
        type: 'select',
        options: [{ value: '' }, ..._worksheetStatus],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      list: {
        fields: ['inventoryCheck', 'type', 'Customer', 'executionDate', 'orderStatus', 'status', 'startedAt', 'endedAt']
      },
      rows: { appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (!record.id) return
              const type = record.type
              const status = record.orderStatus

              // Handle PICKING
              if (
                type === WORKSHEET_TYPE.CYCLE_COUNT.value &&
                status !== ORDER_STATUS.PENDING_REVIEW.value &&
                status !== ORDER_STATUS.DONE.value
              ) {
                navigate(`worksheet_cycle_count/${record.name}`)
              } else {
                navigate(`cycle_count_report/${record.name}`)
              }
            }
          }
        },
        {
          type: 'object',
          name: 'inventoryCheck',
          header: i18next.t('field.inventory_check_no'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 250
        },
        {
          type: 'date',
          name: 'executionDate',
          header: i18next.t('field.execution_date'),
          record: { align: 'center' },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'orderStatus',
          header: i18next.t('field.order_status'),
          record: { align: 'center' },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.task_status'),
          record: { align: 'center' },
          sortable: true,
          width: 120
        },
        {
          type: 'datetime',
          name: 'startedAt',
          header: i18next.t('field.started_at'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'datetime',
          name: 'endedAt',
          header: i18next.t('field.ended_at'),
          record: { align: 'center' },
          sortable: true,
          width: 160
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

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get bizplace() {
    return this.searchForm.shadowRoot.querySelector('input[name=bizplace]')
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'endedAt', desc: true }] }) {
    const filters = await this.searchForm.getQueryFilters()
    filters.push({
      name: 'type',
      operator: 'in',
      value: [
        WORKSHEET_TYPE.CYCLE_COUNT.value,
        WORKSHEET_TYPE.CYCLE_COUNT_RECHECK.value,
        WORKSHEET_TYPE.STOCK_TAKE.value
      ]
    })

    const response = await client.query({
      query: gql`
        query {
          worksheets(${gqlBuilder.buildArgs({
            filters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              inventoryCheck {
                id
                name
                description
                executionDate
                status
              }
              bizplace {
                id
                name
                description
              }
              type
              status
              startedAt
              createdAt
              endedAt
              updater {
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
        total: response.data.worksheets.total || 0,
        records:
          response.data.worksheets.items.map(item => {
            return {
              ...item,
              executionDate: item.inventoryCheck && item.inventoryCheck.executionDate,
              status: item.status,
              orderStatus: item.inventoryCheck && item.inventoryCheck.status
            }
          }) || {}
      }
    }
  }

  async _fetchBizplaceList() {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: []
            })}) {
              items{
                id
                name
                description
              }
            }
          }
        `
    })

    if (!response.errors) {
      return response.data.bizplaces.items
    }
  }

  _showSearchCustomer() {
    openPopup(
      html`
        <search-popup
          .complete="${async data => {
            this.bizplace.value = data.name
          }}"
        ></search-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('field.customer')
      }
    )
  }

  _compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0
      }

      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key]
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key]

      let comparison = 0
      if (varA > varB) {
        comparison = 1
      } else if (varA < varB) {
        comparison = -1
      }
      return order === 'desc' ? comparison * -1 : comparison
    }
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('inventory-check-list', InventoryCheckList)
