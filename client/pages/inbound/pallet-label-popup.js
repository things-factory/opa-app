import { USBPrinter } from '@things-factory/barcode-base'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, store } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import { PALLET_LABEL_SETTING_KEY } from '../../setting-constants'

class PalletLabelPopup extends connect(store)(localize(i18next)(LitElement)) {
  static get properties() {
    return {
      config: Object,
      data: Object,
      pallets: Object,
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
          header: i18next.t('field.batch_no'),
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
        },
        {
          type: 'integer',
          name: 'startSeq',
          header: i18next.t('field.start_seq'),
          record: { align: 'center', editable: true, options: { min: 1 } },
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
          .data="${this.data}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._printLabel.bind(this)}">${i18next.t('button.print')}</mwc-button>
      </div>
    `
  }

  updated(changeProps) {
    if (changeProps.has('pallets')) {
      if (this.pallets && this.pallets.records && this.pallets.records.length) {
        this.data = {
          records: this.pallets.records.map(record => {
            return {
              ...record,
              startSeq: 1
            }
          })
        }
      }
    }
  }

  async _printLabel() {
    try {
      const _targetRows = this._validate()
      let labelId = this._palletLabel && this._palletLabel.id

      let dateStr = new Date()
        .toJSON()
        .slice(0, 10)
        .replace(/-/g, '/')

      for (let i = 0; i < _targetRows.length; i++) {
        let record = _targetRows[i]
        for (let j = 0; j < record.printQty; j++) {
          let batchId = record.batchId
          let response = await client.query({
            query: gql`
              query {
                generatePalletId(${gqlBuilder.buildArgs({
                  batchId
                })})
              }
            `
          })
          let palletId = response.data.generatePalletId
          let searchParams = new URLSearchParams()

          // /* for pallet record mapping */
          searchParams.append('pallet', palletId)
          searchParams.append('batch', record.batchId)
          searchParams.append('product', record.product.name)
          searchParams.append('type', record.product.type)
          searchParams.append('packing', record.packingType)
          searchParams.append('customer', record.bizplace)
          searchParams.append('date', dateStr)

          try {
            const response = await fetch(`/label-command/${labelId}?${searchParams.toString()}`, {
              method: 'GET'
            })

            if (response.status !== 200) {
              throw `Error : Can't get label command from server (response: ${response.status})`
            }

            let command = await response.text()

            if (!this.printer) {
              this.printer = new USBPrinter()
            }

            await this.printer.connectAndPrint(command)
          } catch (ex) {
            delete this.printer
            throw ex
          }
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validate() {
    let _targetRows = this.dataGrist.selected.length > 0 ? this.dataGrist.selected : this.dataGrist.dirtyData.records
    if (!_targetRows.every(row => row.printQty && row.startSeq)) throw new Error(i18next.t('text.print_qty_is_empty'))
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
