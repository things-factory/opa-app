import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { PageView, store, CustomAlert, UPDATE_CONTEXT } from '@things-factory/shell'
import { isMobileDevice } from '@things-factory/utils'
import { css, html } from 'lit-element'
import { openPopup } from '@things-factory/layout-base'
import { connect } from 'pwa-helpers/connect-mixin.js'

import './airway-bill-popup'

class PackingProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _orderNo: String,
      _selectedOrderProduct: Object,
      productData: Object,
      productConfig: Object,
      completeItem1: Boolean,
      completeItem2: Boolean,
      completeItem3: Boolean,
      completeItem4: Boolean,
      completeItem5: Boolean
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
        @media (max-width: 460px) {
          :host {
            display: block;
          }
        }
        .button-container {
          padding: var(--button-container-padding);
          margin: var(--button-container-margin);
          text-align: var(--button-container-align);
          background-color: var(--button-container-background);
          height: var(--button-container-height);
        }
        .button-container button {
          background-color: var(--button-container-button-background-color);
          border-radius: var(--button-container-button-border-radius);
          height: var(--button-container-button-height);
          border: var(--button-container-button-border);
          margin: var(--button-container-button-margin);

          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container button:hover,
        .button-container button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.packing')
    }
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get orderNoInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=orderNo]').shadowRoot.querySelector('input')
  }

  get palletInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=sku]').shadowRoot.querySelector('input')
  }

  get actualQtyInput() {
    return this.shadowRoot.querySelector('input[name=qty]')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('product-grist')
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.order_no')}</label>
          <barcode-scanable-input
            name="orderNo"
            custom-input
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.orderNoInput.value) {
                  this._clearView()
                  this._fetchOrderInformation()
                  this._orderNo = this.orderNoInput.value
                  this.orderNoInput.value = ''
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.order_information')}: ${this._orderNo}`}</legend>
          <label>${i18next.t('label.customer')}</label>
          <input name="bizplace" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.packing_list')}</h2>
          <data-grist
            id="product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.productConfig}
            .data=${this.productData}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('title.item_information')}</legend>
              <label>${i18next.t('label.name')}</label>
              <input name="name" readonly />

              <label>${i18next.t('label.uom')}</label>
              <input name="uom" readonly />

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.current_location')}</label>
              <input name="location" readonly />
            </fieldset>

            <fieldset>
              <legend>${i18next.t('title.input_section')}</legend>
              <label>${i18next.t('label.sku')}</label>
              <barcode-scanable-input name="sku" custom-input></barcode-scanable-input>

              <label>${i18next.t('label.packed_qty')}</label>
              <input name="packedQty" type="number" min="1" required />
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this._orderNo = ''
    this.productData = { records: [] }
    this.completeItem1 = false
    this.completeItem2 = false
    this.completeItem3 = false
    this.completeItem4 = false
    this.completeItem5 = false
  }

  updated(changedProps) {
    if (changedProps.has('_orderNo')) {
      this._updateContext()
    }
  }

  _updateContext() {
    let actions = []
    if (this._orderNo) {
      actions = [
        ...actions,
        { title: i18next.t('button.print_airway_bill'), action: this._printPackingLabel.bind(this) },
        { title: i18next.t('button.manual'), action: this._openManualChecking.bind(this) },
        { title: i18next.t('button.pack'), action: this._packing.bind(this) }
      ]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.packing'),
        actions
      }
    })
  }

  pageInitialized() {
    this.productConfig = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.batchId) {
              this._selectedOrderProduct = record
              this.inputForm.reset()
              this.palletInput.value = ''
              this._fillUpInputForm(record)
              this._focusOnPalletInput()
            }
          }
        }
      },
      pagination: { infinite: true },
      list: { fields: ['completed', 'locationName', 'sku', 'name', 'uom'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'completed',
          header: i18next.t('field.done'),
          width: 40
        },
        {
          type: 'string',
          name: 'location',
          header: i18next.t('field.location'),
          width: 100
        },
        {
          type: 'string',
          name: 'sku',
          header: i18next.t('field.sku'),
          width: 150
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          width: 200
        },
        {
          type: 'string',
          name: 'uom',
          header: i18next.t('field.uom'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 60
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnOrderNoField()
    }
  }

  _fetchOrderInformation() {
    this._fillUpInfoForm({ bizplace: 'PJ OUTLET' })
    this._fetchPackingList()
  }

  _fetchPackingList() {
    this.productData = {
      records: [
        {
          completed: this.completeItem1,
          location: 'BIN-0001',
          sku: 'OREGANO-OIL-1020',
          uom: 'Ea',
          name: 'OREGANO OIL, 90 SOFTGELS',
          batchId: 'OA-2020100239-B1',
          qty: 40
        },
        {
          completed: this.completeItem2,
          location: 'BIN-0002',
          sku: 'COMPLEX-C-20910',
          uom: 'Ea',
          name: 'MEGAFOOD, COMPLEX C',
          batchId: 'MG-2020100239-B1',
          qty: 20
        },
        {
          completed: this.completeItem3,
          location: 'BIN-0003',
          sku: 'BIODERMA-S0010',
          uom: 'Ea',
          name: 'BIODERMA SEBIUM H20 100ML',
          batchId: 'BO-2020100239-B1',
          qty: 5
        },
        {
          completed: this.completeItem4,
          location: 'BIN-0003',
          sku: 'CENTURY-9110',
          uom: 'Ea',
          name: '21st CENTURY VITAMIN C 1000MG, CHEWABLE 60 TABLETS',
          batchId: 'CV-2020100239-B1',
          qty: 10
        },
        {
          completed: this.completeItem5,
          location: 'BIN-0004',
          sku: 'SEVEN-C-8182',
          uom: 'Ea',
          name: 'SEVEN SEAS LIVER OIL GOLD 500+ 100 CAPSULES',
          batchId: 'SE-2020100239-B1',
          qty: 10
        }
      ]
    }
  }

  _printPackingLabel() {
    const orderNo = {
      records: {
        orderNo: this._orderNo
      }
    }
    openPopup(html` <airway-bill-popup .orderNo="${orderNo}"></airway-bill-popup> `, {
      backdrop: true,
      size: 'large',
      title: i18next.t('title.airway_bill')
    })
  }

  async _openManualChecking() {
    const result = await CustomAlert({
      title: i18next.t('title.kindly_confirm_the_sku_id'),
      text: `${this._selectedOrderProduct.sku}`,
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (!result.value) {
      return
    }

    this.palletInput.value = this._selectedOrderProduct.sku
  }

  _clearView() {
    this.inputForm.reset()
    this.productData = { records: [] }
    this.palletInput.value = ''
    this._productName = ''
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

  async _packing() {
    const result = await CustomAlert({
      title: i18next.t('title.are_you_sure'),
      text: i18next.t('text.pack_this_item'),
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (!result.value) {
      return
    }

    if (this.palletInput.value === 'OREGANO-OIL-1020') this.completeItem1 === true
    if (this.palletInput.value === 'COMPLEX-C-20910') this.completeItem2 === true
    if (this.palletInput.value === 'BIODERMA-S0010') this.completeItem3 === true
    if (this.palletInput.value === 'CENTURY-9110') this.completeItem4 === true
    if (this.palletInput.value === 'SEVEN-C-8182') this.completeItem5 === true

    this._fetchPackingList()
    this._showToast({ message: i18next.t('text.packed_successfully') })
    this.inputForm.reset()
    this.palletInput.value = ''
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

  _focusOnOrderNoField() {
    setTimeout(() => this.orderNoInput.focus(), 100)
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

window.customElements.define('packing-product', PackingProduct)
