import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { html, css } from 'lit-element'
import { client, PageView, store } from '@things-factory/shell'
import { gqlBuilder, flattenObject, isMobileDevice } from '@things-factory/utils'
import { connect } from 'pwa-helpers/connect-mixin'
import { localize, i18next } from '@things-factory/i18n-base'
import gql from 'graphql-tag'
import { getCodeByName } from '@things-factory/code-base'

class InventoryPalletStorageReport extends connect(store)(localize(i18next)(PageView)) {
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
      _locationTypes: Object,
      data: Object
    }
  }

  get context() {
    return {
      title: i18next.t('title.inventory_pallet_storage_report'),
      exportable: {
        name: i18next.t('title.inventory_pallet_storage_report'),
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
        label: i18next.t('field.location_type'),
        name: 'locationType',
        type: 'select',
        options: [
          { value: '' },
          ...this._locationTypes.map(locType => {
            return {
              name: locType.name,
              value: locType.name
            }
          })
        ],
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.zone'),
        name: 'zone',
        type: 'text',
        props: { searchOper: 'i_like' }
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
      list: {
        fields: ['location|zone', 'location|name', 'location|type', 'palletId']
      },
      rows: {
        selectable: false
      },
      columns: [
        {
          type: 'string',
          name: 'location|zone',
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.zone'), key: 'location|zone', width: 15, type: 'string' },
          header: i18next.t('field.zone'),
          width: 80
        },
        {
          type: 'string',
          name: 'location|name',
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.location'), key: 'location|name', width: 25, type: 'string' },
          header: i18next.t('field.location'),
          width: 150
        },
        {
          type: 'string',
          name: 'location|type',
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.location_type'), key: 'location|type', width: 25, type: 'string' },
          header: i18next.t('field.location_type'),
          width: 150
        },
        {
          type: 'string',
          name: 'palletId',
          record: { editable: false, align: 'left' },
          imex: { header: i18next.t('field.palletId'), key: 'palletId', width: 200, type: 'string' },
          header: i18next.t('field.palletId'),
          width: 900
        }
      ]
    }
  }

  async pageInitialized() {
    this._products = []
    this._userBizplaces = [...(await this._fetchBizplaceList())]
    this._locationTypes = await getCodeByName('LOCATION_TYPE')

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
            inventoryHistoryPalletStorageReport(${gqlBuilder.buildArgs({
              filters: filter,
              pagination: { page, limit },
              sortings: sorters
            })}) {
              items{
                bizplace {
                  name
                }
                location {
                  name
                  type
                  zone
                }
                palletId
              }
              total
            }
          }
        `
      })
      return {
        total: response.data.inventoryHistoryPalletStorageReport.total,
        records: response.data.inventoryHistoryPalletStorageReport.items.map(item => flattenObject(item)) || []
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

window.customElements.define('inventory-pallet-storage-report', InventoryPalletStorageReport)
