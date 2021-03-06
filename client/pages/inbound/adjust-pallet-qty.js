import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { css, html, LitElement } from 'lit-element'
import { openPopup } from '@things-factory/layout-base'
import './vas-selector'

class AdjustPalletQty extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      config: String,
      record: Object,
      repalletizingClick: Boolean
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
  constructor() {
    super()
    this.repalletizingClick = true
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
          <!-- this should appear only if it is a loose item  -->
          <label ?hidden=${!this.record.isLooseItem}>${i18next.t('label.repalletizing_vas')}</label>
          <input
            ?hidden=${!this.record.isLooseItem}
            name="vasSelector"
            value="${this.record.palletizingVasName ? this.record.palletizingVasName : ''}"
            @click="${this.clickHandler}"
            readonly
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
        <button @click="${this._adjustPalletQty.bind(this)}">${i18next.t('button.adjust')}</button>
      </div>
    `
  }
  clickHandler(event) {
    this._openVasSelector()
    this.repalletizingClick = !this.repalletizingClick
  }

  get _form() {
    return this.shadowRoot.querySelector('form')
  }

  get _vasSelector() {
    return this.shadowRoot.querySelector('input[name=vasSelector]')
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

  _openVasSelector() {
    openPopup(
      html`
        <vas-selector
          @selected="${e => {
            this._vasSelector.value = `${e.detail.name} ${e.detail.description ? `(${e.detail.description})` : ''}`
            this._vasSelector.palletizingVasId = e.detail.id
          }}"
        ></vas-selector>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.select_warehouse')
      }
    )
  }

  _adjustPalletQty() {
    try {
      this._validate()
      this.dispatchEvent(
        new CustomEvent('pallet-adjusted', {
          detail: {
            palletQty: parseInt(this._palletQtyInput.value),
            palletizingDescription: this._descriptionInput.value,
            palletizingVasId: this._vasSelector.palletizingVasId,
            palletizingVasName: this._vasSelector.value
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
    if (this.record.isLooseItem && !this._vasSelector.palletizingVasId)
      throw new Error(i18next.t('text.vas_is_not_selected'))
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
