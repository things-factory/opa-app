import { LitElement } from 'lit-element'
import '../image-viewer'
import { i18next } from '@things-factory/i18n-base'

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

  init() {
    return
  }

  checkCompleteValidity() {
    if (!this.record.operationGuide.completed) throw new Error(i18next.t('text.vas_is_not_completed_yet'))
  }

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

  _getOperationGuideData(key) {
    if (this.record.operationGuide && this.record.operationGuide.data && this.record.operationGuide.data[key]) {
      return this.record.operationGuide.data[key]
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
