import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

class InventoryHistory extends connect(store)(localize(i18next)(PageView)) {
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
          overflow-y: auto;
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
      _email: String,
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
      title: i18next.t('title.inventory_histories'),
      actions: [],
      exportable: {
        name: i18next.t('title.inventory_histories'),
        data: this._exportableData.bind(this)
      }
    }
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

  async updated(changedProps) {
    if (changedProps.has('_email')) {
      const _userBizplaces = await this._fetchUserBizplaces()

      this._searchFields = [
        {
          label: i18next.t('field.customer'),
          name: 'bizplace',
          type: 'select',
          options: [
            { value: '' },
            ..._userBizplaces
              .filter(userBizplaces => !userBizplaces.mainBizplace)
              .map(userBizplace => {
                return {
                  name: userBizplace.name,
                  value: userBizplace.id
                }
              })
          ],
          props: { searchOper: 'like' },
          attrs: ['custom']
        },
        {
          label: i18next.t('field.from_date'),
          name: 'fromDate',
          type: 'date',
          props: {
            searchOper: 'eq',
            max: new Date().toISOString().split('T')[0]
          },
          attrs: ['custom'],
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
          attrs: ['custom'],
          value: new Date().toISOString().split('T')[0]
        },
        {
          label: i18next.t('field.warehouse'),
          name: 'warehouseName',
          type: 'text',
          props: { searchOper: 'like' },
          attrs: ['custom']
        },
        {
          label: i18next.t('field.zone'),
          name: 'zone',
          type: 'text',
          props: { searchOper: 'like' }
        },
        {
          label: i18next.t('field.location'),
          name: 'locationName',
          type: 'text',
          props: { searchOper: 'like' },
          attrs: ['custom']
        },
        {
          label: i18next.t('field.pallet_id'),
          name: 'palletId',
          type: 'text',
          props: { searchOper: 'like' }
        },
        {
          label: i18next.t('field.batch_id'),
          name: 'batchId',
          type: 'text',
          props: { searchOper: 'like' }
        },
        {
          label: i18next.t('field.product'),
          name: 'productName',
          type: 'text',
          props: { searchOper: 'eq' },
          attrs: ['custom']
        }
      ]
    }
  }

  pageInitialized() {
    this.config = {
      rows: { appendable: false },
      list: { fields: ['product', 'location', 'updatedAt'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          sortable: true,
          width: 200
        },
        {
          type: 'integer',
          name: 'seq',
          header: i18next.t('field.seq'),
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          sortable: true,
          width: 150
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'right' },
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'warehouse',
          header: i18next.t('field.warehouse'),
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          sortable: true,
          width: 200
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          sortable: true,
          width: 150
        }
      ]
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async _fetchUserBizplaces() {
    if (!this._email) return
    const response = await client.query({
      query: gql`
        query {
          userBizplaces(${gqlBuilder.buildArgs({
            email: this._email
          })}) {
            id
            name
            description
            mainBizplace
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.userBizplaces
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      this._validate()
      let inventoryHistory = {}
      let filters = []
      const _customFields = this.searchForm
        .getFields()
        .filter(field => field.hasAttribute('custom'))
        .map(field => field.name)
      this.searchForm.queryFilters.forEach(filter => {
        if (_customFields.includes(filter.name)) {
          if (filter.name === 'bizplace') {
            inventoryHistory[filter.name] = { id: filter.value }
          } else {
            inventoryHistory[filter.name] = filter.value
          }
        } else {
          filters.push(filter)
        }
      })
      const response = await client.query({
        query: gql`
          query {
            bizplaceInventoryHistories(${gqlBuilder.buildArgs({
              inventoryHistory,
              filters,
              pagination: { page, limit },
              sortings: sorters
            })}) {
              items {
                seq
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
                warehouse {
                  name
                  description
                }
                zone
                location {
                  name
                  description
                }
                updatedAt
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

      return {
        total: response.data.bizplaceInventoryHistories.total || 0,
        records: response.data.bizplaceInventoryHistories.items || []
      }
    } catch (e) {
      this._showToast(e)
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
    this._toDateInput.value = ''
    const fromDate = e.currentTarget.value
    let min = new Date(fromDate)
    let max = new Date(fromDate)
    max.setMonth(max.getMonth() + 1)
    max.setHours(0, 0, 0, 0)
    let today = new Date()
    today.setHours(0, 0, 0, 0)

    if (max >= today) max = today
    min = min.toISOString().split('T')[0]
    max = max.toISOString().split('T')[0]

    this._fromDateInput.max = max
    this._toDateInput.min = min
    this._toDateInput.max = max
  }

  stateChanged(state) {
    this._email = state.auth && state.auth.user && state.auth.user.email
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

window.customElements.define('inventory-history', InventoryHistory)
