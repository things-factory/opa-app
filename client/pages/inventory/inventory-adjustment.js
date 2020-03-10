import { USBPrinter } from '@things-factory/barcode-base'
import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import { PALLET_LABEL_SETTING_KEY } from '../../setting-constants'
import '../components/import-pop-up'
import './inventory-history-by-pallet'

class InventoryAdjustment extends connect(store)(localize(i18next)(PageView)) {
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
        @record-change="${this._customerChange.bind(this)}"
        @field-change="${this._updateAmount.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.inventory_adjustment'),
      actions: [
        {
          title: i18next.t('button.pallet_label_print'),
          action: this._printPalletLabel.bind(this)
        },
        {
          title: i18next.t('button.save'),
          action: this._saveInventories.bind(this)
        }
      ],
      printable: {
        accept: ['preview'],
        content: this
      },
      exportable: {
        name: i18next.t('title.inventory_adjustment'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
    }
  }

  async pageInitialized() {
    this.location = await this.fetchLocation()
    const _userBizplaces = await this.fetchBizplaces()
    const _packingType = await getCodeByName('PACKING_TYPES')

    this.config = {
      list: {
        fields: ['palletId', 'product', 'bizplace', 'qty', 'location']
      },
      rows: {
        handlers: { click: this._setProductRefCondition.bind(this) },
        selectable: {
          multiple: true
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: this._showInventoryMovement.bind(this)
          }
        },
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
            editable: true,
            align: 'left'
          },
          imex: { header: i18next.t('field.batch_no'), key: 'batchId', width: 30, type: 'string' },
          sortable: true,
          width: 120
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: {
            editable: true,
            align: 'left',
            options: {
              queryName: 'bizplaces'
            }
          },
          imex: {
            header: i18next.t('field.customer'),
            key: 'bizplace.name',
            width: 50,
            type: 'array',
            arrData: []
          },
          sortable: true,
          width: 300
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            editable: true,
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
          imex: {
            header: i18next.t('field.product'),
            key: 'product.name',
            width: 50,
            type: 'array',
            arrData: []
          },
          sortable: true,
          width: 500
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: true,
            align: 'left',
            codeName: 'PACKING_TYPES'
          },
          imex: {
            header: i18next.t('field.packing_type'),
            key: 'packingType',
            width: 25,
            type: 'array',
            arrData: _packingType.map(packingType => {
              return {
                name: packingType.name,
                id: packingType.name
              }
            })
          },
          width: 150
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { editable: true, align: 'center' },
          sortable: true,
          imex: {
            header: i18next.t('field.qty'),
            key: 'qty',
            width: 10,
            type: 'float'
          },
          width: 80
        },
        {
          type: 'number',
          name: 'lockedQty',
          header: i18next.t('field.release_qty'),
          record: { editable: false, align: 'center' },
          sortable: false,
          width: 80
        },
        {
          type: 'number',
          name: 'remainingQty',
          header: i18next.t('field.remain_qty'),
          record: { editable: false, align: 'center' },
          sortable: false,
          width: 80
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.total_weight'),
          record: { align: 'center', editable: true },
          sortable: true,
          imex: {
            header: i18next.t('field.total_weight'),
            key: 'weight',
            width: 10,
            type: 'float'
          },
          width: 80
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: {
            editable: true,
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
          imex: {
            header: i18next.t('field.location'),
            key: 'location.name',
            width: 15,
            type: 'array',
            arrData: this.location
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
        name: 'bizplaceId',
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
        name: 'product',
        type: 'object',
        queryName: 'products',
        field: 'name'
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
          inventories(${gqlBuilder.buildArgs({
            filters: [...filters, { name: 'status', operator: 'notin', value: ['INTRANSIT', 'TERMINATED', 'DELETED'] }],
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
              remainQty
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

    response.data.inventories.items = response.data.inventories.items.map(item => {
      return {
        ...item,
        lockedQty: item.qty - item.remainQty,
        remainingQty: item.remainQty
      }
    })

    return {
      total: response.data.inventories.total || 0,
      records: response.data.inventories.items || []
    }
  }

  async fetchInventoriesForExport() {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
        query {
          inventories(${gqlBuilder.buildArgs({
            filters: [...filters, { name: 'status', operator: 'notin', value: ['INTRANSIT', 'TERMINATED', 'DELETED'] }],
            pagination: { page: 1, limit: 9999999 },
            sortings: []
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
            }
            total
          }
        }
      `
    })

    return response.data.inventories.items || []
  }

  _setProductRefCondition(columns, data, column, record, rowIndex) {
    this.config.columns.map(column => {
      if (column.name === 'product') {
        if (record && record.bizplace && record.bizplace.id) {
          column.record.options.basicArgs = {
            filters: [{ name: 'bizplace', operator: 'eq', value: record.bizplace.id }]
          }
        }
      }
    })
  }

  _customerChange(event) {
    const record = event.detail
    const columnName = event.detail.column.name

    if (columnName === 'bizplace' && record.before.bizplace.id != record.after.bizplace.id) {
      delete this.dataGrist._data.records[event.detail.row].product
    }
  }

  _updateAmount(e) {
    switch (e.detail.column.name) {
      case 'weight':
        if (e.detail.after < 0) this.dataGrist._data.records[e.detail.row].weight = 0
        break
      case 'qty':
        if (e.detail.after < 0) this.dataGrist._data.records[e.detail.row].qty = 0
        break
      default:
        break
    }
  }

  async _saveInventories() {
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
              message: i18next.t('text.data_submitted_for_approval')
            }
          })
        )
      }
    }
  }

  get _columns() {
    return this.config.columns
  }

  async importHandler(patches) {
    patches.map(itm => {
      itm.qty = parseFloat(itm.qty)
      itm.weight = parseFloat(itm.weight)
    })

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
      history.back()
      this.dataGrist.fetch()
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            message: i18next.t('text.data_submitted_for_approval')
          }
        })
      )
    }
  }

  _importableData(records) {
    setTimeout(() => {
      openPopup(
        html`
          <import-pop-up
            .records=${records}
            .config=${{
              rows: this.config.rows,
              columns: [...this.config.columns.filter(column => column.imex !== undefined)]
            }}
            .importHandler="${this.importHandler.bind(this)}"
          ></import-pop-up>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.import')
        }
      )
    }, 500)
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

      const bizplaceFilters = (await this.searchForm.getQueryFilters()).filter(x => x.name === 'bizplaceId')

      if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
        records = this.dataGrist.selected
        data = records
      } else {
        if (bizplaceFilters.length == 0) {
          throw new Error(`Please select a customer for export.`)
        }
        data = await this.fetchInventoriesForExport()
      }

      let bizplace = await this.fetchBizplaces(bizplaceFilters)
      let product = await this.fetchProduct(bizplaceFilters)

      headerSetting = headerSetting.map(column => {
        switch (column.key) {
          case 'bizplace.name':
            column.arrData = bizplace
            break
          case 'product.name':
            column.arrData = product
            break
          default:
            break
        }
        return column
      })

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

  _showInventoryMovement(columns, data, column, record, rowIndex) {
    openPopup(
      html`
        <inventory-history-by-pallet .palletId="${record.palletId}"></inventory-history-by-pallet>
      `,
      {
        backdrop: true,
        size: 'large',
        title: `${record.palletId} - History`
      }
    )
  }

  async _printPalletLabel() {
    const records = this.dataGrist.selected
    var labelId = this._palletLabel && this._palletLabel.id

    if (!labelId) {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: `${i18next.t('text.no_label_setting_was_found')}. ${i18next.t('text.please_check_your_setting')}`
          }
        })
      )
    } else {
      for (var record of records) {
        let rawDate = record.createdAt
        let date = new Date(parseInt(rawDate))

        let month = '' + (date.getMonth() + 1)
        let day = '' + date.getDate()
        let year = date.getFullYear()

        if (month.length < 2) month = '0' + month
        if (day.length < 2) day = '0' + day

        const dateIn = [year, month, day].join('/')

        var searchParams = new URLSearchParams()

        /* for pallet record mapping */
        searchParams.append('pallet', record.palletId)
        searchParams.append('batch', record.batchId)
        searchParams.append('product', record.product.name)
        searchParams.append('type', record.product.type)
        searchParams.append('customer', record.bizplace.name)
        searchParams.append('packing', record.packingType)
        searchParams.append('date', dateIn)

        try {
          const response = await fetch(`/label-command/${labelId}?${searchParams.toString()}`, {
            method: 'GET'
          })

          if (response.status !== 200) {
            throw `Error : Can't get label command from server (response: ${response.status})`
          }

          var command = await response.text()

          if (!this.printer) {
            this.printer = new USBPrinter()
          }

          await this.printer.connectAndPrint(command)
        } catch (e) {
          this._showToast(e)

          delete this.printer
          break
        }
      }
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

window.customElements.define('inventory-adjustment', InventoryAdjustment)
