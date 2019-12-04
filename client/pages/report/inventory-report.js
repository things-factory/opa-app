import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { html, css } from 'lit-element'
import {
  client,
  gqlBuilder,
  isMobileDevice,
  PageView,
  ScrollbarStyles,
  store,
  flattenObject
} from '@things-factory/shell'
import { connect } from 'pwa-helpers/connect-mixin'
import { localize, i18next } from '@things-factory/i18n-base'
import gql from 'graphql-tag'
import { getCodeByName } from '@things-factory/code-base'

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
      _userBizplaces: Object,
      _email: String,
      data: Object
    }
  }

  get context() {
    return {
      title: 'Inventory Report',
      printable: {
        accept: ['preview'],
        content: this
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
          ...this._userBizplaces.map(bizplaceList => {
            return {
              name: bizplaceList.name,
              value: bizplaceList.id
            }
          })
        ],
        props: { searchOper: 'eq' }
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
      }
    ]
  }

  get reportConfig() {
    return {
      columns: [
        {
          type: 'string',
          name: 'bizplace|name',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: false,
          width: 250
        },
        {
          type: 'string',
          name: 'product|name',
          header: i18next.t('field.product'),
          sortable: false,
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
          width: 180
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          sortable: false,
          width: 200
        },
        {
          type: 'string',
          name: 'orderName',
          header: i18next.t('field.order_no'),
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'orderRefNo',
          header: i18next.t('field.ref_no'),
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'createdAt',
          header: i18next.t('field.date'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 110
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          sortable: true,
          width: 100
        }
      ],
      rows: {
        selectable: false,
        groups: [
          { column: 'bizplace|name' },
          { column: 'product|name' },
          { column: 'packingType', title: 'Packing Type Total' },
          { column: 'batchId', title: 'Batch Total' }
        ],
        totals: ['qty']
      }
    }
  }

  async pageInitialized() {
    this._userBizplaces = [...(await this._fetchBizplaceList())]

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
          userBizplaces(${gqlBuilder.buildArgs({
            email: ''
          })}) {
            id
            name
            description
            assigned
            mainBizplace
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.userBizplaces.filter(x => x.assigned == true)
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
}

window.customElements.define('inventory-report', InventoryReport)
