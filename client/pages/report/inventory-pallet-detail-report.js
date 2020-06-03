import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { html, css } from 'lit-element'
import { client, PageView, store } from '@things-factory/shell'
import { gqlBuilder, flattenObject } from '@things-factory/utils'
import { connect } from 'pwa-helpers/connect-mixin'
import { localize, i18next } from '@things-factory/i18n-base'
import gql from 'graphql-tag'

class InventoryPalletDetailReport extends connect(store)(localize(i18next)(PageView)) {
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
      data: Object
    }
  }

  get context() {
    return {
      title: i18next.t('title.inventory_pallet_detail_report'),
      printable: {
        accept: ['preview'],
        content: this
      },
      exportable: {
        name: i18next.t('title.inventory_pallet_detail_report'),
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

      <data-report
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
        label: i18next.t('field.product'),
        name: 'product',
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
      }
    ]
  }

  get reportConfig() {
    return {
      pagination: { infinite: true },
      rows: {
        selectable: false,
        groups: [{ column: 'product|name' }],
        totals: ['openingBalance', 'inBalance', 'outBalance', 'closingBalance']
      },
      columns: [
        {
          type: 'string',
          name: 'product|name',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.product'),
          imex: { header: i18next.t('field.product'), key: 'product|name', width: 75, type: 'string' },
          width: 450
        },
        {
          type: 'string',
          name: 'batchId',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.batchId'),
          imex: { header: i18next.t('field.batchId'), key: 'batchId', width: 25, type: 'string' },
          width: 200
        },
        {
          type: 'string',
          name: 'arrivalNoticeName',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.arrival_notice'),
          imex: { header: i18next.t('field.arrival_notice'), key: 'arrivalNoticeName', width: 25, type: 'string' },
          width: 200
        },
        {
          type: 'float',
          name: 'openingBalance',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.opening_balance'),
          imex: { header: i18next.t('field.opening_balance'), key: 'openingBalance', width: 25, type: 'string' },
          width: 160
        },
        {
          type: 'float',
          name: 'inBalance',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.inbound'),
          imex: { header: i18next.t('field.inbound'), key: 'inBalance', width: 25, type: 'string' },
          width: 160
        },
        {
          type: 'float',
          name: 'outBalance',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.outbound'),
          imex: { header: i18next.t('field.outbound'), key: 'outBalance', width: 25, type: 'string' },
          width: 160
        },
        {
          type: 'float',
          name: 'closingBalance',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.closing_balance'),
          imex: { header: i18next.t('field.closing_balance'), key: 'closingBalance', width: 25, type: 'string' },
          width: 160
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
      this.report.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      this._validate()

      const response = await client.query({
        query: gql`
          query {
            inventoryHistoryPalletDetailReport(${gqlBuilder.buildArgs({
              filters: [
                ...this.searchForm.queryFilters.map(filter => {
                  return filter
                })
              ],
              pagination: { page, limit },
              sortings: sorters
            })}) {
              bizplace {
                name
                description
              }
              product {
                name
                description
              }
              openingBalance
              inBalance
              outBalance
              closingBalance
              batchId
              arrivalNoticeName
            }
          }
        `
      })
      return {
        total: 0,
        records: response.data.inventoryHistoryPalletDetailReport.map(item => flattenObject(item)) || []
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

window.customElements.define('inventory-pallet-detail-report', InventoryPalletDetailReport)
