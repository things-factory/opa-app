import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { VAS_TYPE, VAS_ETC_TYPE } from '../constants'
import '../components/popup-note'

export class PalletizingPalletPopup extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      SingleColumnFormStyles,
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }
        .info-form {
          overflow: visible;
        }
        .grist {
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
          padding: 10px 0 12px 0;
          text-align: center;
        }
        .button-container > button {
          background-color: var(--button-background-color);
          border: var(--button-border);
          border-radius: var(--button-border-radius);
          margin: var(--button-margin);
          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container > button:hover,
        .button-container > button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  static get properties() {
    return {
      orderNo: String,
      _palletType: String,
      config: Object,
      data: Object
    }
  }

  constructor() {
    super()
    this.data = { records: [] }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click=${this._palletizingPallets.bind(this)}>${i18next.t('button.update')}</mwc-button>
      </div>
    `
  }

  firstUpdated() {
    this.config = {
      pagination: { infinite: true },
      rows: { appendable: true },
      list: { fields: ['name'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
            type: 'object',
            name: 'vas',
            header: i18next.t('field.vas'),
            record: {
                editable: true,
                align: 'center',
                options: {
                    queryName: 'vass',
                    basicArgs: {
                        filters: [{ name: 'type', operator: 'eq', value: VAS_TYPE.MATERIALS.value }],
                      },
                    select: [
                        { name: 'id', hidden: true },
                        { name: 'name', width: 160 },
                        { name: 'description', width: 200 },
                    ],
                    list: { fields: ['name', 'description'] }
                }
            },
            width: 250
        },
        { type: 'string', name: 'id', hidden: true },
        { type: 'string', name: 'name', hidden: true },
        {
            type: 'number',
            name: 'qty',
            header: i18next.t('field.qty'),
            record: { editable: true, align: 'center' },
            width: 100
        },
        {
            type: 'string',
            name: 'remark',
            header: i18next.t('field.remark'),
            record: { editable: true },
            width: 300
        }
      ]
    }
  }

  async _palletizingPallets() {
    const response = await client.query({
      query: gql`
        mutation {
          palletizingPallets(${gqlBuilder.buildArgs({
            refOrderNo: this.orderNo,
            patches: this._getOrderVass()
          })})
        }
      `
    })

    if (!response.errors) {
      this.dispatchEvent(new CustomEvent('order-vas-data', { detail: this.data }))
      this._showToast({ message: i18next.t('text.data_updated_successfully') })
    }
    history.back()
  }

  _getOrderVass(){
    if(!this.dataGrist.dirtyData || !this.dataGrist.dirtyData.records || !this.dataGrist.dirtyData.records.length) return

    const records = this.dataGrist.dirtyData.records

    return records.map((record, idx) => {
      let result = {
        id: record.id ? record.id : null,
        name: record.name ? record.name : null,
        set: idx + 1,
        vas: { id: record.vas.id },
        qty: Number(record.qty),
        remark: record.remark ? record.remark : '',
        targetType: VAS_ETC_TYPE
      }

      return result
    })
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
window.customElements.define('palletizing-pallet-popup', PalletizingPalletPopup)
