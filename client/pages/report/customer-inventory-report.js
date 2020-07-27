import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { html, css } from 'lit-element'
import { client, PageView, store } from '@things-factory/shell'
import { gqlBuilder, flattenObject } from '@things-factory/utils'
import { connect } from 'pwa-helpers/connect-mixin'
import { localize, i18next } from '@things-factory/i18n-base'
import gql from 'graphql-tag'

class CustomerInventoryReport extends connect(store)(localize(i18next)(PageView)) {
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
      _products: Object,
      _date: String,
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
            text: this._date
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
        label: i18next.t('field.product'),
        name: 'product',
        type: 'string',
        props: { searchOper: 'in' }
      }
    ]
  }

  get reportConfig() {
    return {
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
      ],
      rows: {
        selectable: false,
        groups: [
          { column: 'product|name' },
          { column: 'packingType', title: 'Sub Total' },
          { column: 'batchId', title: 'Batch Total' }
        ],
        totals: ['qty', 'weight']
      }
    }
  }

  async pageInitialized() {
    this._searchFields = this.searchFields
    this._config = this.reportConfig

    let date = new Date()
    this._date = date.getFullYear().toString() + (date.getMonth()+1).toString() + date.getDate().toString()
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.report.fetch()
    }
  }

  stateChanged(state) {
    if (state.auth.user) this._user = state.auth && state.auth.user && state.auth.user.id
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
                }),
                ...[{ name: 'user', value: this._user, operator: 'eq' }]
              ],
              pagination: { page, limit },
              sortings: sorters
            })}) {              
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

  _validate() {
    if (!this.searchForm.shadowRoot.querySelector('form').checkValidity())
      throw new Error(i18next.t('text.invalid_form_value'))
    if (!this._user) throw new Error(i18next.t('text.customer_does_not_selected'))
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

  async fetchProducts() {
    const response = await client.query({
      query: gql`
            query {
              products(${gqlBuilder.buildArgs({
                filters: []
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
        ...response.data.products.items.map(item => {
          return {
            name: item.name,
            value: item.id
          }
        })
      ]
      this._searchFields = [...this._searchFields]
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

window.customElements.define('customer-inventory-report', CustomerInventoryReport)
