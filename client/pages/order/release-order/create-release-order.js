import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { fetchLocationSortingRule } from '../../../fetch-location-sorting-rule'
import { fetchSettingRule } from '../../../fetch-setting-value'
import '../../components/vas-templates'
import {
  INVENTORY_STATUS,
  LOCATION_SORTING_RULE,
  ORDER_INVENTORY_STATUS,
  ORDER_TYPES,
  PICKING_STANDARD,
  VAS_BATCH_AND_PRODUCT_TYPE,
  VAS_BATCH_NO_TYPE,
  VAS_PRODUCT_TYPE
} from '../../constants'
import '../../order/vas-order/popup/vas-create-popup'

class CreateReleaseOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      /* RO Form Fields */
      _ownTransport: Boolean,
      _warehouseTransport: Boolean,
      _crossDocking: Boolean,
      _exportOption: Boolean,
      refNo: String,
      releaseDate: Date,
      collectionOrderNo: String,
      /* RO Form Fields */

      _files: Array,

      /* Export Form Fields */
      containerNo: String,
      containerArrivalDate: Date,
      containerLeavingDate: Date,
      shipName: String,
      /* Export Form Fields */

      _pickingStd: String,

      _selectedInventories: Array,
      inventoryGristConfig: Object,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
      _releaseOrderNo: String,
      _ganNo: String,
      crossDockingProducts: Array,
      _checkTransport: Boolean,
      _disableTransport: Boolean,
      _enableTransportationServiceSetting: Boolean
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
          min-height: 50vh;
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
      actions: [{ title: i18next.t('button.submit'), action: this._generateReleaseOrder.bind(this) }]
    }
  }

  render() {
    return html`
      <form name="releaseOrder" class="multi-column-form" autocomplete="off">
        <fieldset>
          <legend>${i18next.t('title.release_order')}</legend>

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            ?disabled="${this._disableTransport}"
            @change="${e => {
              this._ownTransport = e.currentTarget.checked
              if (this._ownTransport) {
                this._warehouseTransportInput.checked = false
                this._warehouseTransport = false
              } else {
                this._warehouseTransportInput.checked = true
                this._warehouseTransport = true
              }
              this._validateTransport()
            }}"
          />
          <label for="ownTransport" ?hidden="${this._importedOrder}">${i18next.t('label.own_transport')}</label>

          <input
            id="warehouseTransport"
            type="checkbox"
            name="warehouseTransport"
            ?checked="${this._warehouseTransport}"
            ?disabled="${this._disableTransport}"
            @change="${e => {
              this._warehouseTransport = e.currentTarget.checked
              if (this._warehouseTransport) {
                this._ownTransportInput.checked = false
                this._ownTransport = false
              } else {
                this._ownTransportInput.checked = true
                this._ownTransport = true
              }
              this._validateTransport()
            }}"
          />
          <label for="warehouseTransport" ?hidden="${this._importedOrder}"
            >${i18next.t('label.warehouse_transport')}</label
          >

          <input
            id="exportOption"
            type="checkbox"
            name="exportOption"
            .checked="${this._exportOption}"
            ?hidden="${!this._checkTransport}"
            @change="${e => {
              this._exportOption = e.currentTarget.checked
            }}"
          />
          <label for="exportOption" ?hidden="${!this._checkTransport}">${i18next.t('label.export')}</label>

          ${this._crossDocking
            ? html`
                <input
                  id="crossDocking"
                  type="checkbox"
                  name="crossDocking"
                  ?checked="${this._crossDocking}"
                  ?hidden="${!this._checkTransport}"
                  disabled
                />
                <label for="crossDocking" ?hidden="${!this._checkTransport}">${i18next.t('label.cross_docking')}</label>
              `
            : ''}
        </fieldset>

        <fieldset>
          ${this._crossDocking
            ? html` <legend></legend> `
            : html` <legend ?hidden="${!this._checkTransport}"></legend>`}
          <label ?hidden="${!this._checkTransport}">${i18next.t('label.ref_no')}</label>
          <input name="refNo" .value="${this.refNo}" ?hidden="${!this._checkTransport}" />

          <label ?hidden="${!this._checkTransport}">${i18next.t('label.release_date')}</label>
          <input
            name="releaseDate"
            type="date"
            min="${this._getStdDate()}"
            .value="${this.releaseDate}"
            required
            ?disabled="${this._crossDocking}"
            ?hidden="${!this._checkTransport}"
          />

          <label ?hidden="${!this._checkTransport}">${i18next.t('label.upload_documents')}</label>
          <file-uploader
            name="attachments"
            id="uploadDocument"
            label="${i18next.t('label.select_file')}"
            accept="*"
            multiple="true"
            ?hidden="${!this._checkTransport}"
            custom-input
          ></file-uploader>

          ${this._ownTransport
            ? html`
                <label>${i18next.t('label.co_no')}</label>
                <input name="collectionOrderNo" .value="${this.collectionOrderNo}" />
              `
            : ''}
          ${this._crossDocking
            ? html`
                <label for="ganNo">${i18next.t('label.arrival_notice')}</label>
                <input readonly name="ganNo" value="${this._ganNo}" />
              `
            : ''}
        </fieldset>
      </form>

      ${this._exportOption
        ? html`
            <div class="so-form-container">
              <form name="shippingOrder" class="multi-column-form" autocomplete="off">
                <fieldset>
                  <legend>${i18next.t('title.export_order')}</legend>
                  <label>${i18next.t('label.container_no')}</label>
                  <input name="containerNo" required .value="${this.containerNo}" />

                  <label>${i18next.t('label.container_arrival_date')}</label>
                  <input
                    name="containerArrivalDate"
                    type="date"
                    min="${this._getStdDate()}"
                    .value="${this.containerArrivalDate}"
                    required
                    @change="${e => this._conLeavingDateInput.setAttribute('min', e.currentTarget.value)}"
                  />

                  <label>${i18next.t('label.container_leaving_date')}</label>
                  <input
                    name="containerLeavingDate"
                    type="date"
                    min="${this._getStdDate()}"
                    .value="${this.containerLeavingDate}"
                    required
                    @change="${e => this._containerArrivalDateInput.setAttribute('max', e.currentTarget.value)}"
                  />

                  <label>${i18next.t('label.ship_name')}</label>
                  <input name="shipName" required .value="${this.shipName}" />
                </fieldset>
              </form>
            </div>
          `
        : ''}

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
            .checked="${this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value}"
            checked
          />
          <label for="pick-by-prod">${i18next.t(PICKING_STANDARD.SELECT_BY_PRODUCT.name)}</label>

          ${this._crossDocking
            ? ''
            : html`
                <input
                  id="pick-by-pallet"
                  name="picking-std"
                  type="radio"
                  value="${PICKING_STANDARD.SELECT_BY_PALLET.value}"
                  @change="${e => {
                    this._pickingStd = e.currentTarget.value
                  }}"
                  .checked="${this._pickingStd === PICKING_STANDARD.SELECT_BY_PALLET.value && !this._crossDocking}"
                />
                <label for="pick-by-pallet">${i18next.t(PICKING_STANDARD.SELECT_BY_PALLET.name)}</label>
              `}
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
          ></data-grist>
        </div>
      </div>
    `
  }

  get releaseOrderForm() {
    return this.shadowRoot.querySelector('form[name=releaseOrder]')
  }

  get _containerArrivalDateInput() {
    return this.shadowRoot.querySelector('input[name=containerArrivalDate]')
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

  get _warehouseTransportInput() {
    return this.shadowRoot.querySelector('input[name=warehouseTransport]')
  }

  get _exportOptionInput() {
    return this.shadowRoot.querySelector('input[name=exportOption]')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  get _document() {
    return this.shadowRoot.querySelector('#uploadDocument')
  }

  constructor() {
    super()
    this.initProperties()
    this._pickingStd = PICKING_STANDARD.SELECT_BY_PRODUCT.value
  }

  async updated(changeProps) {
    if (changeProps.has('_pickingStd')) {
      this.switchPickingType()

      if (this.crossDockingProducts?.length > 0) {
        this.inventoryData = {
          ...this.inventoryData,
          records: this.crossDockingProducts
        }
      }
    }

    if (changeProps.has('_ganNo')) {
      if (this._ganNo) {
        this.fetchCrossDockingProducts()
      } else {
        this.crossDockingProducts = []
        this.inventoryData = {
          ...this.inventoryData,
          records: []
        }
      }
    }

    if (changeProps.has('_files') && this._files?.length) {
      this._document.reset()
    }

    // if (changeProps.has('_exportOption') && this._exportOption) {
    //   this._ownTransport = true
    // }
  }

  pageUpdated(changes) {
    if (changes.active) {
      const matches = location.pathname.match(/(?<=create_release_order\/)(.*)/g)
      if (matches?.length) {
        this._ganNo = matches[0]
      } else {
        this._ganNo = null
      }
      this._crossDocking = Boolean(this._ganNo)
      if (this._crossDocking) {
        this._pickingStd = PICKING_STANDARD.SELECT_BY_PRODUCT.value
      } else {
        this.crossDockingProducts = []
      }
    }
  }

  async pageInitialized() {
    this._enableTransportationServiceSetting = await fetchSettingRule('enable-transportation-service')

    this._validateTransport()

    this.vasGristConfig = {
      list: { fields: ['ready', 'targetType', 'targetDisplay', 'packingType'] },
      pagination: { infinite: true },
      rows: {
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            this._selectedVasRecord = record
            this._selectedVasRecordIdx = rowIndex
            if (column.name) {
              this.openVasCreatePopup(record)
            }
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
              this.vasData = { ...this.vasData, records: data.records.filter((_, idx) => idx !== rowIndex) }
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
          type: 'string',
          name: 'targetType',
          header: i18next.t('field.target_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'targetDisplay',
          header: i18next.t('field.target'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'vasCount',
          header: i18next.t('field.vas_count'),
          record: { align: 'center' },
          width: 100
        }
      ]
    }
  }

  initProperties() {
    this._exportOption = false
    // this._ownTransport = false
    // this._warehouseTransport = false
    this.refNo = ''
    this.releaseDate = ''
    this.collectionOrderNo = ''
    this._files = []
    this.containerNo = ''
    this.containerArrivalDate = ''
    this.containerLeavingDate = ''
    this.shipName = ''
    // this._checkTransport = false
    // this._enableTransportationServiceSetting = false
    // this._disableTransport = false

    this.inventoryData = { ...this.inventoryData, records: [] }
    this.vasData = { ...this.vasData, records: [] }
  }

  resetPage() {
    this._selectedVasRecord = null
    this._selectedVasRecordIdx = null
    this.initProperties()
    this._clearGristConditions()

    // if (this._ownTransportInput.checked) this._ownTransport = true
    // else this._ownTransport = false

    this._validateTransport()
  }

  async switchPickingType() {
    this.resetPage()
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      this.inventoryGristConfig = {
        pagination: { infinite: true },
        rows: {
          selectable: { multiple: true },
          classifier: (record, rowIndex) => {
            return {
              emphasized: record.isCrossDocking
            }
          }
        },
        list: { fields: ['inventory', 'product', 'location', 'releaseQty'] },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'gutter',
            gutterName: 'button',
            icon: 'close',
            handlers: {
              click: (columns, data, column, record, rowIndex) => {
                try {
                  if (record.isCrossDocking) throw new Error(i18next.t('text.cannot_delete_cross_docking_products'))
                  const newData = data.records.filter((_, idx) => idx !== rowIndex)
                  this.inventoryData = { ...this.inventoryData, records: newData }
                  this.inventoryGrist.dirtyData.records = newData
                  this._updateInventoryList()
                } catch (e) {
                  this._showToast(e)
                }
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
                  {
                    name: 'productName',
                    header: i18next.t('field.product_info'),
                    record: { align: 'left' },
                    width: 280
                  },
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
    } else {
      const locationSortingRules = await fetchLocationSortingRule(LOCATION_SORTING_RULE.CREATE_RELEASE_ORDER.value)
      this.inventoryGristConfig = {
        pagination: { infinite: true },
        rows: {
          selectable: { multiple: true },
          classifier: (record, rowIndex) => {
            return {
              emphasized: record.isCrossDocking
            }
          }
        },
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
                queryName: 'inventoriesByPallet',
                basicArgs: {
                  filters: [{ name: 'status', operator: 'eq', value: INVENTORY_STATUS.STORED.value }],
                  locationSortingRules
                },
                nameField: 'batchId',
                descriptionField: 'palletId',
                select: [
                  { name: 'id', hidden: true },
                  { name: 'name', hidden: true },
                  { name: 'palletId', header: i18next.t('field.pallet_id'), record: { align: 'center' } },
                  { name: 'product', type: 'object', header: i18next.t('field.product_info'), queryName: 'products' },
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
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  _onInventoryFieldChanged(e) {
    let columnName = e.detail.column.name
    let roundedWeight = e.detail.record.roundedWeight || 0
    let releaseQty = 0

    if (columnName == 'releaseWeight' || columnName == 'releaseQty') {
      if (e.detail.record.isCrossDocking) return

      let packageWeight = e.detail.record.remainWeight / e.detail.record.remainQty
      if (
        e.detail.record.remainWeight &&
        e.detail.record.remainQty &&
        e.detail.record.remainWeight > 0 &&
        e.detail.record.remainQty > 0
      ) {
        if (columnName === 'releaseQty') {
          releaseQty = e.detail.after || 0
        } else {
          releaseQty = Math.round(e.detail.after / packageWeight)
        }

        roundedWeight = releaseQty * packageWeight
        roundedWeight = parseFloat(roundedWeight.toFixed(2))
      }
    }

    this.inventoryData = {
      ...this.inventoryGrist.dirtyData,
      records: this.inventoryGrist.dirtyData.records.map((record, idx) => {
        // const factor = this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value ? e.detail.row : e.detail.record.id

        if ((columnName == 'releaseWeight' || columnName == 'releaseQty') && idx === e.detail.row) {
          if (columnName == 'releaseWeight') record.releaseQty = releaseQty
          record.releaseWeight = roundedWeight
        }

        let returnObj = {
          ...record,
          ...record.inventory
        }

        if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
          returnObj.product = {
            id: record.inventory.productId,
            name: record.inventory.productName
          }
        }

        return returnObj
      })
    }
  }

  _onProductChangeHandler(event) {
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    try {
      if (changedColumn === 'releaseQty') {
        if (changeRecord.isCrossDocking) {
          throw new Error(i18next.t('text.cannot_change_x', { state: { x: i18next.t('label.cross_docking') } }))
        }

        this._validateReleaseQty(changeRecord.releaseQty, changeRecord.remainQty)
      } else if (changedColumn === 'releaseWeight') {
        if (changeRecord.isCrossDocking) {
          throw new Error(i18next.t('text.cannot_change_x', { state: { x: i18next.t('label.cross_docking') } }))
        }

        this._validateReleaseWeight(changeRecord.releaseWeight, changeRecord.remainWeight)
      }
      this._updateInventoryList()
    } catch (e) {
      const beforeValue = event.detail.before && event.detail.before[event.detail.column.name]
      if (beforeValue) {
        event.detail.after[event.detail.column.name] = beforeValue
      } else {
        delete event.detail.after[event.detail.column.name]
      }
      this._showToast(e)
    }
  }

  _validateReleaseQty(releaseQty, remainQty) {
    if (remainQty === undefined) throw new Error(i18next.t('text.there_is_no_selected_items'))
    if (releaseQty > remainQty) {
      throw new Error(i18next.t('text.available_quantity_insufficient'))
    } else if (releaseQty <= 0) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    }
  }

  _validateReleaseWeight(releaseWeight, remainWeight) {
    if (remainWeight === undefined) throw new Error(i18next.t('text.there_is_no_selected_items'))
    if (releaseWeight > remainWeight) {
      throw new Error(i18next.t('text.available_weight_insufficient'))
    } else if (releaseWeight <= 0) {
      throw new Error(i18next.t('text.invalid_weight_input'))
    }
  }

  async _generateReleaseOrder() {
    try {
      this._validateForm()
      this._validateInventories()
      this._validateVas()

      let result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_release_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      if (this._crossDocking) {
        result = await CustomAlert({
          title: i18next.t('label.cross_docking'),
          text: i18next.t('text.create_arrival_notice'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) return
      }

      await this._executeRelatedTrxs()
      let releaseGood = this._serializeForm(this.releaseOrderForm)
      delete releaseGood.warehouseTransport
      releaseGood.orderInventories = this._getOrderInventories()
      releaseGood.orderVass = this._getOrderVass()
      releaseGood.ownTransport = this._ownTransport
      let args = { releaseGood }

      if (this._exportOption) args.shippingOrder = this._serializeForm(this.shippingOrderForm)

      const attachments = this._document?.files ? this._document.files : undefined
      const response = await client.query({
        query: gql`
              mutation ($attachments: Upload) {
                generateReleaseGood(${gqlBuilder.buildArgs(args)}, file:$attachments) {
                  id
                  name
                }
              }
            `,
        variables: {
          attachments
        },
        context: {
          hasUpload: true
        }
      })

      if (!response.errors) {
        this.resetPage()
        navigate(`release_order_detail/${response.data.generateReleaseGood.name}`)
        this._showToast({ message: i18next.t('release_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _executeRelatedTrxs() {
    if (!this.vasGrist?.dirtyData?.records?.length) return

    this.vasData = {
      ...this.vasData,
      records: await (async () => {
        const records = this.vasGrist.dirtyData.records
        for (let record of records) {
          const orderVass = record.orderVass
          for (let orderVas of orderVass) {
            if (orderVas.operationGuide && orderVas.operationGuide.transactions) {
              const trxs = orderVas.operationGuide.transactions
              for (let trx of trxs) {
                orderVas.operationGuide = await trx(orderVas.operationGuide)
              }
            }
          }
        }
      })()
    }
  }

  _validateTransport() {
    //Check if warehouse provide transport
    if (this._enableTransportationServiceSetting != undefined && !this._enableTransportationServiceSetting) {
      this._disableTransport = true
      this._ownTransportInput.checked = true
      this._ownTransport = true
    }

    if (this._ownTransport || this._warehouseTransport) {
      this._checkTransport = true
    }
  }

  _validateForm() {
    if (!this.releaseOrderForm.checkValidity()) {
      throw new Error(i18next.t('text.release_order_form_invalid'))
    }

    //    - condition: export is ticked
    if (this.shippingOrderForm && !this.shippingOrderForm.checkValidity()) {
      throw new Error(i18next.t('text.shipping_order_form_invalid'))
    }

    if (this._ownTransport && this._warehouseTransport) {
      throw new Error(i18next.t('text.you_can_only_select_one_transport_type'))
    } else if (!this._ownTransport && !this._warehouseTransport) {
      throw new Error(i18next.t('text.please_select_transport_type'))
    }
  }

  _validateInventories() {
    const inventories = this.inventoryGrist?.dirtyData?.records
    if (!inventories?.length) throw new Error(i18next.t('text.no_products'))
    // required field (batchId, packingType, weight, unit, packQty)
    if (!inventories.every(record => record.releaseQty && record.batchId && record.packingType)) {
      throw new Error(i18next.t('text.empty_value_in_list'))
    }

    if (inventories.some(record => record.releaseQty > record.remainQty)) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    }

    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PALLET.value) {
      // duplication of pallet id
      const palletIds = inventories.map(inv => inv.palletId)
      if (palletIds.some((palletId, idx, palletIds) => palletIds.indexOf(palletId) !== idx)) {
        throw new Error(i18next.t('text.pallet_id_is_duplicated'))
      }
    }
  }

  _validateVas() {
    if (!this.vasGrist.dirtyData.records.every(record => record.ready)) throw new Error('there_is_not_ready_vas')
  }

  async _updateInventoryList() {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      const _selectedInv = (this.inventoryGrist.dirtyData.records || [])
        .filter(record => !record.isCrossDocking)
        .map(record => {
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
    }

    this._updateVasTargets()
  }

  _updateVasTargets(isFieldChanged) {
    if (!this.vasGrist?.dirtyData?.records?.length) return

    if (!this.inventoryGrist?.dirtyData?.records?.length) {
      this.vasData = { ...this.vasData, records: [] }
      return
    }

    const standardProductList = isFieldChanged ? this.inventoryGrist.dirtyData.records : this.inventoryData.records
    const batchPackPairs = standardProductList
      .filter(record => record.batchId && record.packingType)
      .map(record => `${record.batchId}-${record.packingType}`)

    const productPackPairs = standardProductList
      .filter(record => record.product && record.product.id)
      .map(record => `${record.product.id}-${record.packingType}`)

    const batchProductPackPairs = standardProductList
      .filter(record => record.batchId && record.product && record.product.id && record.packingType)
      .map(record => `${record.batchId}-${record.product.id}-${record.packingType}`)

    this.vasData = {
      ...this.vasData,
      records: this.vasGrist.dirtyData.records.map(record => {
        if (
          record.targetType === VAS_BATCH_NO_TYPE &&
          batchPackPairs.indexOf(`${record.target}-${record.packingType}`) < 0
        ) {
          return {
            ...record,
            ready: false,
            target: null,
            targetDisplay: null,
            packingType: null,
            qty: 1
          }
        } else if (
          record.targetType === VAS_PRODUCT_TYPE &&
          productPackPairs.indexOf(`${record.target}-${record.packingType}`) < 0
        ) {
          return {
            ...record,
            ready: false,
            target: null,
            targetDisplay: null,
            packingType: null,
            qty: 1
          }
        } else if (
          record.targetType === VAS_BATCH_AND_PRODUCT_TYPE &&
          batchProductPackPairs.indexOf(`${record.target.batchId}-${record.target.productId}-${record.packingType}`) < 0
        ) {
          return {
            ...record,
            ready: false,
            target: null,
            targetDisplay: null,
            packingType: null,
            qty: 1
          }
        } else {
          return record
        }
      })
    }
  }

  _clearGristConditions() {
    if (this.inventoryGristConfig?.columns?.length) {
      this.inventoryGristConfig = {
        ...this.inventoryGristConfig,
        columns: this.inventoryGristConfig.columns.map(column => {
          if (column.name === 'inventory') {
            column.record.options.basicArgs = {
              filters: column.record.options.basicArgs.filters.filter(
                filter => filter.name !== 'batch_product' && filter.name !== 'id'
              )
            }
          }

          return column
        })
      }
    }
  }

  _getOrderInventories() {
    return this.inventoryGrist.data.records.map(record => {
      let newRecord = {
        releaseQty: record.releaseQty,
        releaseWeight: record.releaseWeight,
        batchId: record.inventory.batchId,
        packingType: record.inventory.packingType,
        type: ORDER_TYPES.RELEASE_OF_GOODS.value,
        status: ORDER_INVENTORY_STATUS.PENDING.value
      }

      if (record.isCrossDocking) newRecord.crossDocking = true

      if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
        newRecord.product = { id: record.inventory.productId, name: record.inventory.productName }
      } else {
        newRecord.product = { id: record.inventory.product.id, name: record.inventory.product.name }
        newRecord.inventory = { id: record.id }
      }

      return newRecord
    })
  }

  _getOrderVass() {
    if (!this.vasGrist?.dirtyData?.records?.length) return []

    const records = this.vasGrist.dirtyData.records

    return records
      .map((record, idx) => {
        const orderVass = record.orderVass
        return orderVass.map(orderVas => {
          let result = {
            set: idx + 1,
            vas: { id: orderVas.vas.id },
            remark: orderVas.remark,
            targetType: record.targetType,
            qty: record.qty,
            packingType: record.packingType
          }

          if (orderVas.operationGuide && orderVas.operationGuide.data) {
            result.operationGuide = JSON.stringify(orderVas.operationGuide)
          }

          if (record.targetType === VAS_BATCH_NO_TYPE) {
            result.targetBatchId = record.target
          } else if (record.targetType === VAS_PRODUCT_TYPE) {
            result.targetProduct = { id: record.target }
          } else if (record.targetType === VAS_BATCH_AND_PRODUCT_TYPE) {
            result.targetBatchId = record.target.batchId
            result.targetProduct = { id: record.target.productId }
            result.weight = record.weight
          } else {
            result.otherTarget = record.target
            delete result.qty
            delete result.packingType
          }

          return result
        })
      })
      .flat()
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

  openVasCreatePopup(record) {
    try {
      this.checkInventoryValidity()
      openPopup(
        html`
          <vas-create-popup
            .targetList="${this.inventoryGrist.dirtyData.records.map(record => {
              return {
                ...record,
                packQty: record.releaseQty,
                unitWeight: record.releaseWeight / record.releaseQty,
                totalWeight: record.releaseWeight
              }
            })}"
            .vasList="${this.vasData.records}"
            .record="${record}"
            @completed="${e => {
              if (this.vasGrist.dirtyData.records.length === this._selectedVasRecordIdx) {
                this.vasData = {
                  ...this.vasData,
                  records: [...this.vasGrist.dirtyData.records, e.detail]
                }
              } else {
                this.vasData = {
                  ...this.vasData,
                  records: this.vasGrist.dirtyData.records.map((record, idx) => {
                    if (idx === this._selectedVasRecordIdx) {
                      record = e.detail
                    }

                    return record
                  })
                }
              }
            }}"
          ></vas-create-popup>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.vas_order')
        }
      )
    } catch (e) {
      this._showToast(e)
    }
  }

  checkInventoryValidity() {
    const inventories = this.inventoryGrist?.dirtyData?.records
    if (!inventories?.length) throw new Error(i18next.t('text.there_is_no_inventory'))

    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PALLET && inventories.some(record => !record?.inventory?.id))
      throw new Error(i18next.t('text.invalid_inventory'))

    if (inventories.some(record => !record.releaseQty)) throw new Error(i18next.t('text.invalid_release_qty'))
  }

  async fetchCrossDockingProducts() {
    if (!this._ganNo) return
    try {
      const response = await client.query({
        query: gql`
          query {
            arrivalNotice(${gqlBuilder.buildArgs({
              name: this._ganNo
            })}) {
              etaDate
              crossDocking
              orderProducts {
                batchId
                packingType
                packQty
                weight
                releaseWeight
                releaseQty
                product {
                  id
                  name
                  description
                }
              }
            }
          }
        `
      })

      if (!response.errors) {
        this.releaseDate = response.data.arrivalNotice?.etaDate
        this._crossDocking = response.data.arrivalNotice?.crossDocking
        this._pickingStd = this._crossDocking ? PICKING_STANDARD.SELECT_BY_PRODUCT.value : this._pickingStd
        if (this._crossDocking) {
          this.crossDockingProducts = response.data.arrivalNotice.orderProducts
            .filter(op => op.releaseQty && op.releaseWeight)
            .map(op => {
              op.isCrossDocking = true
              op.inventory = {
                batchId: op.batchId,
                productId: op.product.id,
                product: op.product,
                productName: op.product.name,
                palletId: i18next.t('label.cross_docking'),
                packingType: op.packingType
              }
              op.remainQty = op.packQty
              op.remainWeight = op.packQty * op.weight
              op.location = {
                name: i18next.t('label.cross_docking')
              }
              return op
            })

          this.inventoryData = {
            ...this.inventoryData,
            records: this.crossDockingProducts
          }
        } else {
          throw new Error(i18next.t('text.invalid_x', { state: { x: i18next.t('field.gan') } }))
        }
      } else {
        this._crossDocking = false
      }
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

window.customElements.define('create-release-order', CreateReleaseOrder)
