import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next } from '@things-factory/i18n-base'
import { html, LitElement } from 'lit-element'

export class VasCreateBatchProductTypeForm extends LitElement {
  static get properties() {
    return {
      selectedBatchId: String,
      selectedProductId: String,
      selectedPackingType: String,
      targetList: Array,
      targetBatchList: Array,
      targetProductList: Array,
      packingTypeList: Array,
      record: Object
    }
  }

  static get styles() {
    return [MultiColumnFormStyles]
  }

  render() {
    return html` <form class="multi-column-form" @submit="${e => e.preventDefault()}">
      <fieldset>
        <label>${i18next.t('label.batch_no')}</label>
        <select
          id="target-batch-selector"
          required
          @change="${e => {
            this.selectedBatchId = e.currentTarget.value
            this.targetProductSelector.value = ''
            this.packingTypeSelector.value = ''
            this.qtyInput.value = ''
          }}"
        >
          <option></option>
          ${this.targetBatchList.map(
            batch =>
              html`
                <option
                  value="${batch}"
                  ?selected="${this.record && this.record.target && this.record.target.batchId === batch}"
                  >${batch}</option
                >
              `
          )}
        </select>

        <label>${i18next.t('label.product')}</label>
        <select
          id="target-product-selector"
          ?disabled="${!this.selectedBatchId}"
          required
          @change="${e => {
            this.selectedProductId = e.currentTarget.value
            this.packingTypeSelector.value = ''
            this.qtyInput.value = ''
          }}"
        >
          <option></option>
          ${this.targetProductList.map(
            product =>
              html`
                <option
                  value="${product.id}"
                  ?selected="${this.record && this.record.target && this.record.target.productId === product.id}"
                  >${product.name} ${product.description ? `- ${product.description}` : ''}</option
                >
              `
          )}
        </select>

        <label>${i18next.t('label.packing_type')}</label>
        <select
          id="packing-type-selector"
          ?disabled="${!this.selectedBatchId || !this.selectedProductId}"
          required
          @change="${e => {
            this.selectedPackingType = e.currentTarget.value
            this.qtyInput.value = ''
          }}"
        >
          <option></option>
          ${this.packingTypeList.map(
            packingType => html`
              <option ?selected="${this.record && this.record.packingType === packingType}">
                ${packingType}
              </option>
            `
          )}
        </select>

        <label>${i18next.t('label.qty')}</label>
        <input
          ?readonly="${!this.selectedBatchId || !this.selectedProductId || !this.selectedPackingType}"
          id="qty-input"
          type="number"
          min="1"
          value="${(this.record && this.record.qty) || 1}"
          @change="${this._checkQtyValidity.bind(this)}"
        />
      </fieldset>
    </form>`
  }

  firstUpdated() {
    if (this.record && this.record.target) {
      this.selectedBatchId = this.record.target.batchId
      this.selectedProductId = this.record.target.productId
      this.selectedPackingType = this.record.packingType
      this.qtyInput.value = this.record.qty
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get targetProductSelector() {
    return this.shadowRoot.querySelector('select#target-product-selector')
  }

  get packingTypeSelector() {
    return this.shadowRoot.querySelector('select#packing-type-selector')
  }

  get qtyInput() {
    return this.shadowRoot.querySelector('input#qty-input')
  }

  get targetBatchList() {
    return this.targetList.map(target => target.batchId).filter((batchId, idx, arr) => arr.indexOf(batchId) === idx)
  }

  get targetProductList() {
    if (this.selectedBatchId) {
      return this.targetList
        .filter(target => target.batchId === this.selectedBatchId)
        .map(target => target.product)
        .filter((prod, idx, arr) => arr.map(prod => prod.id).indexOf(prod.id) === idx)
    } else {
      return []
    }
  }

  get packingTypeList() {
    if (this.selectedBatchId && this.selectedProductId) {
      return this.targetList
        .filter(target => target.batchId === this.selectedBatchId && target.product.id === this.selectedProductId)
        .map(target => target.packingType)
        .filter((packingType, idx, arr) => arr.indexOf(packingType) == idx)
    } else {
      return []
    }
  }

  get targetDisplay() {
    const selectedProdct = this.targetList.find(target => target.product.id === this.selectedProductId).product

    return `${this.selectedBatchId} - ${selectedProdct.name} ${
      selectedProdct.description ? `(${selectedProdct.description})` : ''
    }`
  }

  get target() {
    return {
      batchId: this.selectedBatchId,
      productId: this.selectedProductId
    }
  }

  get qty() {
    return this.qtyInput.value
  }

  checkValidity() {
    return this.form.checkValidity()
  }

  _checkQtyValidity() {
    try {
      const qty = Number(this.qtyInput.value)

      if (qty <= 0) {
        this.qtyInput.value = 1
        throw new Error('text.qty_should_be_positive')
      }

      const packQty = this.targetList
        .filter(
          target =>
            target.batchId === this.selectedBatchId &&
            target.product.id === this.selectedProductId &&
            target.packingType === this.selectedPackingType
        )
        .reduce((packQty, target) => packQty + target.packQty, 0)

      if (packQty && qty > packQty) {
        this.qtyInput.value = packQty
        throw new Error(i18next.t('text.qty_exceed_limit'))
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

customElements.define('vas-create-batch-product-type-form', VasCreateBatchProductTypeForm)
