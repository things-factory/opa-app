import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/popup-note'
import '../components/popup-unloading'
import './palletizing-pallets-popup'
import { PALLET_STATUS, VAS_TYPE, ARRIVAL_NOTICE, RETURN_ORDER } from '../constants'

const AVAIL_ORDER_TYPES = { ARRIVAL_NOTICE, RETURN_ORDER }

class UnloadProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _orderNo: String,
      _palletId: String,
      _productName: String,
      _isLooseItem: Boolean,
      orderProductConfig: Object,
      orderProductData: Object,
      palletProductConfig: Object,
      palletProductData: Object,
      _selectedOrderProduct: Object,
      _selectedInventory: Object,
      _unloadedInventories: Array,
      _isReusablePallet: Boolean,
      _reusablePalletId: Array,
      _reusablePalletIdData: Object,
      orderVasData: Object,
      refOrderType: String
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          overflow: hidden;
          flex: 1;
        }
        .left-column {
          overflow: hidden;
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        .right-column {
          overflow: auto;
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        data-grist {
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
        div.palletizing {
          grid-column: span 12 / auto;
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          background-color: #ccc0;
          border: 1px solid #6e7e8e;
          color: #394e63;
        }
        @media (max-width: 460px) {
          :host {
            display: block;
          }
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.unloading')
    }
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get orderProductGrist() {
    return this.shadowRoot.querySelector('data-grist#order-product-grist')
  }

  get palletProductGrist() {
    return this.shadowRoot.querySelector('data-grist#pallet-product-grist')
  }

  get orderNoInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=orderNo]').shadowRoot.querySelector('input')
  }

  get palletInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=palletId]').shadowRoot.querySelector('input')
  }

  get actualQtyInput() {
    return this.shadowRoot.querySelector('input[name=qty]')
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.order_type')}</label>
          <select name="orderType" @change="${this.orderTypeChangeHandler.bind(this)}">
            ${Object.keys(AVAIL_ORDER_TYPES).map(key =>
              this.refOrderType === AVAIL_ORDER_TYPES[key].value
                ? html`
                    <option value="${AVAIL_ORDER_TYPES[key].value}" selected>
                      ${i18next.t(`label.${AVAIL_ORDER_TYPES[key].name}`)}
                    </option>
                  `
                : html`
                    <option value="${AVAIL_ORDER_TYPES[key].value}">
                      ${i18next.t(`label.${AVAIL_ORDER_TYPES[key].name}`)}
                    </option>
                  `
            )}
          </select>

          <label>${i18next.t('label.order_no')}</label>
          <barcode-scanable-input
            name="orderNo"
            custom-input
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.orderNoInput.value) {
                  this._clearView()
                  this._fetchProducts(this.orderNoInput.value)
                  this.orderNoInput.value = ''
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>
            ${`${
              this.refOrderType === AVAIL_ORDER_TYPES.RETURN_ORDER.value
                ? i18next.t('title.return_order')
                : i18next.t('title.arrival_notice')
            }: ${this._orderNo}`}
          </legend>

          <label>${i18next.t('label.customer')}</label>
          <input name="bizplaceName" readonly />

          <label ?hidden="${this.refOrderType === AVAIL_ORDER_TYPES.RETURN_ORDER.value}"
            >${i18next.t('label.container_no')}</label
          >
          <input ?hidden="${this.refOrderType === AVAIL_ORDER_TYPES.RETURN_ORDER.value}" name="containerNo" readonly />

          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label>${i18next.t('label.staging_area')}</label>
          <input name="bufferLocation" readonly />

          <label>${i18next.t('label.started_at')}</label>
          <input name="startedAt" type="datetime-local" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.unloading')}</h2>
          <data-grist
            id="order-product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.orderProductConfig}
            .data=${this.orderProductData}
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.unloaded')}</h2>
          <data-grist
            id="pallet-product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.palletProductConfig}
            .data=${this.palletProductData}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('title.product')}: ${this._productName}</legend>

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.description')}</label>
              <input name="description" readonly />

              <label>${i18next.t('label.packing_type')}</label>
              <input name="packingType" readonly />

              <label>${i18next.t('label.total_pallet_qty')}</label>
              <input name="palletQty" type="number" readonly />

              <label>${i18next.t('label.total_pack_qty')}</label>
              <input name="packQty" type="number" readonly />
            </fieldset>

            ${this._isLooseItem
              ? html`
                  <fieldset>
                    <legend>${i18next.t('title.palletizing')}</legend>
                    <div class="palletizing" @click="${this._openPalletizingPallets.bind(this)}">
                      <mwc-icon>apps</mwc-icon>Pallets
                    </div>
                  </fieldset>
                `
              : ''}

            <fieldset>
              <legend>${i18next.t('title.input_section')}</legend>

              <label>${i18next.t('label.pallet_id')}</label>
              <barcode-scanable-input
                name="palletId"
                .value=${this._palletId}
                without-enter
                custom-input
                @keypress="${this._checkReusablePallet.bind(this)}"
              ></barcode-scanable-input>

              <label>${i18next.t('label.actual_qty')}</label>
              <input name="qty" type="number" min="1" @keypress="${this._checkReusablePallet.bind(this)}" required />
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this._isReusablePallet = false
    this._isLooseItem = false
    this._orderNo = ''
    this._productName = ''
    this.refOrderType = AVAIL_ORDER_TYPES.ARRIVAL_NOTICE.value
    this.orderProductData = { records: [] }
    this.reusablePalletIdData = { records: [] }
    this.orderVasData = { records: [] }
  }

  updated(changedProps) {
    if (
      changedProps.has('_orderNo') ||
      changedProps.has('_selectedOrderProduct') ||
      changedProps.has('_selectedInventory') ||
      changedProps.has('_unloadedInventories')
    ) {
      this._updateContext()
    }
  }

  _updateContext() {
    let actions = []
    if (this._selectedOrderProduct && !this._selectedOrderProduct.validity) {
      actions = [...actions, { title: i18next.t('button.issue'), action: this._openIssueNote.bind(this) }]
    }

    if (this._unloadedInventories && this._unloadedInventories.length > 0) {
      if (this.orderProductData.records.some(task => !task.validity)) {
        actions = [
          ...actions,
          { title: i18next.t('button.partial_complete'), action: this._completePartially.bind(this) }
        ]
      }
    }

    if (this._selectedInventory) {
      actions = [...actions, { title: i18next.t('button.undo'), action: this._undoUnloading.bind(this) }]
    }

    if (this._orderNo) {
      actions = [...actions, { title: i18next.t('button.complete'), action: this._complete.bind(this) }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.unloading'),
        actions
      }
    })
  }

  pageInitialized() {
    this._changeGristConfig()
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnOrderNoField()
    }
  }

  _changeGristConfig() {
    if (this.refOrderType === AVAIL_ORDER_TYPES.RETURN_ORDER.value) {
      this.orderProductConfig = {
        rows: {
          appendable: false,
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record && record.batchId) {
                this._selectedOrderProduct = record
                this._selectedInventory = null
                this._productName = `${record.product.name} ${
                  record.product.description ? `(${record.product.description})` : ''
                }`

                this.inputForm.reset()
                this.palletInput.value = ''
                this._fillUpInputForm(record)
                this._fetchInventories()
                this._focusOnPalletInput()
              }
            }
          }
        },
        pagination: {
          infinite: true
        },
        list: { fields: ['batchId', 'packQty', 'actualPackQty'] },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'boolean',
            name: 'validity',
            header: i18next.t('field.validity'),
            width: 40
          },
          {
            type: 'string',
            name: 'palletId',
            header: i18next.t('field.pallet_id'),
            width: 200
          },
          {
            type: 'object',
            name: 'product',
            header: i18next.t('field.product'),
            width: 200
          },
          {
            type: 'integer',
            name: 'packQty',
            header: i18next.t('field.total_pack_qty'),
            record: { align: 'center' },
            width: 60
          },
          {
            type: 'integer',
            name: 'actualPackQty',
            header: i18next.t('field.actual_pack_qty'),
            record: { align: 'center' },
            width: 60
          },
          {
            type: 'string',
            name: 'issue',
            header: i18next.t('field.issue'),
            width: 100
          }
        ]
      }

      this.palletProductConfig = {
        rows: {
          appendable: false,
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.reusablePallet) {
                this._openPopupUnloading(record.reusablePallet.name, this.orderInventoryData, {
                  records: this.palletProductData.records.filter(item => record.reusablePallet == item.reusablePallet)
                })
              } else {
                if (record && record.palletId && this._selectedOrderProduct) {
                  this._selectedInventory = record
                  this.palletInput.value = record.palletId
                  this.actualQtyInput.value = record.qty
                }
              }
            }
          }
        },
        list: { fields: ['palletId', 'qty'] },
        pagination: {
          infinite: true
        },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'string',
            name: 'palletId',
            header: i18next.t('field.pallet'),
            width: 240
          },
          {
            type: 'integer',
            name: 'qty',
            header: i18next.t('field.actual_pack_qty'),
            record: { align: 'center' },
            width: 80
          },
          {
            type: 'string',
            name: 'reusablePalletName',
            header: i18next.t('field.reusable_pallet'),
            width: 240
          }
        ]
      }
    } else if (this.refOrderType === AVAIL_ORDER_TYPES.ARRIVAL_NOTICE.value) {
      this.orderProductConfig = {
        rows: {
          appendable: false,
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record && record.batchId) {
                this._selectedOrderProduct = record
                this._selectedInventory = null
                this._productName = `${record.product.name} ${
                  record.product.description ? `(${record.product.description})` : ''
                }`

                this.inputForm.reset()
                this.palletInput.value = ''
                this._fillUpInputForm(record)
                this._fetchInventories()
                this._focusOnPalletInput()
              }
            }
          }
        },
        pagination: {
          infinite: true
        },
        list: { fields: ['batchId', 'palletQty', 'actualPalletQty', 'packQty', 'actualPackQty'] },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'boolean',
            name: 'validity',
            header: i18next.t('field.validity'),
            width: 40
          },
          {
            type: 'string',
            name: 'batchId',
            header: i18next.t('field.batch_no'),
            width: 200
          },
          {
            type: 'object',
            name: 'product',
            header: i18next.t('field.product'),
            width: 200
          },
          {
            type: 'integer',
            name: 'palletQty',
            header: i18next.t('field.pallet_qty'),
            record: { align: 'center' },
            width: 60
          },
          {
            type: 'integer',
            name: 'actualPalletQty',
            header: i18next.t('field.actual_pallet_qty'),
            record: { align: 'center' },
            width: 60
          },
          {
            type: 'integer',
            name: 'packQty',
            header: i18next.t('field.total_pack_qty'),
            record: { align: 'center' },
            width: 60
          },
          {
            type: 'integer',
            name: 'actualPackQty',
            header: i18next.t('field.actual_pack_qty'),
            record: { align: 'center' },
            width: 60
          },
          {
            type: 'string',
            name: 'issue',
            header: i18next.t('field.issue'),
            width: 100
          }
        ]
      }

      this.palletProductConfig = {
        rows: {
          appendable: false,
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.reusablePallet) {
                this._openPopupUnloading(record.reusablePallet.name, this.orderProductData, {
                  records: this.palletProductData.records.filter(item => record.reusablePallet == item.reusablePallet)
                })
              } else {
                if (record && record.palletId && this._selectedOrderProduct) {
                  this._selectedInventory = record
                  this.palletInput.value = record.palletId
                  this.actualQtyInput.value = record.qty
                }
              }
            }
          }
        },
        list: { fields: ['palletId', 'qty', 'reusablePalletName'] },
        pagination: {
          infinite: true
        },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'string',
            name: 'palletId',
            header: i18next.t('field.pallet'),
            width: 240
          },
          {
            type: 'integer',
            name: 'qty',
            header: i18next.t('field.actual_pack_qty'),
            record: { align: 'center' },
            width: 80
          },
          {
            type: 'string',
            name: 'reusablePalletName',
            header: i18next.t('field.reusable_pallet'),
            width: 240
          }
        ]
      }
    }
  }

  async _fetchProducts(orderNo) {
    if (this.refOrderType === AVAIL_ORDER_TYPES.ARRIVAL_NOTICE.value) {
      const response = await client.query({
        query: gql`
          query {
            unloadingWorksheet(${gqlBuilder.buildArgs({
              arrivalNoticeNo: orderNo
            })}) {
              worksheetInfo {
                bizplaceName
                containerNo
                refNo
                looseItem
                bufferLocation
                startedAt
                orderVas {
                  targetVas {
                    id
                    name
                    vas {
                      id
                      name
                      description
                      type
                    }
                    qty
                    remark
                  }
                }
              }
              worksheetDetailInfos {
                batchId
                product {
                  id
                  name
                  description
                }
                name
                targetName
                description
                packingType
                palletQty
                actualPalletQty
                packQty
                actualPackQty
                issue
                remark
              }
            }
          }
        `
      })

      if (!response.errors) {
        let worksheetInfo = response.data.unloadingWorksheet.worksheetInfo
        let orderVasInfo = worksheetInfo.orderVas

        this._orderNo = orderNo
        this._isLooseItem = worksheetInfo.looseItem
        this._fillUpInfoForm(worksheetInfo)

        this.orderVasData = orderVasInfo
          ? {
              records: orderVasInfo
                .filter(x => x.targetVas.vas.type == VAS_TYPE.MATERIALS.value)
                .map((orderVas, idx) => {
                  let newTargetVas = worksheetInfo.orderVas[idx].targetVas
                  return {
                    ...newTargetVas,
                    id: newTargetVas.id,
                    name: newTargetVas.name,
                    description: newTargetVas.description,
                    qty: newTargetVas.qty,
                    remark: newTargetVas.remark,
                    vas: newTargetVas.vas
                  }
                })
            }
          : { records: [] }

        this.orderProductData = {
          records: response.data.unloadingWorksheet.worksheetDetailInfos.map(worksheetDetailInfo => {
            return {
              ...worksheetDetailInfo,
              validity:
                worksheetDetailInfo.actualPackQty === worksheetDetailInfo.packQty &&
                worksheetDetailInfo.actualPalletQty === worksheetDetailInfo.palletQty
            }
          })
        }
      }
    } else {
      const response = await client.query({
        query: gql`
          query {
            unloadingReturnWorksheet(${gqlBuilder.buildArgs({
              returnOrderNo: orderNo
            })}) {
              worksheetInfo {
                bizplaceName
                containerNo
                refNo
                bufferLocation
                startedAt
              }
              worksheetDetailInfos {
                batchId
                palletId
                product {
                  id
                  name
                  description
                }
                inventory {
                  id
                }
                name
                targetName
                description
                packingType
                palletQty
                actualPalletQty
                packQty
                actualPackQty
                issue
                remark
              }
            }
          }
        `
      })

      if (!response.errors) {
        this._orderNo = orderNo
        this._fillUpInfoForm(response.data.unloadingReturnWorksheet.worksheetInfo)

        this.orderProductData = {
          records: response.data.unloadingReturnWorksheet.worksheetDetailInfos.map(worksheetDetailInfo => {
            return {
              ...worksheetDetailInfo,
              validity: worksheetDetailInfo.actualPackQty === worksheetDetailInfo.packQty
            }
          })
        }
      }
    }
  }

  async _fetchInventories() {
    if (!this._selectedOrderProduct.name) return
    const response = await client.query({
      query: gql`
        query {
          unloadedInventories(${gqlBuilder.buildArgs({
            worksheetDetailName: this._selectedOrderProduct.name
          })}) {
            batchId
            palletId
            qty
            reusablePallet {
              id
              name
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._unloadedInventories = response.data.unloadedInventories
      this._selectedInventory = null
      this.palletProductData = {
        records: this._unloadedInventories
      }

      this.palletProductData = {
        records: this.palletProductData.records.map(palletProduct => {
          if (palletProduct.reusablePallet) {
            return {
              ...palletProduct,
              reusablePalletName: palletProduct.reusablePallet.name
            }
          } else {
            return {
              ...palletProduct,
              reusablePalletName: ''
            }
          }
        })
      }

      this.orderProductData = {
        records: this.orderProductData.records.map(orderProduct => {
          if (orderProduct.batchId === this._unloadedInventories.batchId) {
            orderProduct.actualPalletQty = this._unloadedInventories.length
            orderProduct.actualTotalPackQty = this._unloadedInventories
              .map(inventory => inventory.qty)
              .reduce((a, b) => a + b, 0)
          }

          return orderProduct
        })
      }
    }
  }

  _clearView() {
    this.orderProductData = { records: [] }
    this.palletProductData = { records: [] }
    this.infoForm.reset()
    this.inputForm.reset()
    this.palletInput.value = ''
    this.actualQtyInput.value = ''
    this._productName = ''
    this._selectedOrderProduct = null
    this._selectedInventory = null
    this._unloadedInventories = null
    this._updateContext()
  }

  _fillUpInfoForm(data) {
    this.infoForm.reset()
    for (let key in data) {
      Array.from(this.infoForm.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  _fillUpInputForm(data) {
    this.inputForm.reset()
    for (let key in data) {
      Array.from(this.inputForm.querySelectorAll('input, textarea')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  async _unload(e) {
    if (e.keyCode === 13) {
      try {
        this._validateUnloading()

        if (this.refOrderType === AVAIL_ORDER_TYPES.ARRIVAL_NOTICE.value) {
          const response = await client.query({
            query: gql`
              mutation {
                unload(${gqlBuilder.buildArgs({
                  worksheetDetailName: this._selectedOrderProduct.name,
                  inventory: {
                    palletId: this.palletInput.value.trim(),
                    qty: parseInt(this.actualQtyInput.value)
                  }
                })})
              }
            `
          })

          if (!response.errors) {
            this.palletInput.value = ''
            this.actualQtyInput.value = ''

            await this._fetchProducts(this._orderNo)
            await this._fetchInventories()
            this._focusOnPalletInput()
          }
        } else {
          const response = await client.query({
            query: gql`
              mutation {
                unloadReturn(${gqlBuilder.buildArgs({
                  worksheetDetailName: this._selectedOrderProduct.name,
                  inventory: {
                    id: this._selectedOrderProduct.inventory.id,
                    palletId: this.palletInput.value.trim(),
                    qty: parseInt(this.actualQtyInput.value)
                  }
                })})
              }
            `
          })

          if (!response.errors) {
            this.palletInput.value = ''
            this.actualQtyInput.value = ''

            await this._fetchProducts(this._orderNo)
            await this._fetchInventories()
            this._focusOnPalletInput()
          }
        }
      } catch (e) {
        this._showToast({ message: e.message })
      }
    }
  }

  _validateUnloading() {
    // 1. validate for order selection
    if (!this._selectedOrderProduct) throw new Error(i18next.t('text.target_does_not_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnPalletInput()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 4. qty value existing
    if (!parseInt(this.actualQtyInput.value)) {
      this._focusOnActualQtyInput()
      throw new Error(i18next.t('text.qty_is_empty'))
    }

    // 5. qty value has to be positive
    if (!(parseInt(this.actualQtyInput.value) > 0)) {
      setTimeout(() => this.actualQtyInput.select(), 100)
      throw new Error(i18next.t('text.qty_should_be_positive'))
    }
  }

  _openPopupUnloading(reusablePallet, unloadingData, unloadedData) {
    openPopup(
      html`
        <popup-unloading
          .title="${i18next.t('title.unloading_with_reusable_pallet')}"
          .ganNo="${this._orderNo}"
          ._productName="${this._productName}"
          .reusablePallet="${reusablePallet}"
          .unloadingGristData="${unloadingData}"
          .unloadedGristData="${unloadedData}"
          .reusablePalletData="${this.reusablePalletIdData}"
          ._selectedOrderProduct="${this._selectedOrderProduct}"
          @unloading-pallet="${e => {
            this.orderProductData = e.detail
          }}"
          @unloaded-pallet="${e => {
            this.palletProductData = { records: [] }
          }}"
        ></popup-unloading>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.unloading_with_reusable_pallet')
      }
    )
  }

  _openIssueNote() {
    openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.issue')}"
          .value="${this._selectedOrderProduct.issue}"
          @submit="${async e => {
            this.orderProductData = {
              records: this.orderProductData.records.map(record => {
                if (record.name === this._selectedOrderProduct.name) record.issue = e.detail.value
                return record
              })
            }
            this._selectedOrderProduct.issue = e.detail.value
          }}"
        ></popup-note>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.unloading_issue')
      }
    )
  }

  async _completePartially() {
    try {
      this._validateCompletePartially()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.partial_complete'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      if (this.refOrderType === AVAIL_ORDER_TYPES.ARRIVAL_NOTICE.value) {
        const response = await client.query({
          query: gql`
            mutation {
              completeUnloadingPartially(${gqlBuilder.buildArgs({
                arrivalNoticeNo: this._orderNo,
                worksheetDetail: this._getWorksheetDetails().find(wsd => wsd.name === this._selectedOrderProduct.name)
              })})
            }
          `
        })

        if (!response.errors) {
          await CustomAlert({
            title: i18next.t('title.completed'),
            text: i18next.t('text.unloading_completed'),
            confirmButton: { text: i18next.t('button.confirm') }
          })

          this._selectedInventory = null
          this.palletInput.value = ''
          this.actualQtyInput.value = ''
        }
      } else {
        const response = await client.query({
          query: gql`
            mutation {
              completeUnloadReturnPartially(${gqlBuilder.buildArgs({
                returnOrderNo: this._orderNo,
                worksheetDetail: this._getWorksheetDetails().find(wsd => wsd.name === this._selectedOrderProduct.name)
              })})
            }
          `
        })

        if (!response.errors) {
          await CustomAlert({
            title: i18next.t('title.completed'),
            text: i18next.t('text.unloading_completed'),
            confirmButton: { text: i18next.t('button.confirm') }
          })

          this._selectedInventory = null
          this.palletInput.value = ''
          this.actualQtyInput.value = ''
        }
      }
      await this._fetchProducts(this._orderNo)
      await this._fetchInventories()
      this._focusOnPalletInput()
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateCompletePartially() {
    if (!this._selectedOrderProduct) {
      throw new Error('text.target_is_not_selected')
    }

    if (!this._unloadedInventories || this._unloadedInventories.length <= 0) {
      throw new Error('text.nothing_unloaded')
    }

    if (this.refOrderType === AVAIL_ORDER_TYPES.ARRIVAL_NOTICE.value) {
      if (
        this._selectedOrderProduct.actualPalletQty > this._selectedOrderProduct.palletQty &&
        !this._selectedOrderProduct.issue
      ) {
        throw new Error('there_is_no_issue_noted')
      }
    }

    if (
      this._selectedOrderProduct.actualPackQty > this._selectedOrderProduct.packQty &&
      !this._selectedOrderProduct.issue
    ) {
      throw new Error('there_is_no_issue_noted')
    }
  }

  async _undoUnloading() {
    try {
      this._validateUndo()
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.undo_unloading'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      if (this.refOrderType === AVAIL_ORDER_TYPES.ARRIVAL_NOTICE.value) {
        const response = await client.query({
          query: gql`
              mutation {
                undoUnloading(${gqlBuilder.buildArgs({
                  worksheetDetailName: this._selectedOrderProduct.name,
                  palletId: this._selectedInventory.palletId
                })})
              }
            `
        })

        if (!response.errors) {
          this._selectedInventory = null
          this.palletInput.value = ''
          this.actualQtyInput.value = ''
        }
      } else {
        const response = await client.query({
          query: gql`
              mutation {
                undoUnloadReturning(${gqlBuilder.buildArgs({
                  worksheetDetailName: this._selectedOrderProduct.name,
                  palletId: this._selectedInventory.palletId
                })})
              }
            `
        })

        if (!response.errors) {
          this._selectedInventory = null
          this.palletInput.value = ''
          this.actualQtyInput.value = ''
        }
      }
      await this._fetchProducts(this._orderNo)
      await this._fetchInventories()
      this._focusOnPalletInput()
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateUndo() {
    if (!this._selectedInventory) throw new Error('text.target_does_not_selected')
  }

  async _complete() {
    try {
      this._validateComplete()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.complete_unloading'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      if (this.refOrderType === AVAIL_ORDER_TYPES.ARRIVAL_NOTICE.value) {
        const response = await client.query({
          query: gql`
            mutation {
              completeUnloading(${gqlBuilder.buildArgs({
                arrivalNoticeNo: this._orderNo,
                worksheetDetails: this._getWorksheetDetails()
              })})
            }
          `
        })

        if (!response.errors) {
          // const havingVas = await this.checkHavingVas(this._arrivalNoticeNo)
          // if (havingVas) {
          //   const result = await CustomAlert({
          //     title: i18next.t('title.completed'),
          //     text: i18next.t('text.unloading_completed'),
          //     confirmButton: { text: i18next.t('button.move_to_x', { state: { x: i18next.t('title.vas') } }) },
          //     cancelButton: { text: i18next.t('button.cancel') }
          //   })

          //   if (!result.value) {
          //     this._arrivalNoticeNo = null
          //     this._clearView()
          //     return
          //   }

          //   let searchParam = new URLSearchParams()
          //   searchParam.append('orderNo', this._arrivalNoticeNo)
          //   searchParam.append('orderType', ARRIVAL_NOTICE.value)

          //   navigate(`execute_vas?${searchParam.toString()}`)
          // } else {
          //   await CustomAlert({
          //     title: i18next.t('title.completed'),
          //     text: i18next.t('text.unloading_completed'),
          //     confirmButton: { text: i18next.t('button.confirm') }
          //   })
          // }

          await CustomAlert({
            title: i18next.t('title.completed'),
            text: i18next.t('text.unloading_completed'),
            confirmButton: { text: i18next.t('button.confirm') }
          })

          this._orderNo = null
          this._clearView()
        }
      } else {
        const response = await client.query({
          query: gql`
            mutation {
              completeUnloadReturning(${gqlBuilder.buildArgs({
                returnOrderNo: this._orderNo,
                worksheetDetails: this._getWorksheetDetails()
              })})
            }
          `
        })

        if (!response.errors) {
          // const havingVas = await this.checkHavingVas(this._arrivalNoticeNo)
          // if (havingVas) {
          //   const result = await CustomAlert({
          //     title: i18next.t('title.completed'),
          //     text: i18next.t('text.unloading_completed'),
          //     confirmButton: { text: i18next.t('button.move_to_x', { state: { x: i18next.t('title.vas') } }) },
          //     cancelButton: { text: i18next.t('button.cancel') }
          //   })

          //   if (!result.value) {
          //     this._arrivalNoticeNo = null
          //     this._clearView()
          //     return
          //   }

          //   let searchParam = new URLSearchParams()
          //   searchParam.append('orderNo', this._arrivalNoticeNo)
          //   searchParam.append('orderType', ARRIVAL_NOTICE.value)

          //   navigate(`execute_vas?${searchParam.toString()}`)
          // } else {
          //   await CustomAlert({
          //     title: i18next.t('title.completed'),
          //     text: i18next.t('text.unloading_completed'),
          //     confirmButton: { text: i18next.t('button.confirm') }
          //   })
          // }

          await CustomAlert({
            title: i18next.t('title.completed'),
            text: i18next.t('text.unloading_completed'),
            confirmButton: { text: i18next.t('button.confirm') }
          })

          this._orderNo = null
          this._clearView()
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  // async checkHavingVas(orderNo) {
  //   const response = await client.query({
  //     query: gql`
  //       query {
  //         havingVas(${gqlBuilder.buildArgs({
  //           orderType: ARRIVAL_NOTICE.value,
  //           orderNo
  //         })}) {
  //           id
  //         }
  //       }
  //     `
  //   })

  //   if (!response.errors) {
  //     return Boolean(response.data.havingVas.id)
  //   }
  // }

  async _checkReusablePallet(e) {
    if (e.keyCode === 13) {
      try {
        if (!this._selectedOrderProduct) throw new Error(i18next.t('text.target_is_not_selected'))
        if (!this.palletInput.value) return

        const response = await client.query({
          query: gql`
            query {
              palletByStatus(${gqlBuilder.buildArgs({
                name: this.palletInput.value,
                status: PALLET_STATUS.ACTIVE.value
              })}) {
                id
                name
              }
            }
          `
        })

        if (!response.errors) {
          if (response.data.palletByStatus) {
            // this._reusablePalletId = response.data.pallet
            // this.reusablePalletIdData = [this._reusablePalletId]
            this.reusablePalletIdData = response.data.palletByStatus
            this._isReusablePallet = true
            this._openPopupUnloading(this.palletInput.value, this.orderProductData, this.palletProductData)
          } else {
            this._unload(e)
          }
        }
      } catch (e) {
        this._showToast({ message: e.message })
      }
    }
  }

  _validateComplete() {
    if (this.refOrderType === AVAIL_ORDER_TYPES.ARRIVAL_NOTICE.value) {
      if (!this._orderNo) {
        throw new Error(i18next.t('text.there_is_no_arrival_notice_no'))
      }

      if (
        !this.orderProductData.records
          .filter(task => task.actualPalletQty !== task.palletQty || task.actualPackQty !== task.packQty)
          .every(task => task.issue)
      )
        throw new Error(i18next.t('text.there_is_no_issue_noted'))
    } else if (this.refOrderType === AVAIL_ORDER_TYPES.RETURN_ORDER.value) {
      if (!this._orderNo) {
        throw new Error(i18next.t('text.there_is_no_return_order_no'))
      }

      if (!this.orderProductData.records.filter(task => task.actualPackQty !== task.packQty).every(task => task.issue))
        throw new Error(i18next.t('text.there_is_no_issue_noted'))
    }
  }

  _getWorksheetDetails() {
    return this.orderProductData.records.map(task => {
      return { name: task.name, issue: task.issue ? task.issue : null }
    })
  }

  _openPalletizingPallets() {
    openPopup(
      html`
        <palletizing-pallet-popup
          .orderNo="${this._orderNo}"
          .data="${this.orderVasData}"
          @order-vas-data="${e => {
            this._fetchProducts(this._orderNo)
          }}"
        ></palletizing-pallet-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.palletizing_with_pallets')
      }
    )
  }

  _focusOnOrderNoField() {
    setTimeout(() => this.orderNoInput.focus(), 100)
  }

  _focusOnPalletInput() {
    setTimeout(() => this.palletInput.focus(), 100)
  }

  _focusOnActualQtyInput() {
    setTimeout(() => this.actualQtyInput.focus(), 100)
  }

  orderTypeChangeHandler(e) {
    this.refOrderType = e.currentTarget.value
    this._changeGristConfig()
    this.orderNoInput.select()
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

window.customElements.define('unload-product', UnloadProduct)
