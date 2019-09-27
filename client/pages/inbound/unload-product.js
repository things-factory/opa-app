import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class UnloadProduct extends localize(i18next)(PageView) {
  static get properties() {
    return {
      arrivalNoticeNo: String,
      _palletId: String,
      _productName: String,
      orderProductConfig: Object,
      orderProductData: Object,
      palletProductConfig: Object,
      _displayPalletProductData: Object,
      _selectedPalletIndex: Number
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
        {
          title: i18next.t('button.complete'),
          action: this._completeHandler.bind(this)
        }
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
    return this.shadowRoot.querySelector('input[name=actualQty]')
  }

  get remarkTextarea() {
    return this.shadowRoot.querySelector('textarea[name=remark]')
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
            .data=${this._displayPalletProductData}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('title.product_batch')}: ${this._productName}</legend>

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

              <label>${i18next.t('label.remark')}</label>
              <textarea
                name="remark"
                @change="${e => {
                  if (this.selectedOrderProduct) {
                    this.orderProductData = {
                      records: this.orderProductData.records.map(orderProduct => {
                        if (orderProduct.name === this.selectedOrderProduct.name) {
                          orderProduct.remark = e.currentTarget.value
                        }
                        return orderProduct
                      })
                    }
                  }
                }}"
              ></textarea>
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
              <input name="actualQty" type="number" min="1" @keypress="${this._unload.bind(this)}" required />
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
    this._displayPalletProductData = { records: [] }
  }

  pageInitialized() {
    this.orderProductConfig = {
      rows: {
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record) {
              this.selectedOrderProduct = record
              this._selectedPalletIndex = null
              this._productName = `${record.product.name} ${
                record.product.description ? `(${record.product.description})` : ''
              }`

              this.inputForm.reset()
              this._fillUpInputForm(record)
              this._focusOnPalletInput()
              this._displayPalletProductData = {
                records: this.orderProductData.records
                  .filter(orderProduct => orderProduct.name === this.selectedOrderProduct.name)
                  .map(orderProduct => orderProduct.palletProducts)
                  .flat()
              }
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
            if (record && this.selectedOrderProduct) {
              this._selectedPalletIndex = rowIndex
              this.palletInput.value = record.palletId
              this.actualQtyInput.value = record.actualPackQty
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
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.orderProductData = {
                records: [
                  ...this.orderProductData.records.map(orderProduct => {
                    if (orderProduct.name === this.selectedOrderProduct.name) {
                      orderProduct.palletProducts = orderProduct.palletProducts.filter(
                        palletProduct => palletProduct.palletId !== record.palletId
                      )
                      this._displayPalletProductData = { records: orderProduct.palletProducts }
                    }

                    if (orderProduct.palletProducts && orderProduct.palletProducts.length) {
                      orderProduct.actualPalletQty = orderProduct.palletProducts.length
                      orderProduct.actualPackQty = orderProduct.palletProducts
                        .map(palletProduct => palletProduct.actualPackQty)
                        .reduce((a, b) => a + b, 0)
                    }

                    return orderProduct
                  })
                ]
              }
            }
          }
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet'),
          width: 180
        },
        {
          type: 'integer',
          name: 'actualPackQty',
          header: i18next.t('field.actual_pack_qty'),
          record: { align: 'right' },
          width: 60
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('_selectedPalletIndex')) {
      this.palletInput.disabled = this._selectedPalletIndex
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnBarcodField()
    }
  }

  _focusOnBarcodField() {
    this.shadowRoot.querySelector('input[name=arrivalNoticeNo]').focus()
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
              packQty
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

  _clearView() {
    this.orderProductData = { records: [] }
    this.palletProductData = { records: [] }
    this._displayPalletProductData = { records: [] }
    this.selectedOrderProduct = null
    this._selectedPalletIndex = null
    this.infoForm.reset()
    this.inputForm.reset()
    this._productName = ''
    this.arrivalNoticeNo = ''
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

  _unload(e) {
    if (e.keyCode === 13) {
      try {
        this._validateUnloading()

        this.orderProductData = {
          records: [
            ...this.orderProductData.records.map(orderProduct => {
              if (orderProduct.name === this.selectedOrderProduct.name) {
                if (!orderProduct.palletProducts || orderProduct.palletProducts.length == 0) {
                  orderProduct.palletProducts = []
                }

                if (!this._selectedPalletIndex) {
                  // If it's not for editing existing pallet data
                  orderProduct.palletProducts.push({
                    palletId: this.palletInput.value,
                    actualPackQty: parseInt(this.actualQtyInput.value)
                  })
                } else {
                  // If it's for editing existing pallet data
                  orderProduct.palletProducts[this._selectedPalletIndex] = {
                    palletId: this.palletInput.value,
                    actualPackQty: parseInt(this.actualQtyInput.value)
                  }
                }

                orderProduct.actualPalletQty = orderProduct.palletProducts.length
                orderProduct.actualPackQty = orderProduct.palletProducts
                  .map(palletProduct => palletProduct.actualPackQty)
                  .reduce((a, b) => a + b, 0)

                this._displayPalletProductData = { records: orderProduct.palletProducts }
              }
              return {
                ...orderProduct
              }
            })
          ]
        }

        this.palletInput.value = ''
        this.actualQtyInput.value = ''
        this.remarkTextarea.value = ''
        this._selectedPalletIndex = null
        this._focusOnPalletInput()
      } catch (e) {
        this._showToast({ message: e.message })
      }
    }
  }

  _validateUnloading() {
    // 1. validate for order selection
    if (!this.selectedOrderProduct) throw new Error(i18next.t('text.target_doesnt_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnPalletInput()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 3. pallet id duplication (When add new records only)
    if (
      !this._selectedPalletIndex &&
      !this.orderProductData.records
        .filter(orderProduct => orderProduct.palletProducts && orderProduct.palletProducts.length)
        .map(orderProduct => orderProduct.palletProducts)
        .flat()
        .every(palletProduct => palletProduct.palletId !== this.palletInput.value)
    ) {
      setTimeout(() => this.palletInput.select(), 100)

      throw new Error(i18next.t('text.pallet_id_duplicated'))
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

  _completeHandler() {
    try {
      this._validateComplete()
      this._completeUnloading()
    } catch (e) {
      this._showToast({ message: e.message })
    }
  }

  _validateComplete() {
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
