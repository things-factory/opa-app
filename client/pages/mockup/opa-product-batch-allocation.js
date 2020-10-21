import '@material/mwc-button/mwc-button'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { ScrollbarStyles } from '@things-factory/styles'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { CustomAlert } from '@things-factory/shell'

class OpaProductBatchAllocation extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
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
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .button-container {
          display: flex;
          margin-left: auto;
        }
        .button-container > mwc-button {
          padding: 10px;
        }
      `
    ]
  }

  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object
    }
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button
          @click=${async () => {
            const answer = await CustomAlert({
              title: i18next.t('label.allocate'),
              text: i18next.t('text.are_you_sure'),
              confirmButton: { text: i18next.t('button.update') },
              cancelButton: { text: i18next.t('button.cancel') }
            })
            history.back()
          }}
          >${i18next.t('button.update')}</mwc-button
        >
        <mwc-button @click=${e => history.back()}>${i18next.t('button.cancel')}</mwc-button>
      </div>
    `
  }

  firstUpdated() {
    this.config = {
      columns: [
        {
          type: 'string',
          name: 'retail',
          record: { align: 'center' },
          header: i18next.t('field.store_name'),
          width: 250
        },
        {
          type: 'string',
          name: 'allocation',
          record: { editable: true, align: 'center' },
          header: i18next.t('field.inbound_allocation_percentage'),
          width: 400
        }
      ]
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  fetchHandler({ page, limit, sorters = [] }) {
    return {
      total: 10,
      records: [
        { retail: 'HQ', allocation: 20, allocatedQuantity: 20 },
        { retail: 'Subang', allocation: 5, allocatedQuantity: 5 },
        { retail: 'PJ', allocation: 15, allocatedQuantity: 15 },
        { retail: 'Shah Alam', allocation: 13, allocatedQuantity: 13 },
        { retail: 'Klang', allocation: 15, allocatedQuantity: 15 },
        { retail: 'Setapak', allocation: 4, allocatedQuantity: 4 },
        { retail: 'Cheras', allocation: 10, allocatedQuantity: 10 },
        { retail: 'Kajang', allocation: 16, allocatedQuantity: 16 },
        { retail: 'Kepong', allocation: 7, allocatedQuantity: 7 },
        { retail: 'Puchong', allocation: 5, allocatedQuantity: 5 }
      ]
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

window.customElements.define('opa-product-batch-allocation', OpaProductBatchAllocation)
