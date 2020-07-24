import { LitElement } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

export class AbstractVasCreateForm extends LitElement {
  static get styles() {
    return [MultiColumnFormStyles]
  }

  static get properties() {
    return {
      selectedBatchId: String,
      selectedProductId: String,
      selectedPackingType: String,
      targetList: Array,
      vasList: Array,
      targetBatchList: Array,
      targetProductList: Array,
      packingTypeList: Array,
      record: Object
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
    return this.targetList.map(target => target.batchId).filter((batchId, idx, arr) => arr.indexOf(batchId) === idx)
  }

  get targetBatchList() {
    return this.targetList.map(target => target.batchId).filter((batchId, idx, arr) => arr.indexOf(batchId) == idx)
  }

  get qty() {
    return this.qtyInput.value
  }

  checkValidity() {
    return this.form.checkValidity()
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
