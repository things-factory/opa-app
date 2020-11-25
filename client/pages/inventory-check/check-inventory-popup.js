import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { client } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
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

    if (this.selectedLocation) {
      this.locationInput.value = this.selectedLocation
    } else {
      this.locationInput.value = ''
    }
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

      <div class="button-container">
        <button @click="${this._checkPalletId}">${i18next.t('button.check')}</button>
      </div>
    `
  }

  focusOnPalletInput() {
    this.palletIdInput.value = ''
    this.palletIdInput.focus()
  }

  async _checkPalletId() {
    try {
      this._validateInput()

      const isInventoryOwner = await this._checkInventoryOwnership(this.palletIdInput.value, this.bizplaceName)
      if (!isInventoryOwner)
        throw new Error(i18next.t('text.inventory_not_belong_to_x', { state: { x: this.bizplaceName } }))

      const isUnderReleasing = await this._checkInventoryRelease(this.palletIdInput.value)
      if (isUnderReleasing) throw new Error(i18next.t('text.inventory_is_selected_for_releasing'))

      const hasFound = this._checkFromMissingList()

      if (hasFound) {
        this.dispatchEvent(
          new CustomEvent('relocate-missing-inventory', {
            detail: {
              missingRecord: this.missingInventory.records.find(item => item.palletId === this.palletIdInput.value),
              locationInput: this.locationInput.value
            }
          })
        )
      } else {
        const invInfo = await this._checkCurrentLocationinCC(this.palletIdInput.value, this.cycleCountNo)
        if (invInfo.currentLocation !== this.locationInput.value) {
          this.dispatchEvent(
            new CustomEvent('relocate-inventory', {
              detail: {
                recordInformation: invInfo,
                locationInput: this.locationInput.value
              }
            })
          )
        }
      }
    } catch (e) {
      history.back()
      this._showToast(e)
    }
  }

  async _checkInventoryOwnership(palletId, bizplaceName) {
    try {
      const response = await client.query({
        query: gql`
          query {
            checkInventoryOwner(${gqlBuilder.buildArgs({
              palletId,
              bizplaceName
            })})
          }
        `
      })

      if (!response.errors) {
        return response.data.checkInventoryOwner
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  async _checkCurrentLocationinCC(palletId, cycleCountNo) {
    try {
      const response = await client.query({
        query: gql`
          query {
            checkStockTakeCurrentLocation(${gqlBuilder.buildArgs({
              palletId,
              cycleCountNo
            })}) {
              currentLocation
              worksheetDetailName
              batchId
              palletId
              qty
              uom
              uomValue
              productName
              productDescription
            }
          }
        `
      })

      if (!response.errors) {
        return response.data.checkStockTakeCurrentLocation
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  async _checkInventoryRelease(palletId) {
    try {
      const response = await client.query({
        query: gql`
          query {
            checkInventoryRelease(${gqlBuilder.buildArgs({
              palletId
            })})
          }
        `
      })

      if (!response.errors) {
        return response.data.checkInventoryRelease
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  _validateInput() {
    const palletId = this.palletIdInput.value
    if (!palletId) {
      this.selectOnInput(this.palletIdInput)
      throw new Error(i18next.t('text.invalid_x', { state: { x: i18next.t('label.pallet_id') } }))
    }

    const locationName = this.locationInput.value
    if (!locationName) {
      this.selectOnInput(this.locationInput)
      throw new Error(i18next.t('text.invalid_x', { state: { x: i18next.t('label.location') } }))
    }
  }

  selectOnInput(input) {
    setTimeout(() => input.select(), 100)
  }

  _checkFromMissingList() {
    const foundPalletId = this.palletIdInput.value
    const missingPalletId = this.missingInventory.records.map(item => item.palletId)

    return missingPalletId.includes(foundPalletId)
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
