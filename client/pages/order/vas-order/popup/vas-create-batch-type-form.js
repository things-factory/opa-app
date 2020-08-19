import { i18next } from '@things-factory/i18n-base'
import { html } from 'lit-element'
import { VAS_BATCH_NO_TYPE } from '../../../constants'
import { AbstractVasCreateForm } from './abastract-vas-create-form'

export class VasCreateBatchTypeForm extends AbstractVasCreateForm {
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
            placeholder="${this.maximumQty}"
            .value="${(this.record && this.record.qty) || this.maximumQty}"
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

  get target() {
    return this.selectedBatchId
  }

  get targetDisplay() {
    return this.selectedBatchId
  }

  get maximumQty() {
    if (this.selectedBatchId && this.selectedPackingType) {
      const packQty = this.targetList
        .filter(target => target.batchId === this.selectedBatchId && target.packingType === this.selectedPackingType)
        .reduce((packQty, target) => packQty + target.packQty, 0)

      const copiedVasList = this.vasList.map(vas => Object.assign({}, vas))
      const choosenQty = copiedVasList
        .map(task => {
          if (task.targetType === VAS_BATCH_NO_TYPE) {
            task.target = { batchId: task.target }
          }

          return task
        })
        .filter(task => task.packingType === this.selectedPackingType && task.target.batchId === this.selectedBatchId)
        .reduce((choosenQty, task) => (choosenQty += task.qty), 0)

      return packQty - choosenQty
    } else {
      return ''
    }
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
        this.qtyInput.value = this.maximumQty
        throw new Error(i18next.t('text.qty_exceed_limit'))
      }
    } catch (e) {
      this._showToast(e)
    }
  }
}

customElements.define('vas-create-batch-type-form', VasCreateBatchTypeForm)
