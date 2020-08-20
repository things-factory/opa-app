import { USBPrinter } from '@things-factory/barcode-base'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, store } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import { PALLET_LABEL_SETTING_KEY } from '../constants'

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
        <button @click="${this._printLabel.bind(this)}">${i18next.t('button.print')}</button>
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
      let labelId = this._palletLabel && this._palletLabel.id

      let dateStr = new Date().toJSON().slice(0, 10).replace(/-/g, '/')

      let _targetRows = this._validate()

      const response = await client.query({
        query: gql`
          query {
            generatePalletId(${gqlBuilder.buildArgs({
              targets: _targetRows.map(target => {
                return {
                  id: target.id,
                  printQty: target.printQty
                }
              })
            })}) {
              product {
                name
                type
                description
              }
              bizplace {
                name
              }
              batchId
              packingType
              palletId
            }
          }
        `
      })

      if (!response.errors) {
        const results = response.data.generatePalletId

        for (let i = 0; i < results.length; i++) {
          let searchParams = new URLSearchParams()

          searchParams.append('pallet', results[i].palletId)
          searchParams.append('batch', results[i].batchId)
          searchParams.append('product', results[i].product?.name)
          searchParams.append('type', results[i].product?.type)
          searchParams.append('description', results[i].product?.description)
          searchParams.append('packing', results[i].packingType)
          searchParams.append('customer', results[i].bizplace?.name)
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
    if (!_targetRows.every(row => row.printQty)) throw new Error(i18next.t('text.print_qty_is_empty'))
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
