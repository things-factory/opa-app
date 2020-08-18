import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { html, css } from 'lit-element'
import { client, PageView, store } from '@things-factory/shell'
import { gqlBuilder, flattenObject, isMobileDevice } from '@things-factory/utils'
import { connect } from 'pwa-helpers/connect-mixin'
import { localize, i18next } from '@things-factory/i18n-base'
import gql from 'graphql-tag'
import '../inventory/inventory-by-product-detail'
import { openPopup } from '@things-factory/layout-base'

class InventorySummaryReport extends connect(store)(localize(i18next)(PageView)) {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      data-grist {
        overflow-y: auto;
        flex: 1;
      }
    `
  }

  static get properties() {
    return {
      _searchFields: Object,
      _config: Object,
      _userBizplaces: Object,
      data: Object
    }
  }

  get context() {
    return {
      title: i18next.t('title.inventory_summary_report'),
      printable: {
        accept: ['preview'],
        content: this
      },
      exportable: {
        name: i18next.t('title.inventory_summary_report'),
        data: this._exportableData.bind(this)
      }
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get _bizplaceSelector() {
    return this.searchForm.shadowRoot.querySelector('select[name=bizplace]')
  }

  get _fromDateInput() {
    return this.searchForm.shadowRoot.querySelector('input[name=fromDate]')
  }

  get _toDateInput() {
    return this.searchForm.shadowRoot.querySelector('input[name=toDate]')
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this._config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get searchFields() {
    return [
      {
        label: i18next.t('field.customer'),
        name: 'bizplace',
        type: 'select',
        options: [
          { value: '' },
          ...this._userBizplaces
            .map(bizplaceList => {
              return {
                name: bizplaceList.name,
                value: bizplaceList.id
              }
            })
            .sort(this._compareValues('name', 'asc'))
        ],
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.product'),
        name: 'product',
        type: 'string',
        props: { searchOper: 'in' }
      },
      {
        label: i18next.t('field.product_description'),
        name: 'productDescription',
        type: 'string',
        props: { searchOper: 'in' }
      },
      {
        label: i18next.t('field.batch_no'),
        name: 'batchNo',
        type: 'string',
        props: { searchOper: 'in' }
      },
      {
        label: i18next.t('field.from_date'),
        name: 'fromDate',
        type: 'date',
        props: {
          searchOper: 'eq',
          max: new Date().toISOString().split('T')[0]
        },
        value: (() => {
          let date = new Date()
          date.setMonth(date.getMonth() - 1)
          return date.toISOString().split('T')[0]
        })(),
        handlers: { change: this._modifyDateRange.bind(this) }
      },
      {
        label: i18next.t('field.to_date'),
        name: 'toDate',
        type: 'date',
        props: {
          searchOper: 'eq',
          min: (() => {
            let date = new Date()
            date.setMonth(date.getMonth() - 1)
            return date.toISOString().split('T')[0]
          })(),
          max: new Date().toISOString().split('T')[0]
        },
        value: new Date().toISOString().split('T')[0]
      },
      {
        label: i18next.t('field.has_transaction_or_balance'),
        name: 'hasTransactionOrBalance',
        type: 'checkbox',
        value: true,
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.by_pallet'),
        name: 'byPallet',
        type: 'checkbox',
        props: { searchOper: 'eq' },
        handlers: { change: this._submit.bind(this) }
      }
    ]
  }

  get reportConfig() {
    return {
      list: {
        fields: [
          'product|name',
          'packingType',
          'adjustmentQty',
          'openingQty',
          'totalInQty',
          'totalOutQty',
          'closingQty'
        ]
      },
      pagination: { pages: [20, 50, 100, 200, 500, 1000] },
      rows: {
        selectable: false,
        insertable: false,
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: this._showInventoryInfo.bind(this)
          }
        },
        {
          type: 'string',
          name: 'product|name',
          header: i18next.t('field.product'),
          record: { editable: false, align: 'left' },
          imex: { header: i18next.t('field.product'), key: 'product|name', width: 75, type: 'string' },
          width: 400
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.packing_type'), key: 'packingType', width: 25, type: 'string' },
          width: 160
        },
        {
          type: 'float',
          name: 'openingQty',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.opening_balance'),
          imex: { header: i18next.t('field.opening_balance'), key: 'openingQty', width: 25, type: 'string' },
          width: 140
        },
        {
          type: 'float',
          name: 'totalInQty',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.inbound_qty'),
          imex: { header: i18next.t('field.inbound_qty'), key: 'totalInQty', width: 25, type: 'string' },
          width: 140
        },
        {
          type: 'float',
          name: 'adjustmentQty',
          header: i18next.t('field.adjustment_qty'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.adjustment_qty'), key: 'adjustmentQty', width: 25, type: 'string' },
          width: 140
        },
        {
          type: 'float',
          name: 'totalOutQty',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.outbound_qty'),
          imex: { header: i18next.t('field.outbound_qty'), key: 'totalOutQty', width: 25, type: 'string' },
          width: 140
        },
        {
          type: 'float',
          name: 'closingQty',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.closing_balance'),
          imex: { header: i18next.t('field.closing_balance'), key: 'closingQty', width: 25, type: 'string' },
          width: 140
        }
      ]
    }
  }

  async pageInitialized() {
    this._products = []
    this._userBizplaces = [...(await this._fetchBizplaceList())]

    this._searchFields = this.searchFields
    this._config = this.reportConfig
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      this._validate()
      let filter = this.searchForm.queryFilters.map(filter => {
        switch (filter.name) {
          case 'fromDate':
            let fromDt = new Date(filter.value)
            fromDt.setHours(0)
            filter.value = fromDt.toISOString()
            break
          case 'toDate':
            let toDt = new Date(filter.value)
            toDt.setHours(23, 59, 59)
            filter.value = toDt.toISOString()
            break
          default:
            break
        }
        return filter
      })
      const response = await client.query({
        query: gql`
            query {
              inventoryHistorySummaryReport(${gqlBuilder.buildArgs({
                filters: filter,
                pagination: { page, limit },
                sortings: sorters
              })}) {
                items{
                  batchId
                  packingType
                  product{
                    id
                    name
                    description
                  }
                  openingQty
                  totalInQty
                  totalOutQty
                  adjustmentQty
                  closingQty
                }
                total
              }
            }
          `
      })
      return {
        total: response.data.inventoryHistorySummaryReport.total,
        records: response.data.inventoryHistorySummaryReport.items.map(item => flattenObject(item)) || []
      }
    } catch (e) {
      console.log(e)
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

  _validate() {
    if (!this.searchForm.shadowRoot.querySelector('form').checkValidity())
      throw new Error(i18next.t('text.invalid_form_value'))
    if (!this._bizplaceSelector.value) throw new Error(i18next.t('text.customer_does_not_selected'))
    if (!this._fromDateInput.value) throw new Error(i18next.t('text.from_date_is_empty'))
    if (!this._toDateInput.value) throw new Error(i18next.t('text.to_date_is_empty'))
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

  _modifyDateRange(e) {
    const fromDate = e.currentTarget.value

    if (this._toDateInput.value < fromDate) this._toDateInput.value = fromDate

    let min = new Date(fromDate)
    let today = new Date()
    today.setHours(0, 0, 0, 0)

    min = min.toISOString().split('T')[0]

    this._toDateInput.min = min
  }

  _submit(e) {
    this.searchForm.submit()
  }

  async _exportableData() {
    try {
      let header = [
        ...this.dataGrist._config.columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .map(column => {
            return column.imex
          })
      ]

      let data = (await this.fetchHandler({ page: 1, limit: 9999999 })).records

      return { header, data }
    } catch (e) {
      console.log(e)
    }
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

  _showInventoryInfo(columns, data, column, record, rowIndex) {
    openPopup(
      html` <inventory-by-product-detail .productId="${record['product|id']}"></inventory-by-product-detail> `,
      {
        backdrop: true,
        size: 'large',
        title: `${record['product|name']}`
      }
    )
  }
}

window.customElements.define('inventory-summary-report', InventorySummaryReport)
