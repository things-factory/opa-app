import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { fetchLocationSortingRule } from '../../../fetch-location-sorting-rule'
import '../../components/vas-templates'
import '../../order/vas-order/vas-create-popup'
import {
  BATCH_AND_PRODUCT_TYPE,
  BATCH_NO_TYPE,
  INVENTORY_STATUS,
  ORDER_INVENTORY_STATUS,
  ORDER_TYPES,
  PICKING_STANDARD,
  PRODUCT_TYPE
} from '../constants/'

class CreateReleaseOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _pickingStd: String,
      _ownTransport: Boolean,
      _exportOption: Boolean,
      _selectedInventories: Array,
      _files: Array,
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
          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" />

          <label>${i18next.t('label.release_date')}</label>
          <input name="releaseDate" type="date" min="${this._getStdDate()}" />

          <label ?hidden="${!this._ownTransport || this._exportOption}">${i18next.t('label.co_no')}</label>
          <input name="collectionOrderNo" ?hidden="${!this._ownTransport || this._exportOption}" />

          <label ?hidden="${!this._ownTransport || this._exportOption}">${i18next.t('label.upload_documents')}</label>
          <file-uploader
            name="attachments"
            id="uploadDocument"
            label="${i18next.t('label.select_file')}"
            accept="*"
            ?hidden="${!this._ownTransport || this._exportOption}"
            multiple="true"
            custom-input
          ></file-uploader>

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
          ></data-grist>
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

  get _document() {
    return this.shadowRoot.querySelector('#uploadDocument')
  }

  async updated(changeProps) {
    if (changeProps.has('_pickingStd')) {
      await this.switchPickingType()
    }
  }

  async pageInitialized() {
    await this.switchPickingType()
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

  async switchPickingType() {
    this._clearView()
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
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
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  _onInventoryFieldChanged(e) {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      let columnName = e.detail.column.name
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
        records: this.inventoryGrist.dirtyData.records.map((record, idx) => {
          if ((columnName == 'releaseWeight' || columnName == 'releaseQty') && idx === e.detail.row) {
            if (columnName == 'releaseWeight') record.releaseQty = releaseQty
            record.releaseWeight = roundedWeight
          }
          return {
            ...record,
            ...record.inventory,
            product: {
              id: record.inventory.productId,
              name: record.inventory.productName
            }
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

  _onProductChangeHandler(event) {
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    try {
      if (changedColumn === 'releaseQty') {
        this._validateReleaseQty(changeRecord.releaseQty, changeRecord.remainQty)
      } else if (changedColumn === 'releaseWeight') {
        this._validateReleaseWeight(changeRecord.releaseWeight, changeRecord.remainWeight)
      }
      this._updateInventoryList()
    } catch (e) {
      this._showToast(e)
      delete event.detail.after[changedColumn]
    }
  }

  _validateReleaseQty(releaseQty, remainQty) {
    if (remainQty === undefined) throw new Error(i18next.t('text.there_is_no_selected_items'))
    if (releaseQty > remainQty) {
      throw new Error(i18next.t('text.available_quantity_insufficient'))
    } else if (releaseQty <= 0) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    } else {
      return
    }
  }

  _validateReleaseWeight(releaseWeight, remainWeight) {
    if (remainWeight === undefined) throw new Error(i18next.t('text.there_is_no_selected_items'))
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
        let releaseGood = this._getFormInfo()
        releaseGood.orderInventories = this._getOrderInventories()
        releaseGood.orderVass = this._getOrderVass()

        let args = {
          releaseGood: { ...releaseGood, ownTransport: this._exportOption ? true : this._ownTransport }
        }

        let attachments
        if (this._ownTransport) {
          attachments = this._document.files
        }
        if (this._exportOption && this._ownTransport) args.shippingOrder = this._getShippingOrder()

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

        let releaseGood = this._getFormInfo()
        releaseGood.orderInventories = this._getOrderInventories()
        releaseGood.orderVass = this._getOrderVass()

        let args = {
          releaseGood: { ...releaseGood, ownTransport: this._exportOption ? true : this._ownTransport }
        }

        let attachments
        if (this._ownTransport) {
          attachments = this._document.files
        }

        if (this._exportOption && this._ownTransport) args.shippingOrder = this._getShippingOrder()

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
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length) return

    try {
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
    if (!this.vasGrist.dirtyData.records.every(record => record.ready)) throw new Error('there_is_not_ready_vas')
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
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length) return

    if (
      !this.inventoryGrist.dirtyData ||
      !this.inventoryGrist.dirtyData.records ||
      !this.inventoryGrist.dirtyData.records.length
    ) {
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
          record.targetType === BATCH_NO_TYPE &&
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
          record.targetType === PRODUCT_TYPE &&
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
          record.targetType === BATCH_AND_PRODUCT_TYPE &&
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
    if (this.inventoryGristConfig && this.inventoryGristConfig.columns && this.inventoryGristConfig.columns.length) {
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

  _getFormInfo() {
    return this._serializeForm(this.releaseOrderForm)
  }

  _getOrderInventories() {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      return this.inventoryGrist.data.records.map(record => {
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
    } else {
      return this.inventoryGrist.data.records.map((record, idx) => {
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
    }
  }

  _getOrderVass() {
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length) {
      return []
    }

    const records = this.vasGrist.dirtyData.records

    return records
      .map((record, idx) => {
        const orderVass = record.orderVass
        return orderVass.map(orderVas => {
          let result = {
            set: idx + 1,
            vas: { id: orderVas.vas.id },
            remark: orderVas.remark,
            targetType: record.targetType
          }

          if (orderVas.operationGuide && orderVas.operationGuide.data) {
            result.operationGuide = JSON.stringify(orderVas.operationGuide)
          }

          if (record.targetType === BATCH_NO_TYPE) {
            result.targetBatchId = record.target
            result.packingType = record.packingType
            result.qty = record.qty
          } else if (record.targetType === PRODUCT_TYPE) {
            result.targetProduct = { id: record.target }
            result.packingType = record.packingType
            result.qty = record.qty
          } else if (record.targetType === BATCH_AND_PRODUCT_TYPE) {
            result.targetBatchId = record.target.batchId
            result.targetProduct = { id: record.target.productId }
            result.packingType = record.packingType
            result.qty = record.qty
            result.weight = record.weight
          } else {
            result.otherTarget = record.target
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
    if (this._document?._files) {
      this._document._files = []
    }
    this.vasData = { ...this.vasData, records: [] }
    this._clearGristConditions()
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
    if (!this.inventoryGrist.dirtyData.records || !this.inventoryGrist.dirtyData.records.length) {
      throw new Error(i18next.t('text.there_is_no_inventory'))
    }

    if (this.inventoryGrist.dirtyData.records.some(record => !record.inventory && !record.inventory.id))
      throw new Error(i18next.t('text.invalid_inventory'))

    if (this.inventoryGrist.dirtyData.records.some(record => !record.releaseQty))
      throw new Error(i18next.t('text.invalid_release_qty'))

    return true
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
