import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice } from '@things-factory/utils'
import { css, html, LitElement } from 'lit-element'

class ReturnPalletCheckPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
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
        .button-container > barcode-scanable-input {
          margin: auto;
        }
      `
    ]
  }

  async firstUpdated() {
    this.config = {
      rows: {
        appendable: false,
        selectable: { multiple: true }
      },
      pagination: { infinite: true },
      list: { fields: ['palletId', 'product', 'batchId', 'releaseQty', 'loadedQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'center' },
          width: 140
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 140
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 140
        },
        {
          type: 'string',
          name: 'releaseWeight',
          header: i18next.t('field.release_weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.weight_unit'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.picked_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'loadedQty',
          header: i18next.t('field.loaded_qty'),
          record: { align: 'center', editable: true },
          width: 100
        }
      ]
    }

    await this.updateComplete
    this.focusOnPalletInput()
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get palletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=palletId]').shadowRoot.querySelector('input')
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data="${this.data}"
        ></data-grist>
      </div>

      <form id="input-form" class="single-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.pallet_id')}</label>
          <barcode-scanable-input
            name="palletId"
            custom-input
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this._checkPalletId()
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>
      </form>
    `
  }

  focusOnPalletInput() {
    this.palletIdInput.value = ''
    this.palletIdInput.focus()
  }

  _checkPalletId() {
    try {
      if (!this.palletIdInput.value) throw new Error(i18next.t('text.pallet_id_is_empty'))
      const palletId = this.palletIdInput.value.toLowerCase()
      const targetPallet = this.data.records.find(record => record.palletId.toLowerCase() === palletId)
      if (!targetPallet) throw new Error(i18next.t('text.wrong_pallet_id'))

      this.data = {
        records: this.data.records.filter(record => record.palletId.toLowerCase() !== palletId)
      }

      if (!this.data.records.length) {
        window.history.back()
        this.dispatchEvent(new CustomEvent('complete'))
      } else {
        this.focusOnPalletInput()
      }
    } catch (e) {
      this._showToast(e)
    } finally {
      this.focusOnPalletInput()
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

window.customElements.define('return-pallet-check-popup', ReturnPalletCheckPopup)
