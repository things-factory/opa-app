import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { openPopup } from '@things-factory/layout-base'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, navigate, PageView, store } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import './cycle-count-popup'

class OnhandInventory extends connect(store)(localize(i18next)(PageView)) {
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
      _email: String,
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
      title: i18next.t('title.onhand_inventory'),
      actions: [
        {
          title: i18next.t('button.cycle_count'),
          action: this._createCycleCount.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.onhand_inventory'),
        data: this._exportableData.bind(this)
      }
    }
  }

  async pageInitialized() {
    const _userBizplaces = await this.fetchBizplaces()
    const _packingType = await getCodeByName('PACKING_TYPES')
    this.config = {
      list: {
        fields: ['palletId', 'product', 'bizplace', 'location']
      },
      pagination: { pages: [10, 20, 50, 999] },
      rows: {
        selectable: {
          multiple: true
        },
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          imex: { header: i18next.t('field.pallet_id'), key: 'palletId', width: 25, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'left'
          },
          imex: { header: i18next.t('field.batch_no'), key: 'batchId', width: 30, type: 'string' },
          sortable: true,
          width: 120
        },
        {
          type: 'datetime',
          name: 'initialInboundAt',
          header: i18next.t('field.initial_inbound_date'),
          record: { align: 'center' },
          sortable: true,
          imex: { header: i18next.t('field.initial_inbound_date'), key: 'initialInboundAt', width: 75, type: 'date' },
          width: 150
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: {
            align: 'left',
            options: {
              queryName: 'bizplaces'
            }
          },
          imex: {
            header: i18next.t('field.customer'),
            key: 'bizplace.name',
            width: 50,
            type: 'string'
          },
          sortable: true,
          width: 300
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          imex: {
            header: i18next.t('field.product'),
            key: 'product.name',
            width: 50,
            type: 'string'
          },
          sortable: true,
          width: 500
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: false,
            align: 'left',
            codeName: 'PACKING_TYPES'
          },
          imex: {
            header: i18next.t('field.packing_type'),
            key: 'packingType',
            width: 50,
            type: 'string'
          },
          width: 150
        },
        {
          type: 'number',
          name: 'remainQty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.qty'), key: 'qty', width: 30, type: 'number' },
          sortable: true,
          width: 80
        },
        {
          type: 'float',
          name: 'uomValue',
          header: i18next.t('field.total_uom_value'),
          record: { align: 'center' },
          sortable: true,
          imex: { header: i18next.t('field.total_uom_value'), key: 'uomValue', width: 30, type: 'float' },
          width: 110
        },
        {
          type: 'string',
          name: 'uom',
          header: i18next.t('field.uom'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.uom'), key: 'uom', width: 25, type: 'string' },
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          imex: {
            header: i18next.t('field.location'),
            key: 'location.name',
            width: 15,
            type: 'string'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'left' },
          imex: { header: i18next.t('field.uom'), key: 'uom', width: 40, type: 'string' },
          sortable: true,
          width: 200
        }
      ]
    }

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
            .sort(this._compareValues('name', 'asc'))
        ],
        props: { searchOper: 'in' }
      },
      {
        label: i18next.t('field.product'),
        name: 'product',
        type: 'text',
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.batch_no'),
        name: 'batchId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.pallet_id'),
        name: 'palletId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.packing_type'),
        name: 'packingType',
        type: 'select',
        options: [
          { value: '' },
          ..._packingType.map(packingType => {
            return {
              name: packingType.name,
              value: packingType.name
            }
          })
        ],
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.location'),
        name: 'location',
        type: 'object',
        queryName: 'locations',
        field: 'name'
      },
      {
        label: i18next.t('field.date'),
        name: 'created_at',
        type: 'date',
        props: {
          searchOper: 'eq',
          max: new Date().toISOString().split('T')[0]
        },
        value: new Date().toISOString().split('T')[0]
      }
    ]
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
        query {
          onhandInventories(${gqlBuilder.buildArgs({
            filters: [
              ...filters,
              { name: 'status', operator: 'notin', value: ['INTRANSIT', 'TERMINATED', 'DELETED'] },
              { name: 'remainOnly', operator: 'eq', value: true },
              { name: 'unlockOnly', operator: 'eq', value: true },
              { name: 'timezoneOffset', operator: 'eq', value: new Date().getTimezoneOffset() }
            ],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              palletId
              batchId
              packingType
              uom
              uomValue
              bizplace {
                id
                name
                description
              }
              product {
                id
                name
                description                
              }
              qty
              remainQty
              warehouse {
                id
                name
                description
              }
              location {
                id
                name
                description
              }
              updatedAt
              updater {
                name
                description
              }
              initialInboundAt
              remark
            }
            total
          }
        }
      `
    })

    return {
      total: response.data.onhandInventories.total || 0,
      records: response.data.onhandInventories.items || []
    }
  }

  async fetchInventoriesForExport() {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
        query {
          onhandInventories(${gqlBuilder.buildArgs({
            filters: [
              ...filters,
              { name: 'status', operator: 'notin', value: ['INTRANSIT', 'TERMINATED', 'DELETED'] },
              { name: 'timezoneOffset', operator: 'eq', value: new Date().getTimezoneOffset() }
            ],
            pagination: { page: 1, limit: 9999999 },
            sortings: []
          })}) {
            items {
              id
              palletId
              batchId
              packingType
              uom
              uomValue
              bizplace {
                id
                name
                description
              }
              product {
                id
                name
              }
              qty
              warehouse {
                id
                name
                description
              }
              zone
              location {
                id
                name
                description
              }
              updatedAt
              updater {
                name
                description
              }
              initialInboundAt
            }
            total
          }
        }
      `
    })

    return response.data.onhandInventories.items || []
  }

  get _columns() {
    return this.config.columns
  }

  _createCycleCount() {
    const _selectedInventory = this.dataGrist.selected
    try {
      if (_selectedInventory && _selectedInventory.length == 0)
        throw new Error(i18next.t('text.there_is_no_selected_inventory'))
      openPopup(
        html`
          <cycle-count-popup
            .selectedInventory="${_selectedInventory}"
            @completed="${() => {
              navigate('inventory_check_list')
            }}"
          ></cycle-count-popup>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.create_cycle_count')
        }
      )
    } catch (e) {
      this._showToast(e)
    }
  }

  async _exportableData() {
    try {
      let records = []
      let data = []

      var headerSetting = [
        ...this.dataGrist._config.columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .map(column => {
            return column.imex
          })
      ]

      if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
        records = this.dataGrist.selected
        data = records
      } else {
        const bizplaceFilters = (await this.searchForm.getQueryFilters()).filter(x => x.name === 'bizplaceId')
        if (bizplaceFilters.length == 0) {
          throw new Error(`Please select a customer for export.`)
        }
        data = await this.fetchInventoriesForExport()
      }

      data = data.map(item => {
        return {
          id: item.id,
          ...this._columns
            .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
            .reduce((record, column) => {
              record[column.imex.key] = column.imex.key
                .split('.')
                .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
              return record
            }, {})
        }
      })

      return { header: headerSetting, data: data }
    } catch (e) {
      this._showToast(e)
    }
  }

  async fetchBizplaces() {
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
    return response.data.bizplaces.items
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

  stateChanged(state) {
    this._email = state.auth && state.auth.user && state.auth.user.email
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

window.customElements.define('onhand-inventory', OnhandInventory)
