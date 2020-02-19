import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, store } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/popup-note'

class InboundReusablePallet extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      palletData: Object,
      returnPalletGristConfig: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
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
          flex-direction: column;
          padding-block-end: 10px;
          min-height: 200px;
        }

        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
          margin: 0;
        }

        .grist h2 {
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }

        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }

        data-grist {
          flex: 1;
          justify-content: center;
          flex-direction: column;
        }

        h2 + data-grist {
          padding-top: var(--grist-title-with-grid-padding);
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.inbound_reusable_pallet'),
      actions: [{ title: i18next.t('button.submit'), action: this._updateReturnPallet.bind(this) }]
    }
  }

  get inputForm() {
    return this.shadowRoot.querySelector('input-form')
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
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.pallets')}</h2>
        <data-grist
          id="pallet-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.returnPalletGristConfig}
          .data=${this.palletData}
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
  }

  updated(changedProps) {}

  _updateContext() {}

  pageInitialized() {
    this.palletData = { records: [] }
    this.returnPalletGristConfig = {
      pagination: { infinite: true },
      rows: { appendable: false },
      list: { fields: ['name', 'holder'] },
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
          width: 100
        },
        {
          type: 'object',
          name: 'holder',
          header: i18next.t('field.holder'),
          record: {
            editable: false,
            align: 'left',
            options: {
              queryName: 'bizplaces'
            }
          },
          sortable: false,
          width: 250
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
    }
  }

  async _fetchPallet() {
    this.dataGrist.showSpinner()
    try {
      const response = await client.query({
        query: gql`
          query {
            palletInboundValidate(${gqlBuilder.buildArgs({
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
        if (response?.data?.palletInboundValidate?.item) {
          if (!this.palletData.records.find(itm => itm.name === response.data.palletInboundValidate.item.name))
            this.palletData = { records: [...this.palletData.records, response.data.palletInboundValidate.item] }
        } else if (response?.data?.palletInboundValidate?.error) {
          this._showToast({ message: response.data.palletInboundValidate.error })
        }
      }
    } catch (error) {
      this._showToast({ message: error })
    }
    this.dataGrist.hideSpinner()
  }

  async _updateReturnPallet() {
    let patches = this.dataGrist.__data.records
    if (patches && patches.length) {
      this.dataGrist.showSpinner()
      const response = await client.query({
        query: gql`
          mutation {
            palletReturn(${gqlBuilder.buildArgs({
              patches
            })}) {
              id
              name
              holder{
                name
              }
            }
          }
        `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this._showToast({ message: i18next.t('text.data_updated_successfully') })
      }

      this.palletData = { records: [] }
      this.dataGrist.hideSpinner()
    }
  }

  _removeSelected() {
    debugger
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

window.customElements.define('inbound-reusable-pallet', InboundReusablePallet)
