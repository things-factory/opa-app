import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/popup-note'

class TransferInventory extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _palletId: String
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }

        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          overflow: hidden;
          flex: 1;
        }
        .left-column {
          overflow: hidden;
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        .right-column {
          overflow: auto;
          display: flex;
          flex: 1;
          flex-direction: column;
        }

        data-grist {
          flex: 1;
        }

        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .grist h2 {
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }

        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }

        h2 + data-grist {
          padding-top: var(--grist-title-with-grid-padding);
        }

        @media (max-width: 460px) {
          :host {
            display: block;
          }
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.transfer_inventory'),
      actions: this._actions
    }
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get detailForm() {
    return this.shadowRoot.querySelector('form#detail-form')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get palletInput() {
    return this.shadowRoot
      .querySelector('barcode-scanable-input[name=searchPalletId]')
      .shadowRoot.querySelector('input')
  }

  get palletIdInfo() {
    return this.shadowRoot.querySelector('input[name=palletId]')
  }

  get currentLocationInput() {
    return this.shadowRoot.querySelector('input[name=locationName]')
  }

  get fromLocationNameInput() {
    return this.shadowRoot.querySelector('input[name=fromLocationName]')
  }

  get toLocationNameInput() {
    return this.shadowRoot
      .querySelector('barcode-scanable-input[name=toLocationName]')
      .shadowRoot.querySelector('input')
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.pallet_id')}</label>
          <barcode-scanable-input
            name="searchPalletId"
            custom-input
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.palletInput.value) {
                  this._fetchInventory(this.palletInput.value)
                  this.palletInput.value = ''
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <form id="detail-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('title.inventory')}</legend>

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.pallet_id')}</label>
              <input name="palletId" readonly />

              <label>${i18next.t('label.product')}</label>
              <input name="productName" readonly />

              <label>${i18next.t('label.qty')}</label>
              <input name="qty" type="number" readonly />

              <label>${i18next.t('label.location')}</label>
              <input name="locationName" readonly />
            </fieldset>
          </form>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('title.input_section')}</legend>

              <label>${i18next.t('label.from_location')}</label>
              <input
                name="fromLocationName"
                @keypress="${e => {
                  if (e.keyCode === 13) {
                    e.preventDefault()
                    if (this.fromLocationNameInput.value) {
                      this._transferInventory()
                    }
                  }
                }}"
                readonly
              />

              <label>${i18next.t('label.to_location')}</label>
              <barcode-scanable-input
                name="toLocationName"
                custom-input
                @keypress="${e => {
                  if (e.keyCode === 13) {
                    e.preventDefault()
                    if (this.toLocationNameInput.value) {
                      this._transferInventory()
                    }
                  }
                }}"
              ></barcode-scanable-input>
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this._palletId = ''
  }

  _updateContext() {
    this._actions = []

    if (this._palletId) {
      this._actions = [
        ...this._actions,
        { title: i18next.t('button.transfer'), action: this._transferInventory.bind(this) }
      ]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  pageInitialized() {
    this.inventoryConfig = {
      rows: {
        appendable: false
      },
      pagination: {
        infinite: true
      },
      list: { fields: ['batchId', 'palletId', 'product', 'qty', 'location'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          width: 150
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          width: 200
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          width: 100
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnPalletInput()
    }
  }

  async _fetchInventory(palletId) {
    try {
      const response = await client.query({
        query: gql`
          query {
            inventoryByPallet(${gqlBuilder.buildArgs({
              palletId
            })}) {
              batchId
              palletId
              qty
              zone
              warehouse {
                id
                name
                description
              }
              location {
                id
                name
                description
              }
              product {
                id
                name
                description
              }
            }
          }
        `
      })

      if (!response.errors) {
        const inventory = response.data.inventoryByPallet
        if (!inventory) {
          this._focusOnPalletInput()
          throw new Error(i18next.t('text.wrong_pallet_id'))
        }

        this._fillUpDetailForm({
          ...inventory,
          productName: inventory.product.name,
          locationName: inventory.location.name
        })
        this._palletId = inventory.palletId
        this.fromLocationNameInput.value = inventory.location.name
        this.toLocationNameInput.focus()
        this._updateContext()
      }
    } catch (e) {
      this.palletInput.focus()
      this._showToast(e)
    }
  }

  async _transferInventory() {
    try {
      this._validateLocation()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.complete_transfer'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            inventoryTransfer(${gqlBuilder.buildArgs({
              palletId: this.palletIdInfo.value,
              fromLocationName: this.fromLocationNameInput.value,
              toLocationName: this.toLocationNameInput.value
            })})
          }
        `
      })

      if (!response.errors) {
        await CustomAlert({
          title: i18next.t('title.completed'),
          text: i18next.t('text.transfer_completed'),
          confirmButton: { text: i18next.t('button.confirm') }
        })

        this._clearView()
        this.palletInput.focus()
        this._updateContext()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _fillUpDetailForm(data) {
    this.detailForm.reset()
    for (let key in data) {
      Array.from(this.detailForm.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  _validateLocation() {
    if (!this.fromLocationNameInput.value) {
      this._focusOnFromLocationInput()
      throw new Error(i18next.t('text.there_is_no_from_location'))
    }

    if (!this.toLocationNameInput.value) {
      this._focusOnToLocationInput()
      throw new Error(i18next.t('text.there_is_no_to_location'))
    }

    if (this.currentLocationInput.value !== this.fromLocationNameInput.value) {
      throw new Error(i18next.t('text.from_location_not_match_with_location'))
    }

    if (this.fromLocationNameInput.value == this.toLocationNameInput.value) {
      throw new Error(i18next.t('text.from_location_is_same_as_to_location'))
    }
  }

  _focusOnPalletInput() {
    setTimeout(() => this.palletInput.focus(), 100)
  }

  _focusOnToLocationInput() {
    setTimeout(() => this.toLocationNameInput.focus(), 100)
  }

  _focusOnFromLocationInput() {
    setTimeout(() => this.fromLocationNameInput.focus(), 100)
  }

  _clearView() {
    this.infoForm.reset()
    this.detailForm.reset()
    this.fromLocationNameInput.value = ''
    this.toLocationNameInput.value = ''
    this.palletInput.value = ''
    this._palletId = ''
    this._updateContext()
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

window.customElements.define('transfer-inventory', TransferInventory)
