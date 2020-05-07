import { LitElement } from 'lit-element'
import '../image-viewer'

export class VasTemplate extends LitElement {
  get transactions() {
    throw new Error('transactions getter should be implemented by component which extends VasTemplate')
  }

  get revertTransactions() {
    throw new Error('revertTransactions getter should be implemented by component which extends VasTemplate')
  }

  adjust() {
    throw new Error('ajdust function should be implemented by component which extends VasTemplate')
  }
}
