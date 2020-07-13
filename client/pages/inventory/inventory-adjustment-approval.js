import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, store } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { ScrollbarStyles } from '@things-factory/styles'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

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

        .grist-container {
          overflow-y: hidden;
          display: flex;
          flex: 1;
        }

        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .grist-inventory-change {
          flex: 3;
        }

        .grist-inventory-changes-detail {
          flex: 2;
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
      _lockedPallet: Array,
      config: Object,
      data: Object,
      _detailData: Object,
      _compareColumn: Array
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <div class="grist-container">
        <div class="grist grist-inventory-change">
          <data-grist
            id="grist-inventory-change"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .fetchHandler="${this.fetchHandler.bind(this)}"
          ></data-grist>
        </div>
        <div class="grist grist-inventory-changes-detail">
          <data-grist
            id="grist-inventory-detail"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.detailGristConfig}
            .data="${this._detailData}"
          ></data-grist>
        </div>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.inventory_adjustment_approval'),
      actions: [
        {
          title: i18next.t('button.reject'),
          action: this._rejectInventoryChanges.bind(this)
        },
        {
          title: i18next.t('button.approve'),
          action: this._approveInventoryChanges.bind(this)
        }
      ]
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('#grist-inventory-change')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async pageInitialized() {
    this._lockedPallet = []
    this.location = await this.fetchLocation()
    const _userBizplaces = await this.fetchBizplaces()
    const _approvalStatus = await getCodeByName('APPROVAL_STATUS')

    this._compareColumn = [
      { column: 'batchId', name: 'Batch No' },
      { column: 'packingType', name: 'Packing Type' },
      { column: 'bizplace', name: 'Customer' },
      { column: 'product', name: 'Product' },
      { column: 'location', name: 'Location' },
      { column: 'qty', name: 'Quantity' },
      { column: 'weight', name: 'Weight' }
    ]

    this.config = {
      rows: {
        appendable: false,
        classifier: record => {
          return {
            emphasized: !!this._lockedPallet.find(changes => changes['id'] === record.id)
          }
        },
        selectable: {
          multiple: true
        },
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record) {
              let recordDiff = []
              let compareData = []

              switch (record.status.toLowerCase()) {
                case 'pending':
                  compareData = record.inventory
                  break
                case 'rejected':
                case 'approved':
                  compareData = record.lastInventoryHistory
                  compareData.qty = compareData.openingQty + compareData.qty
                  compareData.weight = compareData.openingWeight + compareData.weight
                  break
                default:
                  break
              }

              if (compareData != null) {
                this._compareColumn.map(item => {
                  let currentVal = ''
                  let updatedVal = ''

                  if (typeof compareData[item.column] === 'object') {
                    currentVal = compareData[item.column].name
                    updatedVal = record[item.column]?.name
                  } else {
                    currentVal = compareData[item.column]
                    updatedVal = record[item.column]
                  }

                  recordDiff.push({
                    column: item.name,
                    current: currentVal,
                    update: updatedVal != null && currentVal != updatedVal ? updatedVal : '[N/A]'
                  })
                })
              } else {
                this._compareColumn.map(item => {
                  recordDiff.push({
                    column: item.name,
                    current: '[N/A]',
                    update: typeof record[item.column] === 'object' ? record[item.column].name : record[item.column]
                  })
                })
              }

              this._detailData = {
                records: recordDiff
              }
            }
          }
        }
      },
      list: { fields: ['transactionType', 'status', 'palletId', 'customerName', 'creator', 'createdAt'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'transactionType',
          header: i18next.t('field.type'),
          record: { align: 'center' },
          sortable: true,
          width: 130
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          sortable: true,
          width: 130
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          sortable: true,
          width: 130
        },
        {
          type: 'string',
          name: 'customerName',
          header: i18next.t('field.customer'),
          sortable: true,
          width: 230
        },
        {
          type: 'object',
          name: 'creator',
          header: i18next.t('field.submitted_by'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'datetime',
          name: 'createdAt',
          header: i18next.t('field.submitted_at'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        }
      ]
    }

    this.detailGristConfig = {
      pagination: { infinite: true },
      list: { fields: ['column', 'current', 'update'] },
      rows: {
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'column',
          header: i18next.t('field.column'),
          record: { align: 'left' },
          sortable: false,
          width: 130
        },
        {
          type: 'string',
          name: 'current',
          header: i18next.t('field.before'),
          record: { align: 'left' },
          sortable: false,
          width: 240
        },
        {
          type: 'string',
          name: 'update',
          header: i18next.t('field.after'),
          record: { align: 'left' },
          sortable: false,
          width: 240
        }
      ]
    }

    this._searchFields = [
      {
        label: i18next.t('field.customer'),
        name: 'inventory.bizplace',
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
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.pallet_id'),
        name: 'palletId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'select',
        options: [
          { value: '' },
          ..._approvalStatus.map(stat => {
            return {
              name: stat.name,
              value: stat.name
            }
          })
        ],
        props: { searchOper: 'eq' }
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
              inventory{ 
                batchId
                packingType
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
                location {
                  id
                  name
                  description
                }
                qty
                weight
              }
              batchId
              packingType
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
              location {
                id
                name
                description
              }
              qty
              weight
              status
              transactionType
              lastInventoryHistory{ 
                batchId
                packingType
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
                location {
                  id
                  name
                  description
                }
                openingQty
                qty
                openingWeight
                weight
              }
              createdAt
              updatedAt
              creator {
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
      total: response.data.inventoryChanges.total || 0,
      records:
        response.data.inventoryChanges.items.map(item => {
          return { ...item, customerName: item?.inventory?.bizplace?.name || item.bizplace.name }
        }) || []
    }
  }

  async _approveInventoryChanges() {
    var patches = this.dataGrist.selected
      .filter(item => item.status.toLowerCase() == 'pending')
      .map(item => {
        return { id: item.id }
      })
    if (patches && patches.length) {
      const response = await client.query({
        query: gql`
          mutation {
            approveInventoryChanges(${gqlBuilder.buildArgs({
              patches
            })}) {              
                items {
                  id
                }
                total
            }
          }
        `
      })
      if (!response.errors) {
        this._lockedPallet = response.data.approveInventoryChanges.items
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              level: response.data.approveInventoryChanges.total > 0 ? 'error' : 'info',
              message:
                response.data.approveInventoryChanges.total > 0
                  ? 'Highlighted pallet could not be approved due to ongoing process.'
                  : i18next.t('text.data_approved'),
              option: {
                timer: 7000
              }
            }
          })
        )
        this.dataGrist.fetch()
      }
    }
  }

  async _rejectInventoryChanges() {
    var patches = this.dataGrist.selected
      .filter(item => item.status.toLowerCase() == 'pending')
      .map(item => {
        return { id: item.id }
      })
    if (patches && patches.length) {
      const response = await client.query({
        query: gql`
          mutation {
            rejectInventoryChanges(${gqlBuilder.buildArgs({
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
              message: i18next.t('text.data_rejected')
            }
          })
        )
      }
    }
  }

  get _columns() {
    return this.config.columns
  }

  stateChanged(state) {}

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
