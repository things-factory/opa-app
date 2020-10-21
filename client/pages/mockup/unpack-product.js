import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { PageView, store, CustomAlert, UPDATE_CONTEXT } from '@things-factory/shell'
import { isMobileDevice } from '@things-factory/utils'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'

class UnpackProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _lotNo: String,
      _selectedOrderProduct: Object,
      productData: Object,
      productConfig: Object
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
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.unpacking')
    }
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get lotNoInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=lotNo]').shadowRoot.querySelector('input')
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
          <label>${i18next.t('label.lot_no')}</label>
          <barcode-scanable-input
            name="lotNo"
            custom-input
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.lotNoInput.value) {
                  this._clearView()
                  this._fetchInventories(this.lotNoInput.value)
                  this._lotNo = this.lotNoInput.value
                  this.lotNoInput.value = ''
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.lot_information')}: ${this._lotNo}`}</legend>

          <label>${i18next.t('label.batch_no')}</label>
          <input name="batchId" readonly />

          <label>${i18next.t('label.sku')}</label>
          <input name="sku" readonly />

          <label>${i18next.t('label.product_name')}</label>
          <input name="productName" readonly />

          <label>${i18next.t('label.uom')}</label>
          <input name="uom" readonly />

          <label>${i18next.t('label.location')}</label>
          <input name="locationName" readonly />

          <label>${i18next.t('label.qty')}</label>
          <input name="qty" type="number" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.child_product')}</h2>
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
              <legend>${i18next.t('title.unpack_procedure')}</legend>
              <input type="checkbox" name="fullUnpack" />
              <label>${i18next.t('label.fully_unpack')}</label>

              <label>${i18next.t('label.new_lot_id')}</label>
              <barcode-scanable-input
                name="palletId"
                .value=${this._palletId}
                without-enter
                custom-input
              ></barcode-scanable-input>

              <label>${i18next.t('label.sku')}</label>
              <input name="sku" readonly />

              <label>${i18next.t('label.name')}</label>
              <input name="name" readonly />

              <label>${i18next.t('label.uom')}</label>
              <input name="uom" readonly />

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.qty')}</label>
              <input name="qty" type="number" />
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this._lotNo = ''
    this.orderProductData = { records: [] }
  }

  updated(changedProps) {
    if (changedProps.has('_lotNo')) {
      this._updateContext()
    }
  }

  _updateContext() {
    let actions = []
    if (this._lotNo) {
      actions = [
        ...actions,
        { title: i18next.t('button.print_label'), action: this._printLabel.bind(this) },
        { title: i18next.t('button.unpack'), action: this._unpacking.bind(this) }
      ]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.unpacking'),
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
      list: { fields: ['sku', 'name', 'uom'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          hidden: true
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
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnLotField()
    }
  }

  _fetchInventories() {
    this._fillUpInfoForm({
      batchId: 'PA-2020100239-B1',
      sku: 'DETTOL-201023-60',
      productName: 'DETTOL HAND SANITIZER 200ML x 60',
      uom: 'CARTON',
      locationName: '01-BUFFER',
      qty: 10
    })

    this._fetchProducts()
  }

  _fetchProducts() {
    this.productData = {
      records: [
        { sku: 'DETTOL-201023-1', uom: 'Ea', name: 'DETTOL HAND SANITIZER 200ML', batchId: 'PA-2020100239-B1' },
        { sku: 'DETTOL-201023-5', uom: 'BAG', name: 'DETTOL HAND SANITIZER 200ML x 5', batchId: 'PA-2020100239-B1' }
      ]
    }
  }

  _printLabel() {}

  _clearView() {
    this.infoForm.reset()
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

  async _unpacking(e) {
    const result = await CustomAlert({
      title: i18next.t('title.are_you_sure'),
      text: i18next.t('text.unpack_current_lot'),
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (!result.value) {
      return
    }
    this._showToast({ message: i18next.t('text.successfully_unpack') })
    this._clearView()
    this._focusOnLotField()
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

  _focusOnLotField() {
    setTimeout(() => this.lotNoInput.focus(), 100)
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

window.customElements.define('unpack-product', UnpackProduct)
