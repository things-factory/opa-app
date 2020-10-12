import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import '../components/popup-note'

export class OutboundReusablePallet extends localize(i18next)(LitElement) {
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
      palletData: Object,
      releaseGoodNo: String,
      returnPalletGristConfig: Object
    }
  }

  get palletRefNoInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=palletRefNo]').shadowRoot.querySelector('input')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.pallet_ref_no')}</label>
          <barcode-scanable-input
            name="palletRefNo"
            custom-input
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.palletRefNoInput.value) {
                  this._fetchPallet()
                  this.palletRefNoInput.value = ''
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>
      </form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.palletData}
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click=${this._outboundPallets.bind(this)}>${i18next.t('button.update')}</mwc-button>
      </div>
    `
  }

  firstUpdated() {
    this.config = {
      pagination: { infinite: true },
      rows: { appendable: false },
      list: { fields: ['name'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.palletData = {
                ...this.palletData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.ref_no'),
          record: {
            editable: false,
            align: 'left'
          },
          sortable: false,
          width: 300
        }
      ]
    }
    if (!this.palletData) {
      this.palletData = { records: [] }
    } else {
      this.palletData = { ...this.palletData }
    }
  }

  async _fetchPallet() {
    this.dataGrist.showSpinner()

    try {
      const response = await client.query({
        query: gql`
          query {
            palletOutboundValidate(${gqlBuilder.buildArgs({
              name: this.palletRefNoInput.value
            })}) {
              item{
                id
                name
                owner{
                  id
                  name
                }
                holder{
                  id
                  name
                }
              }  
              error 
            }
          }
        `
      })

      if (!response.errors) {
        if (response?.data?.palletOutboundValidate?.item) {
          if (!this.palletData.records.find(itm => itm.name === response.data.palletOutboundValidate.item.name))
            this.palletData = { records: [...this.palletData.records, response.data.palletOutboundValidate.item] }
        } else if (response?.data?.palletOutboundValidate?.error) {
          this._showToast({ message: response.data.palletOutboundValidate.error })
        }
      }
    } catch (error) {
      this._showToast({ message: error })
    }
    this.dataGrist.hideSpinner()
  }

  async _outboundPallets() {
    var x = this.releaseGoodNo
    var y = this.palletData.records.map(pallet => {
      delete pallet['__seq__']
      delete pallet['__origin__']
      return pallet
    })
    var v = gqlBuilder.buildArgs({
      refOrderNo: this.releaseGoodNo,
      patches: this.palletData.records
    })
    this.dispatchEvent(new CustomEvent('reusable-pallet-info', { detail: this.palletData }))
    const response = await client.query({
      query: gql`
        mutation {
          palletOutbound(${gqlBuilder.buildArgs({
            refOrderNo: this.releaseGoodNo,
            patches: this.palletData.records.map(pallet => {
              delete pallet['__seq__']
              delete pallet['__origin__']
              return pallet
            })
          })})
        }
      `
    })

    history.back()
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
window.customElements.define('outbound-reusable-pallet', OutboundReusablePallet)
