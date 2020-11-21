import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { css, html, LitElement } from 'lit-element'

class CheckInventoryPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      bizplaceName: String,
      cycleCountNo: String,
      selectedLocation: String,
      missingInventory: Object,
      config: Object,
      data: Object
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
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
        .input-container {
          display: flex;
        }
        .button-container {
          padding: var(--button-container-padding);
          margin: var(--button-container-margin);
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
        .button-container > barcode-scanable-input {
          margin: auto;
        }
      `
    ]
  }

  async firstUpdated() {
    await this.updateComplete
    console.log(this.missingInventory)
    if (this.selectedLocation) this.locationInput.value = this.selectedLocation
    this.focusOnPalletInput()
  }

  get palletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=palletId]').shadowRoot.querySelector('input')
  }

  get locationInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=location]').shadowRoot.querySelector('input')
  }

  render() {
    return html`
      <form
        id="input-form"
        class="single-column-form"
        @keypress="${async e => {
          if (e.keyCode === 13) {
            e.preventDefault()
            this._checkPalletId()
          }
        }}"
      >
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.pallet_id')}</label>
          <barcode-scanable-input name="palletId" custom-input></barcode-scanable-input>

          <label>${i18next.t('label.current_location')}</label>
          <barcode-scanable-input name="location" custom-input></barcode-scanable-input>
        </fieldset>
      </form>
    `
  }

  focusOnPalletInput() {
    this.palletIdInput.value = ''
    this.palletIdInput.focus()
  }

  async _checkPalletId() {
    try {
      const response = await client.query({
        query: gql`
          query {
            checkCycleCountInventory(${gqlBuilder.buildArgs({
              palletId: this.palletIdInput.value,
              bizplaceName: this.bizplaceName,
              cycleCountNo: this.cycleCountNo
            })})
          }
        `
      })

      if (!response.errors) {
        return response.data.checkInventoryOwner
      }
    } catch (e) {
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

window.customElements.define('check-inventory-popup', CheckInventoryPopup)
