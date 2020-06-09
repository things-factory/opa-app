import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { PACKING_UNIT_QTY, PACKING_UNIT_WEIGHT } from './constants'

export class RepackPalletScanPopup extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex: 1;
          flex-direction: column;
          background-color: var(--main-section-background-color);
        }
        data-grist {
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      worksheetDetailName: String,
      packingUnit: String,
      requiredAmount: Number,
      config: Object,
      palletData: Object
    }
  }

  async firstUpdated() {
    await this.updateComplete
    this.config = {
      rows: { appendable: false },
      pagination: { infinite: true },
      list: { fields: ['palletId', 'locationName', 'repackedPkgQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: async (columns, data, column, record, rowIndex) => {
              this.palletData = {
                ...this.palletData,
                records: data.records.filter((_, idx) => idx !== rowIndex)
              }
            }
          }
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet'),
          width: 180
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          width: 60
        },
        {
          type: 'integer',
          name: 'weight',
          header: i18next.t('field.weight'),
          width: 60
        }
      ]
    }

    this.palletIdInput.focus()
  }

  render() {
    return html`
      <form
        class="single-column-form"
        @submit="${e => e.preventDefault()}"
        @keypress="${e => {
          if (e.keyCode === 13) this._checkFromPalletValidity()
        }}"
      >
        <fieldset>
          <label>${i18next.t('label.required_amount')}</label>
          <input readonly name="required-amount" value="${this.calcRequiredAmount}" />

          <label>${i18next.t('label.from_pallet')}</label>
          <barcode-scanable-input name="pallet-id" custom-input></barcode-scanable-input>
        </fieldset>
      </form>

      <data-grist .mode=${isMobileDevice() ? 'LIST' : 'GRID'} .config="${this.config}" .data="${this.palletData}">
      </data-grist>
    `
  }

  get palletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=pallet-id]').shadowRoot.querySelector('input')
  }

  get calcRequiredAmount() {
    if (this.packingUnit === PACKING_UNIT_QTY.value) {
      const repackedQty = this.palletData.records.reduce((repackedQty, record) => (repackedQty += record.qty), 0)
      return `${repackedQty} / ${this.requiredAmount}`
    } else if (this.packingUnit === PACKING_UNIT_WEIGHT.value) {
      const repackedWeight = this.palletData.records.reduce(
        (repackedWeight, record) => (repackedWeight += record.weight),
        0
      )
      return `${repackedWeight} / ${this.requiredAmount}`
    }
  }

  async _checkFromPalletValidity() {
    try {
      const palletId = this.palletIdInput.value
      if (!palletId) return

      if (this.checkPalletDuplication(palletId)) throw new Error(i18next.t('text.pallet_duplicated'))

      const response = await client.query({
        query: gql`
          query {
            checkRepackablePallet(${gqlBuilder.buildArgs({
              worksheetDetailName: this.worksheetDetailName,
              palletId
            })}) {
              qty
              weight
            }
          }
        `
      })

      if (!response.errors) {
        const { qty, weight } = response.data.checkRepackablePallet
        const scannedPallet = { palletId, qty, weight }
        this.palletData = { records: [...this.palletData.records, scannedPallet] }

        if (this.packingUnit === PACKING_UNIT_QTY.value) {
          const repackedQty = this.palletData.records.reduce((repackedQty, record) => (repackedQty += record.qty), 0)
          if (repackedQty >= this.requiredAmount) {
            this.completed()
          }
        } else if (this.packingUnit === PACKING_UNIT_WEIGHT.value) {
          const repackedWeight = this.palletData.records.reduce(
            (repackedWeight, record) => (repackedWeight += record.weight),
            0
          )
          if (repackedWeight >= this.requiredAmount) {
            this.completed()
          }
        }
      }
    } catch (e) {
      this.palletIdInput.value = ''
      this.palletIdInput.focus()
      this._showToast(e)
    }
  }

  completed() {
    const fromPalletIds = this.palletData.records.map(record => record.palletId)
    this.dispatchEvent(
      new CustomEvent('completed', {
        detail: { fromPalletIds }
      })
    )

    history.back()
  }

  checkPalletDuplication(palletId) {
    return Boolean(this.palletData.records.find(record => record.palletId === palletId))
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

customElements.define('repack-pallet-scan-popup', RepackPalletScanPopup)
