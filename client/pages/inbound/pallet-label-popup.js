import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, store } from '@things-factory/shell'
import { connect } from 'pwa-helpers/connect-mixin'
import { css, html, LitElement } from 'lit-element'
import { USBPrinter } from '@things-factory/barcode-base'
import uuid from 'uuid/v4'
import { PALLET_LABEL_SETTING_KEY } from '../../setting-constants'

class PalletLabelPopup extends connect(store)(localize(i18next)(LitElement)) {
  static get properties() {
    return {
      config: String,
      pallets: String,
      _palletLabel: Object
    }
  }

  static get styles() {
    return [
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
          display: flex;
        }
        .button-container > mwc-button {
          margin-left: auto;
        }
      `
    ]
  }

  firstUpdated() {
    this.config = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      list: { fields: ['batchId', 'palletQty', 'printQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          width: 250
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'integer',
          name: 'printQty',
          header: i18next.t('field.print_qty'),
          record: { editable: true, align: 'center' },
          width: 60
        }
      ]
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data="${this.pallets}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._printLabel.bind(this)}">${i18next.t('button.print')}</mwc-button>
      </div>
    `
  }

  async _printLabel() {
    try {
      this.printer = new USBPrinter()
      const _targetRows = this._validate()
      let labelId = this._palletLabel && this._palletLabel.id

      _targetRows.forEach(async record => {
        for (let i = 1; i <= record.printQty; i++) {
          let searchParams = new URLSearchParams()
          let batchId = record.batchId.replace(/[^a-zA-Z ]/g, '')
          searchParams.append(
            'pallet',
            `${batchId.substring(batchId.length - 8)}${new Date()
              .toISOString()
              .split('T')[0]
              .split('-')
              .join('')}${i.toString().padStart(3, 0)}`
          )
          searchParams.append('batch', record.batchId)
          searchParams.append('product', record.product.name)

          const response = await fetch(`/label-command/${labelId}?${searchParams.toString()}`, {
            method: 'GET'
          })

          let command = await response.text()

          try {
            await this.printer.connectAndPrint(command)
          } catch (ex) {
            document.dispatchEvent(
              new CustomEvent('notify', {
                detail: {
                  level: 'error',
                  message: ex,
                  ex
                }
              })
            )
            break
          }
        }
      })
    } catch (e) {
      this._showToast(e)
    }
  }

  _validate() {
    let _targetRows = this.dataGrist.selected.length > 0 ? this.dataGrist.selected : this.dataGrist.dirtyData.records
    if (!_targetRows.every(row => row.printQty)) throw new Error(i18next.t('print_qty_is_empty'))
    return _targetRows
  }

  stateChanged(state) {
    let palletLabelSetting = state.dashboard[PALLET_LABEL_SETTING_KEY]
    this._palletLabel = (palletLabelSetting && palletLabelSetting.board) || {}
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

window.customElements.define('pallet-label-popup', PalletLabelPopup)
