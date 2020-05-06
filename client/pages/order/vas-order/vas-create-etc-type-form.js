import { LitElement, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next } from '@things-factory/i18n-base'

export class VasCreateEtcTypeForm extends LitElement {
  static get properties() {
    return {
      record: Object
    }
  }

  static get styles() {
    return [MultiColumnFormStyles]
  }

  render() {
    return html`
      <form class="multi-column-form" @submit="${e => e.preventDefault()}">
        <fieldset>
          <label>${i18next.t('label.target')}</label>
          <input id="target-input" required value="${(this.record && this.record.target) || ''}" />
        </fieldset>
      </form>
    `
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get targetInput() {
    return this.shadowRoot.querySelector('input#target-input')
  }

  get targetDisplay() {
    return this.targetInput.value
  }

  get target() {
    return this.targetInput.value
  }

  checkValidity() {
    return this.form.checkValidity()
  }
}

customElements.define('vas-create-etc-type-form', VasCreateEtcTypeForm)
