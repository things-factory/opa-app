import { LitElement, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next } from '@things-factory/i18n-base'

export class VasCreateBatchTypeForm extends LitElement {
  static get properties() {
    return {
      selectedBatchId: Object,
      selectedPackingType: String,
      targetList: Array,
      targetBatchList: Array,
      packingTypeList: Array,
      record: Object
    }
  }

  static get styles() {
    return [MultiColumnFormStyles]
  }

  render() {
    return html`
      <form
        class="multi-column-form"
        @submit="${e => e.preventDefault()}"
        @change="${e => this.dispatchEvent(new CustomEvent('form-change'))}"
      >
        <fieldset>
          <label>${i18next.t('label.batch_no')}</label>
          <select
            id="target-selector"
            required
            @change="${e => {
              this.selectedBatchId = e.currentTarget.value
              this.packingTypeSelector.value = ''
              this.qtyInput.value = ''
            }}"
          >
            <option></option>
            ${this.targetBatchList.map(
              batch =>
                html`
                  <option value="${batch}" ?selected="${this.record && this.record.target === batch}">${batch}</option>
                `
            )}
          </select>

          <label>${i18next.t('label.packing_type')}</label>
          <select
            id="packing-type-selector"
            ?disabled="${!this.selectedBatchId}"
            required
            @change="${e => {
              this.selectedPackingType = e.currentTarget.value
              this.qtyInput.value = ''
            }}"
          >
            <option></option>
            ${this.packingTypeList.map(
              packingType => html`
                <option ?selected="${this.record && this.record.packingType === packingType}">${packingType}</option>
              `
            )}
          </select>

          <label>${i18next.t('label.qty')}</label>
          <input
            id="qty-input"
            ?disabled="${!this.selectedBatchId || !this.selectedPackingType}"
            type="number"
            min="1"
            value="${(this.record && this.record.qty) || 1}"
            @change="${this._checkQtyValidity.bind(this)}"
          />
        </fieldset>
      </form>
    `
  }

  firstUpdated() {
    if (this.record) {
      this.selectedBatchId = this.record.target
      this.selectedPackingType = this.record.packingType
      this.qtyInput.value = this.record.qty
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get packingTypeSelector() {
    return this.shadowRoot.querySelector('select#packing-type-selector')
  }

  get qtyInput() {
    return this.shadowRoot.querySelector('input#qty-input')
  }

  get targetBatchList() {
    return this.targetList.map(target => target.batchId).filter((batchId, idx, arr) => arr.indexOf(batchId) == idx)
  }

  get packingTypeList() {
    if (this.selectedBatchId) {
      return this.targetList
        .filter(target => target.batchId === this.selectedBatchId)
        .map(target => target.packingType)
        .filter((packingType, idx, arr) => arr.indexOf(packingType) == idx)
    } else {
      return []
    }
  }

  get targetDisplay() {
    return this.selectedBatchId
  }

  get target() {
    return this.selectedBatchId
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
        .filter(target => target.batchId === this.selectedBatchId && target.packingType === this.selectedPackingType)
        .reduce((packQty, target) => (packQty += target.packQty), 0)

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

customElements.define('vas-create-batch-type-form', VasCreateBatchTypeForm)
