import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { html, css } from 'lit-element'
import { client, PageView, store } from '@things-factory/shell'
import { gqlBuilder, flattenObject } from '@things-factory/utils'
import { connect } from 'pwa-helpers/connect-mixin'
import { localize, i18next } from '@things-factory/i18n-base'
import gql from 'graphql-tag'

class CustomerInventoryPalletReport extends connect(store)(localize(i18next)(PageView)) {
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
      data: Object
    }
  }

  get context() {
    return {
      title: 'Inventory Pallet Report',
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

      <data-report
        .config=${this._config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get searchFields() {
    return [
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
          header: 'Products',
          width: 450
        },
        {
          type: 'float',
          name: 'openingBalance',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.opening_balance'),
          width: 160
        },
        {
          type: 'float',
          name: 'inBalance',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.inbound'),
          width: 160
        },
        {
          type: 'float',
          name: 'outBalance',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.outbound'),
          width: 160
        },
        {
          type: 'float',
          name: 'closingBalance',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.closing_balance'),
          width: 160
        }
      ]
    }
  }

  async pageInitialized() {
    this._products = []

    this._searchFields = this.searchFields
    this._config = this.reportConfig
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
            inventoryHistoryPalletReport(${gqlBuilder.buildArgs({
              filters: [
                ...this.searchForm.queryFilters.map(filter => {
                  return filter
                }),
                ...[{ name: 'user', value: this._user, operator: 'eq' }]
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
            }
          }
        `
      })
      return {
        total: 0,
        records: response.data.inventoryHistoryPalletReport.map(item => flattenObject(item)) || []
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
}

window.customElements.define('customer-inventory-pallet-report', CustomerInventoryPalletReport)
