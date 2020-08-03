import { i18next } from '@things-factory/i18n-base'
import { html } from 'lit-element'
import { VAS_BATCH_NO_TYPE, VAS_PRODUCT_TYPE } from '../../constants'
import { AbstractVasCreateForm } from './abastract-vas-create-form'

export class VasCreateBatchProductTypeForm extends AbstractVasCreateForm {
  render() {
    return html` <form
      class="multi-column-form"
      @submit="${e => e.preventDefault()}"
      @change="${e => this.dispatchEvent(new CustomEvent('form-change'))}"
    >
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
          .value="${(this.record && this.record.qty) || this.maximumQty}"
          placeholder="${this.maximumQty}"
          @change="${this._checkQtyValidity.bind(this)}"
        />

        <label>${i18next.t('label.weight')}</label>
        <input
          ?readonly="${!this.selectedBatchId || !this.selectedProductId || !this.selectedPackingType}"
          id="weight-input"
          type="number"
          min="0.01"
          step="0.01"
          .value="${(this.record && this.record.qty) || this.maximumWeight}"
          @change="${this._checkWeightValidity.bind(this)}"
          placeholder="${this.maximumWeight}"
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

  get targetProductSelector() {
    return this.shadowRoot.querySelector('select#target-product-selector')
  }

  get weightInput() {
    return this.shadowRoot.querySelector('input#weight-input')
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

  get target() {
    return {
      batchId: this.selectedBatchId,
      productId: this.selectedProductId
    }
  }

  get targetDisplay() {
    const selectedProdct = this.targetList.find(target => target.product.id === this.selectedProductId).product

    return `${this.selectedBatchId} - ${selectedProdct.name} ${
      selectedProdct.description ? `(${selectedProdct.description})` : ''
    }`
  }

  get weight() {
    return this.weightInput.value
  }

  get maximumQty() {
    if (this.selectedBatchId && this.selectedProductId && this.selectedPackingType) {
      return this._calcAvailAmount().totalQty
    } else {
      return ''
    }
  }

  get maximumWeight() {
    if (this.selectedBatchId && this.selectedProductId && this.selectedPackingType) {
      return this._calcAvailAmount().totalWeight
    } else {
      return ''
    }
  }

  _checkQtyValidity() {
    let totalQty, unitWeight

    try {
      const amount = this._calcAvailAmount()
      totalQty = amount.totalQty
      unitWeight = amount.unitWeight
      const qty = Number(this.qtyInput.value)

      if (!totalQty) {
        this.qtyInput.value = ''
        throw new Error('text.there_is_no_product')
      }

      if (qty <= 0) {
        this.qtyInput.value = 1
        throw new Error('text.qty_should_be_positive')
      }

      if (totalQty && qty > totalQty) {
        this.qtyInput.value = totalQty
        throw new Error(i18next.t('text.qty_exceed_limit'))
      }
    } catch (e) {
      this._showToast(e)
    } finally {
      const qty = Number(this.qtyInput.value)
      this.weightInput.value = qty * unitWeight
    }
  }

  _checkWeightValidity() {
    let totalWeight, unitWeight

    try {
      const amount = this._calcAvailAmount()
      totalWeight = amount.totalWeight
      unitWeight = amount.unitWeight
      const weight = Number(this.weightInput.value)

      if (totalWeight) {
        this.qtyInput.value = ''
        throw new Error('text.there_is_no_product')
      }

      if (weight <= 0) {
        this.weightInput.value = 1
        throw new Error('text.weight_should_be_positive')
      }

      if (totalWeight && weight > totalWeight) {
        this.weightInput.value = totalWeight
        throw new Error(i18next.t('text.weight_exceed_limit'))
      }
    } catch (e) {
      this._showToast(e)
    } finally {
      const weight = Number(this.weightInput.value)
      this.qtyInput.value = weight / unitWeight
    }
  }

  _calcAvailAmount() {
    const targetItems = this.targetList.filter(
      target =>
        target.batchId === this.selectedBatchId &&
        target.product.id === this.selectedProductId &&
        target.packingType === this.selectedPackingType
    )

    if (targetItems.every(item => item.unitWeight === targetItems[0].unitWeight)) {
      let { totalQty, unitWeight, totalWeight } = targetItems.reduce(
        (availAmount, item) => {
          availAmount = {
            unitWeight: item.unitWeight,
            totalQty: availAmount.totalQty + item.packQty,
            totalWeight: availAmount.totalWeight + item.totalWeight
          }
          return availAmount
        },
        {
          totalQty: 0,
          unitWeight: 0,
          totalWeight: 0
        }
      )

      // Batch와 packing type이 같거나
      // product id와 packing type이 같은 것들
      const copiedVasList = this.vasList.map(vas => Object.assign({}, vas))
      const choosenAmount = copiedVasList
        .map(task => {
          if (task.targetType === VAS_BATCH_NO_TYPE) {
            task.target = { batchId: task.target }
          } else if (task.targetType === VAS_PRODUCT_TYPE) {
            task.target = { productId: task.target }
          }

          return task
        })
        .filter(
          task =>
            task.packingType === this.selectedPackingType &&
            (task.target.batchId === this.selectedBatchId || task.target.productId === this.selectedProductId)
        )
        .reduce(
          (choosenAmount, task) => {
            choosenAmount.totalQty += task.qty
            choosenAmount.totalWeight += task.weight

            return choosenAmount
          },
          { totalQty: 0, totalWeight: 0 }
        )

      // 현재 VAS에 포함된 수량과 weight을 더하여 return
      return {
        totalQty: totalQty - choosenAmount.totalQty + (this.record.qty || 0),
        totalWeight: totalWeight - choosenAmount.totalWeight + (this.record.weight || 0),
        unitWeight
      }
    } else {
      throw new Error(i18next.t('text.some_unit_weight_is_diff'))
    }
  }
}

customElements.define('vas-create-batch-product-type-form', VasCreateBatchProductTypeForm)
