import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { css, html, LitElement } from 'lit-element'

class AdjustPalletQty extends localize(i18next)(LitElement) {
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
          display: flex;
          flex: 1;
        }
        .button-container > mwc-button {
          margin: auto 0 0 auto;
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
            this._adjustPalletQty()
          }
        }}"
      >
        <fieldset>
          <legend>${i18next.t('title.product')}</legend>
          <label>${i18next.t('label.batch_no')}</label>
          <input name="batchId" readonly value="${this.record.batchId}" />

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
          <legend>${i18next.t('title.adjust_pallet_qty')}</legend>
          <label>${i18next.t('label.pallet_qty')}</label>
          <input
            name="palletQty"
            type="number"
            min="1"
            value="${this.record.palletQty ? this.record.palletQty : ''}"
            required
          />

          <label>${i18next.t('label.comment')}</label>
          <input
            name="description"
            type="text"
            value="${this.record.palletizingDescription ? this.record.palletizingDescription : ''}"
            required
          />
        </fieldset>
      </form>

      <div class="button-container">
        <mwc-button @click="${this._adjustPalletQty.bind(this)}">${i18next.t('button.adjust')}</mwc-button>
      </div>
    `
  }

  get _form() {
    return this.shadowRoot.querySelector('form')
  }

  get _palletQtyInput() {
    return this.shadowRoot.querySelector('input[name=palletQty]')
  }

  get _descriptionInput() {
    return this.shadowRoot.querySelector('input[name=description]')
  }

  firstUpdated() {
    this._focusOnInput()
  }

  _focusOnInput() {
    setTimeout(() => this._palletQtyInput.select(), 100)
  }

  _adjustPalletQty() {
    try {
      this._validate()
      this.dispatchEvent(
        new CustomEvent('pallet-adjusted', {
          detail: {
            palletQty: parseInt(this._palletQtyInput.value),
            palletizingDescription: this._descriptionInput.value
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

window.customElements.define('adjust-pallet-qty', AdjustPalletQty)
