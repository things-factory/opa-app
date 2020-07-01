import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { css, html, LitElement } from 'lit-element'

class AdjustBatchId extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      config: String,
      record: Object
    }
  }

  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
        }
        .button-container {
          padding: var(--button-container-padding);
          margin: var(--button-container-margin);
          margin-top: auto;
          text-align: var(--button-container-align);
          background-color: var(--button-container-background);
          height: var(--button-container-height);
        }
        .button-container button {
          background-color: var(--button-container-button-background-color);
          border-radius: var(--button-container-button-border-radius);
          height: var(--button-container-button-height);
          border: var(--button-container-button-border);
          margin: var(--button-container-button-margin);

          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container button:hover,
        .button-container button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  render() {
    return html`
      <form
        class="single-column-form"
        @keypress="${e => {
          if (e.keyCode === 13) {
            e.preventDefault()
            this._adjustBatchId()
          }
        }}"
      >
        <fieldset>
          <legend>${i18next.t('title.product')}</legend>
          <label>${i18next.t('label.batch_no')}</label>
          <input name="initialBatchId" readonly value="${this.record.initialBatchId}" />

          <label>${i18next.t('label.product')}</label>
          <input
            name="productName"
            readonly
            value="${`${this.record.product.name} ${
              this.record.product.description ? `(${this.record.product.description})` : ''
            }`}"
          />

          <label>${i18next.t('label.pack_qty')}</label>
          <input name="packQty" readonly value="${this.record.packQty}" />
        </fieldset>

        <fieldset>
          <legend>${i18next.t('title.adjust_batch_id')}</legend>
          <label>${i18next.t('label.new_batch_id')}</label>
          <input name="currentBatchId" required />
        </fieldset>
      </form>

      <div class="button-container">
        <button @click="${this._adjustBatchId.bind(this)}">${i18next.t('button.adjust')}</button>
      </div>
    `
  }

  get _form() {
    return this.shadowRoot.querySelector('form')
  }

  get _currentBatchIdInput() {
    return this.shadowRoot.querySelector('input[name=currentBatchId]')
  }

  get _initialBatchIdInput() {
    return this.shadowRoot.querySelector('input[name=initialBatchId]')
  }

  firstUpdated() {
    this._focusOnInput()
  }

  _focusOnInput() {
    setTimeout(() => this._currentBatchIdInput.select(), 100)
  }

  _adjustBatchId() {
    try {
      this._validate()
      this.dispatchEvent(
        new CustomEvent('batch-adjusted', {
          detail: {
            currentBatchId: this._currentBatchIdInput.value,
            hasBatchChanges: this._initialBatchIdInput.value !== this._currentBatchIdInput.value
          }
        })
      )

      history.back()
    } catch (e) {
      this._showToast(e)
    }
  }

  _validate() {
    if (!this._form.checkValidity()) throw new Error(i18next.t('text.invalid_form'))
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

window.customElements.define('adjust-batch-id', AdjustBatchId)
