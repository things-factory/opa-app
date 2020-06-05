import { localize, i18next } from '@things-factory/i18n-base'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { LitElement, html, css } from 'lit-element'
import { client } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import '@things-factory/barcode-ui'

class VasPalletAddPopup extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
          padding: 20px;
        }
        .button-container {
          padding: var(--button-container-padding);
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

  static get properties() {
    return {
      currentPalletId: String,
      allowCurrentPalletId: Boolean
    }
  }

  render() {
    return html`
      <form
        id="pallet-add-form"
        class="single-column-form"
        @submit="${e => e.preventDefault()}"
        @keypress="${e => {
          if (e.keyCode === 13) this.addPallet()
        }}"
      >
        <fieldset>
          <legend>${i18next.t('title.add_pallet')}</legend>

          <label>${i18next.t('label.pallet')}</label>
          <barcode-scanable-input name="pallet-id" custom-input></barcode-scanable-input>

          <label>${i18next.t('label.location')}</label>
          <barcode-scanable-input name="location-name" custom-input></barcode-scanable-input>

          <label>${i18next.t('label.package_qty')}</label>
          <input name="package-qty" type="number" min="1" required />
        </fieldset>
      </form>

      <div class="button-container">
        <button @click="${this.addPallet}">
          ${i18next.t('button.add')}
        </button>
      </div>
    `
  }

  get palletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=pallet-id]').shadowRoot.querySelector('input')
  }

  get locationInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=location-name]').shadowRoot.querySelector('input')
  }

  get packageQtyInput() {
    return this.shadowRoot.querySelector('input[name=package-qty]')
  }

  async firstUpdated() {
    await this.updateComplete
    this.palletIdInput.addEventListener('change', this._checkPalletIdValidity.bind(this))
    this.locationInput.addEventListener('change', this._checkLocationValidity.bind(this))
  }

  addPallet(e) {
    try {
      this._checkPalletAddable()
      this.dispatchEvent(
        new CustomEvent('add-pallet', {
          detail: {
            palletId: this.palletIdInput.value,
            locationName: this.locationInput.value,
            packageQty: Number(this.packageQtyInput.value)
          }
        })
      )

      history.back()
    } catch (e) {
      this._showToast(e)
    }
  }

  _checkPalletAddable() {
    if (!this.palletIdInput.value) {
      this.palletIdInput.select()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    if (!this.locationInput.value) {
      this.locationInput.select()
      throw new Error(i18next.t('text.location_code_is_empty'))
    }

    if (!Number(this.packageQtyInput.value) || Number(this.packageQtyInput.value) <= 0) {
      this.packageQtyInput.select()
      throw new Error(i18next.t('text.package_qty_should_be_positive'))
    }
  }

  async _checkPalletIdValidity() {
    try {
      const palletId = this.palletIdInput.value
      if (!palletId) return

      if (!this.hasAttribute('allowCurrentPalletId') && palletId === this.currentPalletId) {
        palletId === this.currentPalletId
        throw new Error(i18next.t('text.wrong_pallet_id'))
      } else if (this.hasAttribute('allowCurrentPalletId') && palletId === this.currentPalletId) {
        return
      }

      const response = await client.query({
        query: gql`
          query {
            inventoryByPallet(${gqlBuilder.buildArgs({
              palletId
            })}) {
              id
            }
          }
        `
      })

      if (!response.errors) {
        if (response.data.inventoryByPallet) throw new Error(i18next.t('text.wrong_pallet_id'))
      }
    } catch (e) {
      this.palletIdInput.value = ''
      this.palletIdInput.focus()
      this._showToast(e)
    }
  }

  async _checkLocationValidity() {
    try {
      const locationName = this.locationInput.value
      if (!locationName) return

      const response = await client.query({
        query: gql`
          query {
            locationByName(${gqlBuilder.buildArgs({
              name: locationName
            })}) {
              id
            }
          }
        `
      })

      if (!response.errors) {
        if (!response.data.locationByName) throw new Error(i18next.t('text.there_is_no_location'))
      }
    } catch (e) {
      this.locationInput.value = ''
      this.locationInput.focus()
      this._showToast(e)
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

customElements.define('vas-pallet-add-popup', VasPalletAddPopup)
