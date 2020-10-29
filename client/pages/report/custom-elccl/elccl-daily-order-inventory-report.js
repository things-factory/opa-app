import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, store } from '@things-factory/shell'
import { flattenObject, gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

class ElcclDailyOrderInventoryReport extends connect(store)(localize(i18next)(PageView)) {
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
      title: i18next.t('title.daily_order_inventory_report'),
      exportable: {
        name: i18next.t('title.daily_order_inventory_report'),
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

  get _monthInput() {
    return this.searchForm.shadowRoot.querySelector('input[name=month]')
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
        label: i18next.t('field.month'),
        name: 'month',
        type: 'month',
        props: {
          searchOper: 'eq'
        },
        value: (() => {
          let date = new Date()
          return date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0)
        })()
      }
    ]
  }

  get reportConfig() {
    return {
      list: {
        fields: [
          'batchId',
          'product|name',
          'packingType',
          'initialDate',
          'initialQty',
          'adjustmentQty',
          'totalOutQty',
          'closingQty'
        ]
      },
      rows: {
        selectable: false,
        insertable: false,
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.batchId'), key: 'batchId', width: 15, type: 'string' },
          header: i18next.t('field.batchId'),
          width: 180
        },
        {
          type: 'string',
          name: 'product|name',
          header: i18next.t('field.product'),
          record: { editable: false, align: 'left' },
          imex: { header: i18next.t('field.product'), key: 'product|name', width: 75, type: 'string' },
          width: 320
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
          type: 'date',
          name: 'initialDate',
          header: i18next.t('field.initial_inbound_date'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.initial_inbound_date'), key: 'initialDate', width: 25, type: 'date' },
          width: 180
        },
        {
          type: 'float',
          name: 'initialQty',
          header: i18next.t('field.initial_inbound_qty'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.initial_inbound_qty'), key: 'initialQty', width: 25, type: 'string' },
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
      let filter = this.searchForm.queryFilters

      var datetime = new Date()
      var tzoffset = datetime.getTimezoneOffset() * 60000

      const response = await client.query({
        query: gql`
            query {
              elcclDailyOrderInventoryReport(${gqlBuilder.buildArgs({
                filters: [...filter, { name: 'tzoffset', value: tzoffset }],
                pagination: { page, limit },
                sortings: sorters
              })}) {
                items{
                  bag
                  bagRunningTotal
                  basket
                  basketRunningTotal
                  carton
                  cartonRunningTotal
                  createdAt
                  doRefNo
                  orderNo
                  orderRefNo
                  pallet
                  palletRunningTotal
                }
                total
              }
            }
          `
      })
      return {
        total: response.data.elcclDailyOrderInventoryReport.total,
        records: response.data.elcclDailyOrderInventoryReport.items.map(item => flattenObject(item)) || []
      }
    } catch (e) {
      // console.log(e)
      this._showToast(e)
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
    if (!this._monthInput.value) throw new Error(i18next.t('text.month_is_empty'))
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
      this._showToast(e)
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
}

window.customElements.define('elccl-daily-order-inventory-report', ElcclDailyOrderInventoryReport)
