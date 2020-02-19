import { USBPrinter } from '@things-factory/barcode-base'
import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import { PALLET_LABEL_SETTING_KEY } from '../../setting-constants'
import '../components/import-pop-up'

class InventoryAdjustmentApproval extends connect(store)(localize(i18next)(PageView)) {
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
      _searchFields: Array,
      config: Object,
      data: Object,
      _palletLabel: Object
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
      title: i18next.t('title.inventory_adjustment_approval'),
      actions: [
        {
          title: i18next.t('button.approve'),
          action: this._approveInventoryChanges.bind(this)
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

  async pageInitialized() {
    this.location = await this.fetchLocation()
    const _userBizplaces = await this.fetchBizplaces()
    const _packingType = await getCodeByName('PACKING_TYPES')

    this.config = {
      list: {
        fields: ['palletId', 'product', 'bizplace', 'location']
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: {
            editable: false,
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: {
            editable: false,
            align: 'left',
            options: {
              queryName: 'bizplaces'
            }
          },
          sortable: true,
          width: 300
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            editable: false,
            align: 'left',
            options: {
              queryName: 'productsByBizplace',
              basicArgs: {
                filters: [{ name: 'bizplace', operator: 'eq', value: '' }]
              },
              select: [
                { name: 'id', hidden: true },
                { name: 'name', header: i18next.t('field.name'), width: 450 },
                { name: 'description', header: i18next.t('field.description'), width: 450 },
                { name: 'type', header: i18next.t('field.type'), width: 300 }
              ]
            }
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
          width: 150
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.total_weight'),
          record: { align: 'center', editable: false },
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: {
            editable: false,
            align: 'center',
            options: {
              queryName: 'locations',
              select: [
                { name: 'id', hidden: true },
                { name: 'description', hidden: true },
                { name: 'name', header: i18next.t('field.name'), sortable: true, record: { align: 'center' } },
                { name: 'zone', header: i18next.t('field.zone'), sortable: true, record: { align: 'center' } },
                { name: 'row', header: i18next.t('field.row'), sortable: true, record: { align: 'center' } },
                { name: 'column', header: i18next.t('field.column'), sortable: true, record: { align: 'center' } }
              ],
              list: { fields: ['name', 'zone', 'row', 'column'] }
            }
          },
          sortable: true,
          width: 120
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'center' },
          sortable: true,
          width: 150
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
        ],
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.product'),
        name: 'product.name',
        type: 'text',
        props: { searchOper: 'i_like' }
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
        name: 'location.name',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
        query {
          inventoryChanges(${gqlBuilder.buildArgs({
            filters: [...filters],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              palletId
              batchId
              packingType
              weight
              bizplace {
                id
                name
                description
              }
              product {
                id
                name
                description  
                type              
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
              createdAt
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
      total: response.data.inventories.total || 0,
      records: response.data.inventories.items || []
    }
  }

  async _approveInventoryChanges() {
    var patches = this.dataGrist.exportPatchList({ flagName: 'cuFlag' })
    patches.map(x => {
      delete x.productWeight
      if (x.bizplace) {
        delete x.bizplace['__seq__']
        delete x.bizplace['__origin__']
        delete x.bizplace['__selected__']
      }
      if (x.location) {
        delete x.location['row']
        delete x.location['zone']
        delete x.location['column']
        delete x.location['__seq__']
        delete x.location['__origin__']
        delete x.location['__selected__']
      }
      if (x.product) {
        delete x.product['productWeight']
        delete x.product['__seq__']
        delete x.product['__origin__']
        delete x.product['__selected__']
        delete x.product['type']
      }
      if (x.weight) {
        x.weight = parseFloat(x.weight)
      }
    })
    if (patches && patches.length) {
      const response = await client.query({
        query: gql`
            mutation {
              submitInventoryChanges(${gqlBuilder.buildArgs({
                patches
              })}) 
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.data_updated_successfully')
            }
          })
        )
      }
    }
  }

  get _columns() {
    return this.config.columns
  }

  stateChanged(state) {
    let palletLabelSetting = state.dashboard[PALLET_LABEL_SETTING_KEY]
    this._palletLabel = (palletLabelSetting && palletLabelSetting.board) || {}
  }

  async fetchBizplaces(bizplace = []) {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: [...bizplace]
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

  async fetchProduct(bizplace = []) {
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
    return response.data.productsByBizplace.items
  }

  async fetchLocation() {
    const response = await client.query({
      query: gql`
          query {
            locations(${gqlBuilder.buildArgs({
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
    return response.data.locations.items
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

window.customElements.define('inventory-adjustment-approval', InventoryAdjustmentApproval)