import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class PickingReplacementPopup extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      MultiColumnFormStyles,
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
      `
    ]
  }

  static get properties() {
    return {
      orderInventory: Object,
      replacePalletId: String,
      isWholePicking: Boolean,
      targetInventory: Object,
      config: Object,
      data: Object,
      isQtyEqual: Boolean
    }
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.original_pallet')}</legend>
          <label>${i18next.t('label.pallet_id')}</label>
          <input readonly value="${this.orderInventory.palletId}" />

          <label>${i18next.t('label.batch_id')}</label>
          <input readonly value="${this.orderInventory.batchId}" />

          <label>${i18next.t('label.product_name')}</label>
          <input readonly value="${this.orderInventory.product.name}" />

          <label>${i18next.t('label.packing_type')}</label>
          <input readonly value="${this.orderInventory.packingType}" />

          <label>${i18next.t('label.release_qty')}</label>
          <input readonly value="${this.orderInventory.releaseQty}" />
        </fieldset>
      </form>

      <form id="input-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.pallet_id')}</label>
          <barcode-scanable-input
            name="palletId"
            custom-input
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this.getPalletInfo(this.palletInput.value)
              }
            }}"
          ></barcode-scanable-input>

          <label>${i18next.t('label.release_qty')}</label>
          <input
            type="number"
            name="releaseQty"
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this.appendNewPallet()
              }
            }}"
            placeholder="${(this.targetInventory && this.targetInventory.qty) || 0}"
          />
        </fieldset>
      </form>

      <div class="grist">
        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data="${this.data}"
        ></data-grist>
      </div>

      ${this.isWholePicking
        ? ''
        : html`
            <form id="input-form" class="single-column-form">
              <fieldset>
                <legend>${i18next.t('title.return_location')}</legend>
                <label>${i18next.t('label.return_location')}</label>
                <barcode-scanable-input name="locationName" custom-input></barcode-scanable-input>
              </fieldset>
            </form>
          `}
      ${this.isQtyEqual
        ? html`
            <div class="button-container">
              <button @click="${this.replacePallet.bind(this)}">${i18next.t('button.replace')}</button>
            </div>
          `
        : ''}
    `
  }

  get palletInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=palletId]').shadowRoot.querySelector('input')
  }

  get releaseQtyInput() {
    return this.shadowRoot.querySelector('input[name=releaseQty]')
  }

  get locationInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=locationName]').shadowRoot.querySelector('input')
  }

  constructor() {
    super()
    this.data = { records: [] }
  }

  updated(changedProps) {
    if (changedProps.has('data')) {
      this.checkQtyEquality()
    }
  }

  async firstUpdated() {
    this.config = {
      rows: { appendable: false },
      pagination: { infinite: true },
      list: { fields: ['palletId', 'batchId', 'product', 'packingType', 'releaseQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          width: 130
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 130
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'center' },
          width: 200
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 200
        },
        {
          type: 'number',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { align: 'center' },
          width: 60
        }
      ]
    }

    await this.updateComplete
    this.palletInput.value = this.replacePalletId
    await this.getPalletInfo(this.replacePalletId)
    this._focusOnInput(this.releaseQtyInput)
  }

  async getPalletInfo(palletId) {
    try {
      if (!palletId) throw new Error(i18next.t('text.no_pallet_id'))
      if (!(await this.checkProductIdenticality(this.orderInventory.palletId, palletId)))
        throw new Error(i18next.t('text.wrong_pallet_id'))
      const response = await client.query({
        query: gql`
          query {
            inventories(${gqlBuilder.buildArgs({
              filters: [
                {
                  name: 'pallet_id',
                  operator: 'eq',
                  value: palletId
                }
              ],
              pagination: {
                limit: 1
              }
            })}) {
              items {
                palletId
                batchId
                product {
                  name
                  description
                }
                packingType
                qty
              }
            }
          }
        `
      })

      if (!response.errors) {
        this.targetInventory = response.data.inventories.items[0]
        this._focusOnInput(this.releaseQtyInput)
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  appendNewPallet() {
    try {
      this.checkValidity()
      this.data = {
        records: [...this.data.records, { ...this.targetInventory, releaseQty: parseInt(this.releaseQtyInput.value) }]
      }
      this.clearView()
      this._focusOnInput(this.palletInput)
    } catch (e) {
      this._showToast(e)
    }
  }

  checkValidity() {
    if (!this.targetInventory) {
      this._focusOnInput(this.palletInput)
      throw new Error(i18next.t('text.replacement_pallet_not_match_criteria'))
    }

    if (!parseInt(this.releaseQtyInput.value)) {
      this._focusOnInput(this.releaseQtyInput)
      throw new Error(i18next.t('text.release_qty_is_empty'))
    }

    if (this.targetInventory.qty < parseInt(this.releaseQtyInput.value)) {
      this._focusOnInput(this.releaseQtyInput)
      throw new Error(i18next.t('text.release_qty_cannot_exceed_stored_qty'))
    }

    let qty = this.data.records.reduce((qty, record) => {
      qty += record.releaseQty
      return qty
    }, 0)
    qty += parseInt(this.releaseQtyInput.value)

    if (qty > this.orderInventory.releaseQty) {
      this._focusOnInput(this.releaseQtyInput)
      throw new Error(i18next.t('text.release_qty_is_more_than_expected'))
    }
  }

  clearView() {
    this.palletInput.value = ''
    this.releaseQtyInput.value = ''
    this.targetInventory = null
    if (!this.isWholePicking) {
      this.locationInput.value = ''
    }
  }

  async checkProductIdenticality(palletA, palletB) {
    const response = await client.query({
      query: gql`
        query {
          checkProductIdenticality(${gqlBuilder.buildArgs({
            palletA,
            palletB
          })})
        }
      `
    })

    if (!response.errors) {
      return response.data.checkProductIdenticality
    }
  }

  checkQtyEquality() {
    this.isQtyEqual =
      this.orderInventory.releaseQty ===
      this.data.records.reduce((qty, record) => {
        qty += record.releaseQty
        return qty
      }, 0)
  }

  _focusOnInput(target) {
    setTimeout(() => target.focus(), 100)
  }

  async replacePallet() {
    try {
      this.validateReplacement()

      const args = {
        worksheetDetailName: this.orderInventory.name,
        inventories: this.data.records.map(record => {
          return {
            palletId: record.palletId,
            qty: record.releaseQty
          }
        })
      }
      if (!this.isWholePicking) {
        args.returnLocation = this.locationInput.value
      }

      const response = await client.query({
        query: gql`
          mutation {
            replacePickingPallets(${gqlBuilder.buildArgs(args)})
          }
        `
      })

      if (!response.errors) {
        this.dispatchEvent(new CustomEvent('completed'))
        history.back()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  validateReplacement() {
    if (!this.isWholePicking && !this.locationInput.value) {
      this._focusOnInput(this.locationInput)
      throw new Error(i18next.t('text.location_id_is_empty'))
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

window.customElements.define('picking-replacement-popup', PickingReplacementPopup)
