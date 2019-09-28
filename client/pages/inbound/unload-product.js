import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import Swal from 'sweetalert2'
import { connect } from 'pwa-helpers/connect-mixin.js'

class UnloadProduct extends localize(i18next)(PageView) {
  static get properties() {
    return {
      arrivalNoticeNo: String,
      _palletId: String,
      _productName: String,
      orderProductConfig: Object,
      orderProductData: Object,
      palletProductConfig: Object,
      palletProductData: Object,
      _selectedInventory: Object
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
          flex: 1;
        }
        .left-column,
        .right-column {
          overflow: hidden;
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
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.unloading'),
      actions: [
        { title: i18next.t('button.complete'), action: this._complete.bind(this) },
        { title: i18next.t('button.undo'), action: this._undoUnloading.bind(this) }
      ]
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

  get palletInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input').shadowRoot.querySelector('input')
  }

  get actualQtyInput() {
    return this.shadowRoot.querySelector('input[name=qty]')
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.arrival_notice_no')}</label>
          <input
            name="arrivalNoticeNo"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (e.currentTarget.value) this._fetchProducts(e.currentTarget.value)
              }
            }}"
          />
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.arrival_notice')}: ${this.arrivalNoticeNo}`}</legend>

          <label>${i18next.t('label.bizplace')}</label>
          <input name="bizplaceName" readonly />

          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" readonly />

          <label>${i18next.t('label.buffer_location')}</label>
          <input name="bufferLocation" readonly />

          <label>${i18next.t('label.startedAt')}</label>
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

              <label>${i18next.t('label.batch_id')}</label>
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

            <fieldset>
              <legend>${i18next.t('title.input_section')}</legend>

              <label>${i18next.t('label.pallet_id')}</label>
              <barcode-scanable-input
                name="palletId"
                .value=${this._palletId}
                custom-input
                @keypress="${this._unload.bind(this)}"
              ></barcode-scanable-input>

              <label>${i18next.t('label.actual_qty')}</label>
              <input name="qty" type="number" min="1" @keypress="${this._unload.bind(this)}" required />
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.arrivalNoticeNo = ''
    this._productName = ''
    this.orderProductData = { records: [] }
  }

  pageInitialized() {
    this.orderProductConfig = {
      rows: {
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record) {
              this._selectedOrderProduct = record
              this._productName = `${record.product.name} ${
                record.product.description ? `(${record.product.description})` : ''
              }`

              this.inputForm.reset()
              this.palletInput.value = ''
              this.actualQtyInput.value = ''
              this._fillUpInputForm(record)
              this._focusOnPalletInput()
              this._fetchInvevtories()
            }
          }
        }
      },
      pagination: {
        infinite: true
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
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
          record: { align: 'right' },
          width: 60
        },
        {
          type: 'integer',
          name: 'actualPalletQty',
          header: i18next.t('field.actual_pallet_qty'),
          record: { align: 'right' },
          width: 60
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.total_pack_qty'),
          record: { align: 'right' },
          width: 60
        },
        {
          type: 'integer',
          name: 'actualPackQty',
          header: i18next.t('field.actual_total_pack_qty'),
          record: { align: 'right' },
          width: 60
        }
      ]
    }

    this.palletProductConfig = {
      rows: {
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (column.type === 'gutter') return
            if (record && this._selectedOrderProduct) {
              this._selectedInventory = record
              this.palletInput.value = record.palletId
              this.actualQtyInput.value = record.qty
            }
          }
        }
      },
      pagination: {
        infinite: true
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet'),
          width: 180
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.actual_pack_qty'),
          record: { align: 'right' },
          width: 60
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnArrivalNoticeField()
    }
  }

  async _fetchProducts(arrivalNoticeNo) {
    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          unloadingWorksheet(${gqlBuilder.buildArgs({
            arrivalNoticeNo
          })}) {
            worksheetInfo {
              bizplaceName
              containerNo
              bufferLocation
              startedAt
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
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.arrivalNoticeNo = arrivalNoticeNo
      this._fillUpInfoForm(response.data.unloadingWorksheet.worksheetInfo)

      this.orderProductData = {
        records: response.data.unloadingWorksheet.worksheetDetailInfos
      }
    }
  }

  async _fetchInvevtories() {
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
          }
        }
      `
    })

    if (!response.errors) {
      this._selectedInventory = null
      this.palletProductData = {
        records: response.data.unloadedInventories
      }

      this.orderProductData = {
        records: this.orderProductData.records.map(orderProduct => {
          if (orderProduct.batchId === response.data.unloadedInventories.batchId) {
            orderProduct.actualPalletQty = response.data.unloadedInventories.length
            orderProduct.actualTotalPackQty = response.data.unloadedInventories
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
    this._productName = ''
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
        const response = await client.query({
          query: gql`
            mutation {
              unload(${gqlBuilder.buildArgs({
                worksheetDetailName: this._selectedOrderProduct.name,
                inventory: {
                  palletId: this.palletInput.value,
                  qty: parseInt(this.actualQtyInput.value)
                }
              })})
            }
          `
        })

        if (!response.errors) {
          this.palletInput.value = ''
          this.actualQtyInput.value = ''
          this._focusOnPalletInput()
          this._fetchProducts(this.arrivalNoticeNo)
          this._fetchInvevtories()
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

  async _undoUnloading() {
    try {
      this._validateUndo()
      const result = await Swal.fire({
        title: i18next.t('text.undo_unloading'),
        text: i18next.t('text.are_you_sure'),
        type: 'warning',
        showCancelButton: true,
        allowOutsideClick: false,
        confirmButtonColor: '#22a6a7',
        cancelButtonColor: '#cfcfcf',
        confirmButtonText: i18next.t('button.yes')
      })

      if (result.value) {
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
          this.actualQtyInput = ''
        }
        this._fetchInvevtories()
      }
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
      const response = await client.query({
        query: gql`
          mutation {
            completeUnloading(${gqlBuilder.buildArgs({})})
          }
        `
      })
    } catch (e) {
      this._showToast(e)
    }
  }

  async _validateComplete() {
    // Existing of actual pallet qty value
    if (!this.orderProductData.records.every(task => task.actualPalletQty))
      throw new Error(i18next.t('text.actual_pallet_qty_is_empty'))

    // Existing of actual pack qty value
    if (!this.orderProductData.records.every(task => task.actualPackQty))
      throw new Error(i18next.t('text.actual_qty_is_empty'))

    // Matching with actual pallet qty & actual pack qty
    // If not, there should be remark
    if (
      !this.orderProductData.records
        .filter(task => task.actualPalletQty !== task.palletQty || task.actualPackQty !== task.packQty)
        .every(task => task.remark)
    )
      throw new Error(i18next.t('text.there_is_no_remark'))

    // Show confirm message box when pallet qty is not match with actual pallet qty
    if (!this.orderProductData.records.every(task => task.actualPalletQty === task.palletQty)) {
      const result = await Swal.fire({
        title: i18next.t('text.are_you_sure?'),
        text: i18next.t('text.pallet_qty_is_not_match_with_actual!'),
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#22a6a7',
        cancelButtonColor: '#cfcfcf',
        confirmButtonText: 'Yes, confirm!'
      })

      if (!result.value) throw new Error('text.canceled')
    }
  }

  async _completeUnloading() {
    const response = await client.query({
      query: gql`
        mutation {
          completeUnloading(${gqlBuilder.buildArgs({
            arrivalNoticeNo: this.arrivalNoticeNo,
            unloadingWorksheetDetails: this._getUnloadingWorksheetDetails(),
            unloadedPallets: this._getUnloadedPallets()
          })}) {
            name
          }
        }
      `
    })

    if (!response.errors) {
      this._clearView()
    }
  }

  _getUnloadingWorksheetDetails() {
    return this.orderProductData.records.map(task => {
      return {
        name: task.name,
        remark: task.remark ? task.remark : null,
        targetProduct: {
          name: task.targetName,
          actualPalletQty: task.actualPalletQty,
          actualPackQty: task.actualPackQty
        }
      }
    })
  }

  _getUnloadedPallets() {
    return this.orderProductData.records
      .map(orderProduct => {
        orderProduct.palletProducts.forEach(palletProduct => (palletProduct.batchId = orderProduct.batchId))
        return orderProduct.palletProducts
      })
      .flat()
      .map(palletProduct => {
        return {
          batchId: palletProduct.batchId,
          palletId: palletProduct.palletId,
          qty: palletProduct.actualPackQty
        }
      })
  }

  _focusOnArrivalNoticeField() {
    setTimeout(() => this.shadowRoot.querySelector('input[name=arrivalNoticeNo]').focus(), 100)
  }

  _focusOnPalletInput() {
    setTimeout(() => this.palletInput.focus(), 100)
  }

  _focusOnActualQtyInput() {
    setTimeout(() => this.actualQtyInput.focus(), 100)
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
