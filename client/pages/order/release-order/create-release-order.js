import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { fetchLocationSortingRule } from '../../../fetch-location-sorting-rule'
import '../../components/vas-relabel'
import { INVENTORY_STATUS, ORDER_INVENTORY_STATUS, ORDER_TYPES, PICKING_STANDARD } from '../constants/'

class CreateReleaseOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _pickingStd: String,
      _ownTransport: Boolean,
      _exportOption: Boolean,
      _selectedInventories: Array,
      inventoryGristConfig: Object,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
      _releaseOrderNo: String,
      _template: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
        }
        .container {
          flex: 1;
          display: flex;
          overflow-y: auto;
        }
        .picking-std-container {
          margin-top: 0px;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .guide-container {
          max-width: 30vw;
          display: flex;
          flex-direction: column;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .grist h2 {
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }

        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }

        h2 + data-grist {
          padding-top: var(--grist-title-with-grid-padding);
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.create_release_order'),
      actions: this._actions
    }
  }

  get createButton() {
    return { title: i18next.t('button.submit'), action: this._generateReleaseOrder.bind(this) }
  }

  get adjustButton() {
    return {
      title: i18next.t('button.adjust'),
      action: async () => {
        const copied = Object.assign(this.vasData, {})
        try {
          this.vasData = {
            ...this.vasData,
            records: await Promise.all(
              this.vasGrist.dirtyData.records.map(async (record, idx) => {
                if (idx === this._selectedVasRecordIdx) {
                  record.operationGuide = await this._template.adjust()
                  record.ready = this._isReadyToCreate(record)
                }
                return record
              })
            )
          }
        } catch (e) {
          this._showToast(e)
          this.vasData = Object.assign(copied)
        }
      }
    }
  }

  render() {
    return html`
      <form name="releaseOrder" class="multi-column-form" autocomplete="off">
        <fieldset>
          <legend>${i18next.t('title.release_order')}</legend>
          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" />

          <label>${i18next.t('label.release_date')}</label>
          <input name="releaseDate" type="date" min="${this._getStdDate()}" />

          <label ?hidden="${!this._ownTransport || this._exportOption}">${i18next.t('label.co_no')}</label>
          <input name="collectionOrderNo" ?hidden="${!this._ownTransport || this._exportOption}" />

          <input
            id="exportOption"
            type="checkbox"
            name="exportOption"
            ?checked="${this._exportOption}"
            @change="${e => {
              this._exportOption = e.currentTarget.checked
            }}"
          />
          <label for="exportOption">${i18next.t('label.export')}</label>

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            @change="${e => (this._ownTransport = e.currentTarget.checked)}"
            ?hidden="${this._exportOption}"
          />
          <label for="ownTransport" ?hidden="${this._exportOption}">${i18next.t('label.own_transport')}</label>
        </fieldset>
      </form>

      <div class="so-form-container" ?hidden="${!this._exportOption || (this._exportOption && !this._ownTransport)}">
        <form name="shippingOrder" class="multi-column-form" autocomplete="off">
          <fieldset>
            <legend>${i18next.t('title.export_order')}</legend>
            <label>${i18next.t('label.container_no')}</label>
            <input name="containerNo" ?required="${this._exportOption}" />

            <label>${i18next.t('label.container_arrival_date')}</label>
            <input
              name="containerArrivalDate"
              type="date"
              @change="${e => {
                this._conLeavingDateInput.setAttribute('min', e.currentTarget.value)
              }}"
              min="${this._getStdDate()}"
              ?required="${this._exportOption}"
            />

            <label>${i18next.t('label.container_leaving_date')}</label>
            <input
              name="containerLeavingDate"
              type="date"
              min="${this._getStdDate()}"
              ?required="${this._exportOption}"
            />

            <label>${i18next.t('label.ship_name')}</label>
            <input name="shipName" ?required="${this._exportOption}" />
          </fieldset>
        </form>
      </div>

      <form class="picking-std-container multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.inventory_selection_strategy')}</legend>
          <input
            id="pick-by-prod"
            name="picking-std"
            type="radio"
            value="${PICKING_STANDARD.SELECT_BY_PRODUCT.value}"
            @change="${e => {
              this._pickingStd = e.currentTarget.value
            }}"
            ?checked="${this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value}"
          />
          <label for="pick-by-prod">${i18next.t(PICKING_STANDARD.SELECT_BY_PRODUCT.name)}</label>

          <input
            id="pick-by-pallet"
            name="picking-std"
            type="radio"
            value="${PICKING_STANDARD.SELECT_BY_PALLET.value}"
            @change="${e => {
              this._pickingStd = e.currentTarget.value
            }}"
            ?checked="${this._pickingStd === PICKING_STANDARD.SELECT_BY_PALLET.value}"
          />
          <label for="pick-by-pallet">${i18next.t(PICKING_STANDARD.SELECT_BY_PALLET.name)}</label>
        </fieldset>
      </form>

      <div class="container">
        <div class="grist">
          <h2>
            <mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_product_list')}${` [${i18next.t(
              PICKING_STANDARD[this._pickingStd].name
            )}]`}
          </h2>

          <data-grist
            id="inventory-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.inventoryGristConfig}
            .data=${this.inventoryData}
            @record-change="${this._onProductChangeHandler.bind(this)}"
            @field-change="${this._onInventoryFieldChanged.bind(this)}"
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

          <data-grist
            id="vas-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.vasGristConfig}
            .data="${this.vasData}"
            @field-change="${this._onVasFieldChanged.bind(this)}"
          ></data-grist>
        </div>

        <div class="guide-container">
          ${this._template}
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this._exportOption = false
    this._ownTransport = true
    this.inventoryData = { records: [] }
    this.vasData = { records: [] }
    this._pickingStd = PICKING_STANDARD.SELECT_BY_PRODUCT.value
  }

  get releaseOrderForm() {
    return this.shadowRoot.querySelector('form[name=releaseOrder]')
  }

  get _conLeavingDateInput() {
    return this.shadowRoot.querySelector('input[name=containerLeavingDate]')
  }

  get shippingOrderForm() {
    return this.shadowRoot.querySelector('form[name=shippingOrder]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async updated(changeProps) {
    if (changeProps.has('_pickingStd')) {
      await this.switchPickingType()
    }
  }

  async pageInitialized() {
    await this.switchPickingType()
    this._actions = [this.createButton]
  }

  async switchPickingType() {
    this._clearView()
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      this.inventoryGristConfig = this.inventoryGristConfig = {
        pagination: { infinite: true },
        rows: { selectable: { multiple: true } },
        list: { fields: ['inventory', 'product', 'location', 'releaseQty'] },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'gutter',
            gutterName: 'button',
            icon: 'close',
            handlers: {
              click: (columns, data, column, record, rowIndex) => {
                const newData = data.records.filter((_, idx) => idx !== rowIndex)
                this.inventoryData = { ...this.inventoryData, records: newData }
                this.inventoryGrist.dirtyData.records = newData
                this._updateInventoryList()
              }
            }
          },
          {
            type: 'object',
            name: 'inventory',
            header: i18next.t('field.inventory_list'),
            record: {
              editable: true,
              align: 'left',
              options: {
                queryName: 'inventoryProductGroup',
                basicArgs: { filters: [] },
                nameField: 'batchId',
                descriptionField: 'productName',
                select: [
                  { name: 'productId', hidden: true },
                  { name: 'batchId', header: i18next.t('field.batch_no'), record: { align: 'left' } },
                  { name: 'productName', header: i18next.t('field.product'), record: { align: 'left' }, width: 280 },
                  { name: 'packingType', header: i18next.t('field.packing_type'), record: { align: 'center' } },
                  {
                    name: 'remainQty',
                    header: i18next.t('field.remain_qty'),
                    record: { align: 'center' },
                    ignoreCondition: true
                  },
                  {
                    name: 'remainWeight',
                    header: i18next.t('field.remain_weight'),
                    record: { align: 'center' },
                    ignoreCondition: true
                  }
                ],
                list: { fields: ['batchId', 'productName', 'packingType', 'remainQty', 'remainWeight'] }
              }
            },
            width: 300
          },
          {
            type: 'code',
            name: 'packingType',
            header: i18next.t('field.packing_type'),
            record: {
              align: 'center',
              codeName: 'PACKING_TYPES'
            },
            width: 150
          },
          {
            type: 'integer',
            name: 'remainQty',
            header: i18next.t('field.available_qty'),
            record: { align: 'center' },
            width: 140
          },
          {
            type: 'integer',
            name: 'releaseQty',
            header: i18next.t('field.release_qty'),
            record: { editable: true, align: 'center', options: { min: 0 } },
            width: 140
          },
          {
            type: 'float',
            name: 'remainWeight',
            header: i18next.t('field.available_weight'),
            record: { align: 'center' },
            width: 140
          },
          {
            type: 'float',
            name: 'releaseWeight',
            header: i18next.t('field.release_weight'),
            record: { editable: true, align: 'center', options: { min: 0 } },
            width: 140
          }
        ]
      }

      this.vasGristConfig = {
        list: { fields: ['ready', 'vas', 'inventory', 'product', 'remark'] },
        pagination: { infinite: true },
        rows: {
          selectable: { multiple: true },
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (
                record &&
                record.vas &&
                record.vas.operationGuideType === 'template' &&
                record.vas.operationGuide &&
                record.inventory
              ) {
                this._template = document.createElement(record.vas.operationGuide)
                this._template.record = record
                this._template.operationGuide = record.operationGuide
              } else {
                this._template = null
              }
              this._selectedVasRecord = record
              this._selectedVasRecordIdx = rowIndex
              this._updateContext()
            }
          }
        },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'gutter',
            gutterName: 'button',
            icon: 'close',
            handlers: {
              click: (columns, data, column, record, rowIndex) => {
                const newData = data.records.filter((_, idx) => idx !== rowIndex)
                this.vasData = { ...this.vasData, records: newData }
              }
            }
          },
          {
            type: 'boolean',
            name: 'ready',
            header: i18next.t('field.ready'),
            width: 40
          },
          {
            type: 'object',
            name: 'vas',
            header: i18next.t('field.vas'),
            record: {
              editable: true,
              align: 'center',
              options: {
                queryName: 'vass',
                select: [
                  { name: 'id', hidden: true },
                  { name: 'name' },
                  { name: 'description' },
                  { name: 'operationGuideType', hidden: true },
                  { name: 'operationGuide', hidden: true }
                ],
                list: { fields: ['name', 'description'] }
              }
            },
            width: 250
          },
          {
            type: 'object',
            name: 'inventory',
            header: i18next.t('field.inventory_list'),
            record: {
              editable: true,
              align: 'left',
              options: {
                queryName: 'inventoryProductGroup',
                basicArgs: { filters: [] },
                nameField: 'batchId',
                descriptionField: 'productName',
                select: [
                  { name: 'batchId', header: i18next.t('field.batch_no'), record: { align: 'center' } },
                  { name: 'productId', hidden: true },
                  { name: 'productName', header: i18next.t('field.product'), record: { align: 'left' } },
                  { name: 'packingType', header: i18next.t('field.packing_type'), record: { align: 'center' } },
                  {
                    name: 'remainQty',
                    header: i18next.t('field.remain_qty'),
                    record: { align: 'center' },
                    ignoreCondition: true
                  },
                  {
                    name: 'remainWeight',
                    header: i18next.t('field.remain_weight'),
                    record: { align: 'center' },
                    ignoreCondition: true
                  }
                ],
                list: { fields: ['batchId', 'productName', 'packingType', 'remainQty', 'remainWeight'] }
              }
            },
            sortable: true,
            width: 250
          },
          {
            type: 'string',
            name: 'remark',
            header: i18next.t('field.remark'),
            record: { editable: true, align: 'center' },
            width: 350
          }
        ]
      }
    } else {
      const locationSortingRules = await fetchLocationSortingRule()
      this.inventoryGristConfig = {
        pagination: { infinite: true },
        rows: { selectable: { multiple: true } },
        list: { fields: ['inventory', 'product', 'location', 'releaseQty'] },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'gutter',
            gutterName: 'button',
            icon: 'close',
            handlers: {
              click: (columns, data, column, record, rowIndex) => {
                const newData = data.records.filter((_, idx) => idx !== rowIndex)
                this.inventoryData = { ...this.inventoryData, records: newData }
                this.inventoryGrist.dirtyData.records = newData
                this._updateInventoryList()
              }
            }
          },
          {
            type: 'object',
            name: 'inventory',
            header: i18next.t('field.inventory_list'),
            record: {
              editable: true,
              align: 'left',
              options: {
                queryName: 'inventories',
                basicArgs: {
                  filters: [
                    { name: 'status', operator: 'eq', value: INVENTORY_STATUS.STORED.value },
                    { name: 'remainOnly', operator: 'eq', value: true }
                  ],
                  locationSortingRules
                },
                nameField: 'batchId',
                descriptionField: 'palletId',
                select: [
                  { name: 'id', hidden: true },
                  { name: 'name', hidden: true },
                  { name: 'palletId', header: i18next.t('field.pallet_id'), record: { align: 'center' } },
                  { name: 'product', type: 'object', queryName: 'products' },
                  { name: 'batchId', header: i18next.t('field.batch_no'), record: { align: 'center' } },
                  {
                    name: 'location',
                    type: 'object',
                    queryName: 'locations',
                    field: 'name',
                    record: { align: 'center' }
                  },
                  { name: 'packingType', header: i18next.t('field.packing_type'), record: { align: 'center' } },
                  { name: 'remainQty', type: 'float', record: { align: 'center' } },
                  {
                    name: 'remainWeight',
                    type: 'float',
                    header: i18next.t('field.total_weight'),
                    record: { align: 'center' }
                  }
                ],
                list: { fields: ['palletId', 'product', 'batchId', 'location', 'remainWeight'] }
              }
            },
            width: 250
          },
          {
            type: 'object',
            name: 'product',
            header: i18next.t('field.product'),
            record: { align: 'left' },
            width: 150
          },
          {
            type: 'object',
            name: 'location',
            header: i18next.t('field.location'),
            record: { align: 'center' },
            width: 150
          },
          {
            type: 'code',
            name: 'packingType',
            header: i18next.t('field.packing_type'),
            record: {
              align: 'center',
              codeName: 'PACKING_TYPES'
            },
            width: 150
          },
          {
            type: 'integer',
            name: 'remainQty',
            header: i18next.t('field.available_qty'),
            record: { align: 'center' },
            width: 100
          },
          {
            type: 'integer',
            name: 'releaseQty',
            header: i18next.t('field.release_qty'),
            record: { editable: true, align: 'center', options: { min: 0 } },
            width: 100
          },
          {
            type: 'float',
            name: 'remainWeight',
            header: i18next.t('field.available_weight'),
            record: { align: 'center' },
            width: 100
          },
          {
            type: 'float',
            name: 'releaseWeight',
            header: i18next.t('field.release_weight'),
            record: { editable: true, align: 'center', options: { min: 0 } },
            width: 100
          }
        ]
      }

      this.vasGristConfig = {
        list: { fields: ['ready', 'vas', 'inventory', 'product', 'remark'] },
        pagination: { infinite: true },
        rows: {
          selectable: { multiple: true },
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (
                record &&
                record.vas &&
                record.vas.operationGuideType === 'template' &&
                record.vas.operationGuide &&
                record.inventory
              ) {
                this._template = document.createElement(record.vas.operationGuide)
                this._template.record = record
                this._template.operationGuide = record.operationGuide
              } else {
                this._template = null
              }
              this._selectedVasRecord = record
              this._selectedVasRecordIdx = rowIndex
              this._updateContext()
            }
          }
        },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'gutter',
            gutterName: 'button',
            icon: 'close',
            handlers: {
              click: (columns, data, column, record, rowIndex) => {
                const newData = data.records.filter((_, idx) => idx !== rowIndex)
                this.vasData = { ...this.vasData, records: newData }
              }
            }
          },
          {
            type: 'boolean',
            name: 'ready',
            header: i18next.t('field.ready'),
            width: 40
          },
          {
            type: 'object',
            name: 'vas',
            header: i18next.t('field.vas'),
            record: {
              editable: true,
              align: 'center',
              options: {
                queryName: 'vass',
                select: [
                  { name: 'id', hidden: true },
                  { name: 'name' },
                  { name: 'description' },
                  { name: 'operationGuideType', hidden: true },
                  { name: 'operationGuide', hidden: true }
                ],
                list: { fields: ['name', 'description'] }
              }
            },
            width: 250
          },
          {
            type: 'object',
            name: 'inventory',
            header: i18next.t('field.inventory_list'),
            record: {
              editable: true,
              align: 'center',
              options: {
                queryName: 'inventories',
                nameField: 'batchId',
                descriptionField: 'palletId',
                basicArgs: { filters: [{ name: 'id', operator: 'in', value: [null] }], locationSortingRules },
                select: [
                  { name: 'id', hidden: true },
                  { name: 'name', hidden: true },
                  { name: 'palletId', header: i18next.t('field.pallet_id'), record: { align: 'center' } },
                  { name: 'product', type: 'object', queryName: 'products' },
                  { name: 'batchId', header: i18next.t('field.batch_no'), record: { align: 'center' } },
                  { name: 'packingType', header: i18next.t('field.packing_type'), record: { align: 'center' } },
                  { name: 'location', type: 'object', queryName: 'locations', record: { align: 'center' } }
                ],
                list: { fields: ['palletId', 'product', 'batchId', 'location'] }
              }
            },
            sortable: true,
            width: 250
          },
          {
            type: 'string',
            name: 'remark',
            header: i18next.t('field.remark'),
            record: { editable: true, align: 'center' },
            width: 350
          }
        ]
      }
    }
  }

  _updateContext() {
    this._actions = []
    if (this._selectedVasRecord && this._selectedVasRecord.vas && this._selectedVasRecord.vas.operationGuideType) {
      this._actions = [this.adjustButton]
    }

    this._actions = [...this._actions, this.createButton]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  _onInventoryFieldChanged(e) {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      let columnName = e.detail.column.name
      let currentTargetProductId = e.detail.after.productId || e.detail.record.productId
      let currentTargetBatchId = e.detail.after.batchId || e.detail.record.batchId
      let roundedWeight = e.detail.record.roundedWeight || 0
      let releaseQty = 0

      if (columnName == 'releaseWeight' || columnName == 'releaseQty') {
        let packageWeight = e.detail.record.remainWeight / e.detail.record.remainQty
        if (
          e.detail.record.remainWeight &&
          e.detail.record.remainQty &&
          e.detail.record.remainWeight > 0 &&
          e.detail.record.remainQty > 0
        ) {
          if (columnName === 'releaseQty') {
            releaseQty = e.detail.after
          } else {
            releaseQty = Math.round(e.detail.after / packageWeight)
          }

          roundedWeight = releaseQty * packageWeight
          roundedWeight = parseFloat(roundedWeight.toFixed(2))
        }
      }

      this.inventoryData = {
        ...this.inventoryGrist.dirtyData,
        records: this.inventoryGrist.dirtyData.records.map(record => {
          if (
            (columnName == 'releaseWeight' || columnName == 'releaseQty') &&
            record.productId == currentTargetProductId &&
            record.batchId == currentTargetBatchId
          ) {
            if (columnName == 'releaseWeight') record.releaseQty = releaseQty
            record.releaseWeight = roundedWeight
          }
          return {
            ...record,
            ...record.inventory
          }
        })
      }
    } else {
      let columnName = e.detail.column.name
      let currentTargetId = e.detail.record.id
      let roundedWeight = e.detail.record.roundedWeight || 0
      let releaseQty = 0

      if (columnName == 'releaseWeight' || columnName == 'releaseQty') {
        if (isNaN(e.detail.after)) e.detail.after = 0
        let packageWeight = e.detail.record.remainWeight / e.detail.record.remainQty
        if (
          e.detail.record.remainWeight &&
          e.detail.record.remainQty &&
          e.detail.record.remainWeight > 0 &&
          e.detail.record.remainQty > 0
        ) {
          if (columnName === 'releaseQty') {
            releaseQty = e.detail.after
          } else {
            releaseQty = Math.round(e.detail.after / packageWeight)
          }

          roundedWeight = releaseQty * packageWeight
          roundedWeight = parseFloat(roundedWeight.toFixed(2))
        }
      }

      this.inventoryData = {
        ...this.inventoryGrist.dirtyData,
        records: this.inventoryGrist.dirtyData.records.map(record => {
          if ((columnName == 'releaseWeight' || columnName == 'releaseQty') && record.id == currentTargetId) {
            if (columnName == 'releaseWeight') record.releaseQty = releaseQty
            record.releaseWeight = roundedWeight
          }
          return {
            ...record,
            ...record.inventory
          }
        })
      }
    }
  }

  _onVasFieldChanged() {
    this.vasData = {
      ...this.vasGrist.dirtyData,
      records: this.vasGrist.dirtyData.records.map(record => {
        return {
          ...record,
          ready: this._isReadyToCreate(record)
        }
      })
    }
  }

  _isReadyToCreate(record) {
    if (record.vas && record.vas.operationGuideType) {
      return Boolean(record.operationGuide && record.inventory && record.remark)
    } else if (record.vas && !record.vas.operationGuideType) {
      return Boolean(record.inventory && record.remark)
    } else {
      return false
    }
  }

  _onProductChangeHandler(event) {
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    if (changedColumn === 'releaseQty') {
      try {
        this._validateReleaseQty(changeRecord.releaseQty, changeRecord.remainQty)
      } catch (e) {
        this._showToast(e)
        delete event.detail.after.releaseQty
      }
    } else if (changedColumn === 'releaseWeight') {
      try {
        this._validateReleaseWeight(changeRecord.releaseWeight, changeRecord.remainWeight)
      } catch (e) {
        this._showToast(e)
        delete event.detail.after.releaseWeight
      }
    }

    this._updateInventoryList()
  }

  _validateReleaseQty(releaseQty, remainQty) {
    if (releaseQty > remainQty) {
      throw new Error(i18next.t('text.available_quantity_insufficient'))
    } else if (releaseQty <= 0) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    } else {
      return
    }
  }

  _validateReleaseWeight(releaseWeight, remainWeight) {
    if (releaseWeight > remainWeight) {
      throw new Error(i18next.t('text.available_weight_insufficient'))
    } else if (releaseWeight <= 0) {
      throw new Error(i18next.t('text.invalid_weight_input'))
    } else {
      return
    }
  }

  async _generateReleaseOrder() {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      try {
        this._validateForm()
        this._validateInventories()
        this._validateVas()

        const result = await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.create_release_order'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) return

        await this._executeRelatedTrxs()

        let args = {
          releaseGood: { ...this._getReleaseOrder(), ownTransport: this._exportOption ? true : this._ownTransport }
        }
        if (this._exportOption && this._ownTransport) args.shippingOrder = this._getShippingOrder()

        const response = await client.query({
          query: gql`
              mutation {
                generateReleaseGood(${gqlBuilder.buildArgs(args)}) {
                  id
                  name
                }
              }
            `
        })

        if (!response.errors) {
          this._clearView()
          navigate(`release_order_detail/${response.data.generateReleaseGood.name}`)
          this._showToast({ message: i18next.t('release_order_created') })
        }
      } catch (e) {
        this._showToast(e)
      }
    } else {
      try {
        this._validateForm()
        this._validateInventories()
        this._validateVas()

        const result = await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.create_release_order'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) return

        await this._executeRelatedTrxs()

        let args = {
          releaseGood: { ...this._getReleaseOrder(), ownTransport: this._exportOption ? true : this._ownTransport }
        }
        if (this._exportOption && this._ownTransport) args.shippingOrder = this._getShippingOrder()

        const response = await client.query({
          query: gql`
              mutation {
                generateReleaseGood(${gqlBuilder.buildArgs(args)}) {
                  id
                  name
                }
              }
            `
        })

        if (!response.errors) {
          this._clearView()
          navigate(`release_order_detail/${response.data.generateReleaseGood.name}`)
          this._showToast({ message: i18next.t('release_order_created') })
        }
      } catch (e) {
        this._showToast(e)
      }
    }
  }

  async _executeRelatedTrxs() {
    try {
      this.vasData = {
        ...this.vasData,
        records: await (async () => {
          let records = []
          for (let i = 0; i < this.vasGrist.dirtyData.records.length; i++) {
            const record = this.vasGrist.dirtyData.records[i]

            if (record.vas.operationGuide && record.operationGuide && record.operationGuide.transactions) {
              const trxs = record.operationGuide.transactions || []

              for (let j = 0; j < trxs.length; j++) {
                const trx = trxs[j]
                record.operationGuide = await trx(record.operationGuide)
              }
            }
            records.push(record)
          }

          return records
        })()
      }
    } catch (e) {
      throw e
    }
  }

  _validateForm() {
    if (!this.releaseOrderForm.checkValidity()) throw new Error('text.release_order_form_invalid')

    //    - condition: export is ticked and own transport
    if (this._exportOption && this._ownTransport) {
      if (!this.shippingOrderForm.checkValidity()) throw new Error('text.shipping_order_form_invalid')
    }

    if (!this._serializeForm(this.releaseOrderForm)['releaseDate'])
      throw new Error(i18next.t('text.invalid_release_date'))
  }

  _validateInventories() {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      if (!this.inventoryGrist.dirtyData.records || !this.inventoryGrist.dirtyData.records.length)
        throw new Error(i18next.t('text.no_products'))

      // required field (batchId, packingType, weight, unit, packQty)
      if (
        this.inventoryGrist.dirtyData.records.filter(
          record => !record.releaseQty || !record.batchId || !record.packingType
        ).length
      )
        throw new Error(i18next.t('text.empty_value_in_list'))

      if (this.inventoryGrist.dirtyData.records.filter(record => record.releaseQty > record.remainQty).length)
        throw new Error(i18next.t('text.invalid_quantity_input'))
    } else {
      if (!this.inventoryGrist.dirtyData.records || !this.inventoryGrist.dirtyData.records.length)
        throw new Error(i18next.t('text.no_products'))

      // required field (batchId, packingType, weight, unit, packQty)
      if (
        this.inventoryGrist.dirtyData.records.filter(
          record => !record.releaseQty || !record.batchId || !record.packingType
        ).length
      )
        throw new Error(i18next.t('text.empty_value_in_list'))

      if (this.inventoryGrist.dirtyData.records.filter(record => record.releaseQty > record.remainQty).length)
        throw new Error(i18next.t('text.invalid_quantity_input'))

      // duplication of pallet id
      const palletIds = this.inventoryGrist.dirtyData.records.map(inventory => inventory.palletId)
      if (palletIds.filter((palletId, idx, palletIds) => palletIds.indexOf(palletId) !== idx).length)
        throw new Error(i18next.t('text.pallet_id_is_duplicated'))
    }
  }

  _validateVas() {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      if (this.vasGrist.dirtyData.records && this.vasGrist.dirtyData.records.length) {
        // required field (vas && remark)
        if (this.vasGrist.dirtyData.records.filter(record => !record.vas || !record.remark).length)
          throw new Error(i18next.t('text.empty_value_in_list'))

        if (!this.vasGrist.dirtyData.records.every(record => record.ready))
          throw new Error(i18next.t('text.invalid_data_in_list'))
      }
    } else {
      if (this.vasGrist.dirtyData.records && this.vasGrist.dirtyData.records.length) {
        // required field (vas && remark)
        if (this.vasGrist.dirtyData.records.filter(record => !record.vas || !record.remark).length)
          throw new Error(i18next.t('text.empty_value_in_list'))

        if (!this.vasGrist.dirtyData.records.every(record => record.ready))
          throw new Error(i18next.t('text.invalid_data_in_list'))
      }
    }
  }

  async _updateInventoryList() {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      const _selectedInv = (this.inventoryGrist.dirtyData.records || []).map(record => {
        return {
          batchId: record.inventory.batchId,
          packingType: record.inventory.packingType,
          productId: record.inventory.productId
        }
      })

      this.inventoryGristConfig = {
        ...this.inventoryGristConfig,
        columns: this.inventoryGristConfig.columns.map(column => {
          if (column.name === 'inventory') {
            column.record.options.basicArgs = {
              ...column.record.options.basicArgs,
              filters: [...column.record.options.basicArgs.filters.filter(filter => filter.name !== 'batch_product')]
            }

            if (_selectedInv.length)
              column.record.options.basicArgs.filters = [
                ...column.record.options.basicArgs.filters,
                {
                  name: 'batch_product',
                  value: _selectedInv,
                  operator: 'notin'
                }
              ]
          }

          return column
        })
      }

      this.vasGristConfig = {
        ...this.vasGristConfig,
        columns: this.vasGristConfig.columns.map(column => {
          if (column.name === 'inventory') {
            column.record.options.basicArgs = {
              ...column.record.options.basicArgs,
              filters: _selectedInv.length
                ? [
                    {
                      name: 'batch_product',
                      value: _selectedInv,
                      operator: 'in'
                    }
                  ]
                : []
            }
          }

          return column
        })
      }

      const mergedBatchProd = _selectedInv.map(item => item.batchId + item.productId + item.packingType)

      const newData = this.vasGrist.dirtyData.records.filter(
        record =>
          mergedBatchProd.indexOf(
            record.inventory.batchId + record.inventory.productId + record.inventory.packingType
          ) >= 0 || !record.inventory
      )

      this.vasData = { ...this.vasData, records: newData }
    } else {
      const _selectedInventories = (this.inventoryGrist.dirtyData.records || []).map(record => record.inventory.id)
      this.inventoryGristConfig = {
        ...this.inventoryGristConfig,
        columns: this.inventoryGristConfig.columns.map(column => {
          if (column.name === 'inventory') {
            column.record.options.basicArgs = {
              ...column.record.options.basicArgs,
              filters: [...column.record.options.basicArgs.filters.filter(filter => filter.name !== 'id')]
            }

            if (_selectedInventories.length)
              column.record.options.basicArgs.filters = [
                ...column.record.options.basicArgs.filters,
                {
                  name: 'id',
                  value: _selectedInventories,
                  operator: 'notin'
                }
              ]
          }

          return column
        })
      }

      this.vasGristConfig = {
        ...this.vasGristConfig,
        columns: this.vasGristConfig.columns.map(column => {
          if (column.name === 'inventory') {
            column.record.options.basicArgs = {
              ...column.record.options.basicArgs,
              filters: _selectedInventories.length
                ? [
                    {
                      name: 'id',
                      value: _selectedInventories,
                      operator: 'in'
                    }
                  ]
                : []
            }
          }

          return column
        })
      }

      const newData = this.vasGrist.dirtyData.records.filter(
        record => _selectedInventories.indexOf(record.inventory.id) >= 0 || !record.inventory
      )

      this.vasData = { ...this.vasData, records: newData }
    }
  }

  _clearGristConditions() {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      if (this.inventoryGristConfig && this.inventoryGristConfig.column && this.inventoryGristConfig.column.length) {
        this.inventoryGristConfig = {
          ...this.inventoryGristConfig,
          columns: this.inventoryGristConfig.columns.map(column => {
            if (column.name === 'inventory') {
              column.record.options.basicArgs = {
                filters: [...column.record.options.basicArgs.filters.filter(filter => filter.name !== 'batch_product')]
              }
            }

            return column
          })
        }
      }

      if (this.vasGristConfig && this.vasGristConfig.columns && this.vasGristConfig.columns.length) {
        this.vasGristConfig = {
          ...this.vasGristConfig,
          columns: this.vasGristConfig.columns.map(column => {
            if (column.name === 'inventory') {
              column.record.options.basicArgs = {
                ...column.record.options.basicArgs,
                filters: []
              }
            }

            return column
          })
        }
      }
    } else {
      this.inventoryGristConfig = {
        ...this.inventoryGristConfig,
        columns: this.inventoryGristConfig.columns.map(column => {
          if (column.name === 'inventory') {
            column.record.options.basicArgs = {
              filters: [...column.record.options.basicArgs.filters.filter(filter => filter.name !== 'id')]
            }
          }

          return column
        })
      }

      this.vasGristConfig = {
        ...this.vasGristConfig,
        columns: this.vasGristConfig.columns.map(column => {
          if (column.name === 'inventory') {
            column.record.options.basicArgs = {
              ...column.record.options.basicArgs,
              filters: []
            }
          }

          return column
        })
      }
    }
  }

  _getReleaseOrder() {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      let releaseGood = this._serializeForm(this.releaseOrderForm)

      releaseGood.orderInventories = this.inventoryGrist.data.records.map(record => {
        return {
          releaseQty: record.releaseQty,
          releaseWeight: record.releaseWeight,
          batchId: record.inventory.batchId,
          productName: record.inventory.productName,
          packingType: record.inventory.packingType,
          type: ORDER_TYPES.RELEASE_OF_GOODS.value,
          status: ORDER_INVENTORY_STATUS.PENDING.value
        }
      })

      releaseGood.orderVass = this.vasGrist.data.records.map(record => {
        let _tempObj = {}

        if (record.operationGuide && record.operationGuide.data) {
          _tempObj.operationGuide = JSON.stringify(record.operationGuide)
        }

        _tempObj = {
          ..._tempObj,
          vas: { id: record.vas.id },
          batchId: record.inventory.batchId,
          productName: record.inventory.productName,
          packingType: record.inventory.packingType,
          remark: record.remark
        }

        return _tempObj
      })

      return releaseGood
    } else {
      let releaseGood = this._serializeForm(this.releaseOrderForm)

      releaseGood.orderInventories = this.inventoryGrist.data.records.map((record, idx) => {
        return {
          releaseQty: record.releaseQty,
          releaseWeight: record.releaseWeight,
          inventory: {
            id: record.id
          },
          batchId: record.inventory.batchId,
          productName: record.inventory.product.name,
          packingType: record.inventory.packingType,
          type: ORDER_TYPES.RELEASE_OF_GOODS.value,
          status: ORDER_INVENTORY_STATUS.PENDING.value
        }
      })

      releaseGood.orderVass = this.vasGrist.data.records.map(record => {
        let _tempObj = {}

        if (record.operationGuide && record.operationGuide.data) {
          _tempObj.operationGuide = JSON.stringify(record.operationGuide)
        }

        _tempObj = {
          ..._tempObj,
          vas: { id: record.vas.id },
          inventory: { id: record.inventory.id },
          batchId: record.inventory.batchId,
          remark: record.remark
        }

        return _tempObj
      })

      return releaseGood
    }
  }

  _serializeForm(form) {
    let obj = {}
    Array.from(form.querySelectorAll('input, select')).forEach(field => {
      if (!field.hasAttribute('hidden') && field.value) {
        obj[field.name] = field.type === 'checkbox' ? field.checked : field.value
      }
    })

    return obj
  }

  _getShippingOrder() {
    return this._serializeForm(this.shippingOrderForm)
  }

  _clearView() {
    this._template = null
    this._selectedVasRecord = null
    this._selectedVasRecordIdx = null
    if (this.releaseOrderForm) this.releaseOrderForm.reset()
    if (this.shippingOrderForm) this.shippingOrderForm.reset()
    this.inventoryData = { ...this.inventoryData, records: [] }
    this.vasData = { ...this.vasData, records: [] }
    this._clearGristConditions()
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

window.customElements.define('create-release-order', CreateReleaseOrder)
