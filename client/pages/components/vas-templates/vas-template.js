import { LitElement } from 'lit-element'
import '../image-viewer'

export class VasTemplate extends LitElement {
  get contextButtons() {
    return null
  }

  get _isEditable() {
    return !this.record.status
  }

  get transactions() {
    throw new Error('transactions getter should be implemented by component which extends VasTemplate')
  }

  get revertTransactions() {
    throw new Error('revertTransactions getter should be implemented by component which extends VasTemplate')
  }

  get data() {
    throw new Error('data getter should be implemented by component which extends VasTemplate')
  }

  get completeParams() {
    return null
  }

  checkCompleteValidity() {}

  adjust() {
    try {
      this.validateAdjust()
      return {
        data: this.data,
        transactions: this.transactions
      }
    } catch (e) {
      throw e
    }
  }

  validateAdjust() {
    throw new Error('validateAdjust function should be implemented by component which extends VasTemplate')
  }
}
