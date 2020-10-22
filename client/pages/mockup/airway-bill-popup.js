import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { store } from '@things-factory/shell'
import { isMobileDevice } from '@things-factory/utils'
import { css, html, LitElement } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

class AirwayBillPopup extends connect(store)(localize(i18next)(LitElement)) {
  static get properties() {
    return {
      config: Object,
      data: Object,
      orderNo: Object
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
      list: { fields: ['orderNo', 'printQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'orderNo',
          header: i18next.t('field.order_no'),
          record: { align: 'center' },
          width: 150
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
    if (changeProps.has('orderNo')) {
      this.data = {
        records: [
          {
            orderNo: this.orderNo.records.orderNo
          }
        ]
      }
    }
  }

  async _printLabel() {
    this._showToast({ message: i18next.t('text.airway_bill_has_been_printed') })
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

window.customElements.define('airway-bill-popup', AirwayBillPopup)
