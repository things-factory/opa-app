import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, store } from '@things-factory/shell'
import { flattenObject, gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

class InventoryReport extends connect(store)(localize(i18next)(PageView)) {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      data-report {
        flex: 1;
      }
    `
  }

  static get properties() {
    return {
      _searchFields: Object,
      _config: Object,
      _bizplaces: Object,
      data: Object
    }
  }

  get context() {
    return {
      title: i18next.t('title.inventory_report'),
      printable: {
        accept: ['preview'],
        content: this
      },
      exportable: {
        name: i18next.t('title.date_inventory_report', {
          state: {
            text: (() => {
              let date = new Date()
              return date.getFullYear().toString() + (date.getMonth() + 1).toString() + date.getDate().toString()
            })()
          }
        }),
        data: this._exportableData.bind(this)
      }
    }
  }

  get report() {
    return this.shadowRoot.querySelector('data-report')
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
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.report.fetch()}></search-form>

      <data-report .config=${this._config} .fetchHandler=${this.fetchHandler.bind(this)}></data-report>
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
          ...this._bizplaces
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
        label: i18next.t('field.product_info'),
        name: 'product',
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
      }
    ]
  }

  get reportConfig() {
    return {
      rows: {
        selectable: false,
        groups: [
          { column: 'product|name' },
          { column: 'packingType', title: 'Sub Total' },
          { column: 'batchId', title: 'Batch Total' }
        ],
        totals: ['qty', 'weight']
      },
      columns: [
        {
          type: 'string',
          name: 'product|name',
          header: i18next.t('field.product'),
          sortable: false,
          imex: { header: i18next.t('field.product'), key: 'product|name', width: 75, type: 'string' },
          width: 400
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: false,
            align: 'center'
          },
          imex: { header: i18next.t('field.packing_type'), key: 'packingType', width: 25, type: 'string' },
          width: 180
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          sortable: false,
          imex: { header: i18next.t('field.batch_no'), key: 'batchId', width: 25, type: 'string' },
          width: 200
        },
        {
          type: 'string',
          name: 'orderName',
          header: i18next.t('field.order_no'),
          sortable: true,
          imex: { header: i18next.t('field.order_no'), key: 'orderName', width: 25, type: 'string' },
          width: 300
        },
        {
          type: 'string',
          name: 'orderRefNo',
          header: i18next.t('field.ref_no'),
          sortable: true,
          imex: { header: i18next.t('field.ref_no'), key: 'orderRefNo', width: 25, type: 'string' },
          width: 300
        },
        {
          type: 'string',
          name: 'createdAt',
          header: i18next.t('field.date'),
          record: { editable: false, align: 'left' },
          sortable: true,
          imex: { header: i18next.t('field.date'), key: 'createdAt', width: 25, type: 'string' },
          width: 110
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          sortable: true,
          imex: { header: i18next.t('field.qty'), key: 'qty', width: 25, type: 'string' },
          width: 100
        },
        {
          type: 'number',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          sortable: true,
          imex: { header: i18next.t('field.weight'), key: 'weight', width: 25, type: 'string' },
          width: 100
        }
      ]
    }
  }

  async pageInitialized() {
    this._products = []
    this._bizplaces = [...(await this._fetchBizplaceList())]

    this._searchFields = this.searchFields
    this._config = this.reportConfig
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.report.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      this._validate()

      const response = await client.query({
        query: gql`
          query {
            inventoryHistoryReport(${gqlBuilder.buildArgs({
              filters: [
                ...this.searchForm.queryFilters.map(filter => {
                  return filter
                })
              ],
              pagination: { page, limit },
              sortings: sorters
            })}) {
              palletId
              batchId
              bizplace {
                name
                description
              }
              product {
                name
                description
              }
              qty
              weight
              status
              packingType
              transactionType
              orderName
              orderRefNo
              createdAt
            }
          }
        `
      })
      return {
        total: 0,
        records:
          response.data.inventoryHistoryReport.map(item => {
            let date = new Date(parseInt(item.createdAt))
            return flattenObject({
              ...item,
              createdAt:
                date.getDate().toString() + '/' + (date.getMonth() + 1).toString() + '/' + date.getFullYear().toString()
            })
          }) || []
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

  _modifyDateRange(e) {
    const fromDate = e.currentTarget.value

    if (this._toDateInput.value < fromDate) this._toDateInput.value = fromDate

    let min = new Date(fromDate)
    let today = new Date()
    today.setHours(0, 0, 0, 0)

    min = min.toISOString().split('T')[0]

    this._toDateInput.min = min
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

  async _bizplaceChange(e) {
    let bizplace = [{ name: 'bizplace', operator: 'eq', value: e.currentTarget.value }]
    if (e.currentTarget.value == '') {
      this.searchFields
      this._searchFields.filter(x => x.name == 'product')[0].options = [{ name: 'All', value: '' }]
      this._searchFields = [...this._searchFields]
    } else {
      const response = await client.query({
        query: gql`
            query {
              productsByBizplace(${gqlBuilder.buildArgs({
                filters: [...bizplace]
              })}) {
                items {
                  id
                  name
                }
              }
            }
          `
      })

      if (!response.errors) {
        this.searchFields
        this._searchFields.filter(x => x.name == 'product')[0].options = [
          { name: 'All', value: '' },
          ...response.data.productsByBizplace.items.map(item => {
            return {
              name: item.name,
              value: item.id
            }
          })
        ]
        this._searchFields = [...this._searchFields]
      }
    }
  }

  _exportableData() {
    try {
      var headerSetting = [
        ...this.report._config.columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .map(column => {
            return column.imex
          })
      ]

      return {
        header: headerSetting,
        data: this.report.data.records,
        groups: this.report._config.rows.groups,
        totals: this.report._config.rows.totals
      }
    } catch (e) {
      this._showToast(e)
    }
  }
}

window.customElements.define('inventory-report', InventoryReport)
