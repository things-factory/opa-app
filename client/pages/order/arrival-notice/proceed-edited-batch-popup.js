import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, ScrollbarStyles } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { ORDER_PRODUCT_STATUS } from '../constants/order'

export class ProceedEditedBatchPopup extends localize(i18next)(LitElement) {
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
        .grist-container {
          display: flex;
          flex: 1;
          margin: 10px;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
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

  static get properties() {
    return {
      config: Object,
      data: Object,
      ganNo: String
    }
  }

  render() {
    return html`
      <div class="grist-container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.approve')}</h2>
          <data-grist
            id="approve-grist"
            .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
            .config="${this.config}"
            .data="${this.approvedData}"
          ></data-grist>
        </div>

        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.reject')}</h2>
          <data-grist
            id="reject-grist"
            .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
            .config="${this.config}"
            .data="${this.rejectedData}"
          ></data-grist>
        </div>
      </div>

      <div class="button-container">
        <button @click="${this._approveProducts.bind(this)}">
          ${i18next.t('button.approve')}
        </button>

        <button @click="${this._rejectProducts.bind(this)}">
          ${i18next.t('button.reject')}
        </button>

        <button @click="${this._proceedEditedBatch.bind(this)}">
          ${i18next.t('button.confirm')}
        </button>

        <button
          @click="${() => {
            history.back()
          }}"
        >
          ${i18next.t('button.cancel')}
        </button>
      </div>
    `
  }

  constructor() {
    super()
    this.approvedData = { records: [] }
    this.rejectedData = { records: [] }
  }

  get approveGrist() {
    return this.shadowRoot.querySelector('data-grist#approve-grist')
  }

  get rejectGrist() {
    return this.shadowRoot.querySelector('data-grist#reject-grist')
  }

  updated(changedProps) {
    if (changedProps.has('data')) {
      this.approvedData = {
        ...this.data,
        records: this.data.records.filter(item => item.status === ORDER_PRODUCT_STATUS.PENDING_APPROVAL.value)
      }
    }
  }

  firstUpdated() {
    this.config = this.productGristConfig = {
      list: { fields: ['remark', 'batchId', 'product', 'packingType', 'totalWeight'] },
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.initial_batch_id'),
          record: { align: 'center' },
          width: 150
        },
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
          record: { align: 'center', options: { queryName: 'products' } },
          width: 350
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          width: 150
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'totalWeight',
          header: i18next.t('field.total_weight'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { align: 'center' },
          width: 80
        }
      ]
    }
  }

  async _approveProducts() {
    if (!this.rejectGrist.selected || !this.rejectGrist.selected.length) return
    const approvedData = [...this.approveGrist.data.records, ...this.rejectGrist.selected]
    const rejectedData = this.rejectGrist.dirtyData.records.filter(record => {
      if (!record['__selected__']) {
        delete record['__selected__']
        return record
      } else {
        delete record['__selected__']
      }
    })

    this.approveGrist.data = { records: [] }
    this.rejectGrist.data = { records: [] }

    await this.approveGrist.updateComplete
    await this.rejectGrist.updateComplete

    this.approveGrist.data = { records: approvedData }
    this.rejectGrist.data = { records: rejectedData }
  }

  async _rejectProducts() {
    if (!this.approveGrist.selected || !this.approveGrist.selected.length) return
    const rejectedData = [...this.rejectGrist.data.records, ...this.approveGrist.selected]
    const approvedData = this.approveGrist.dirtyData.records.filter(record => {
      if (!record['__selected__']) {
        delete record['__selected__']
        return record
      } else {
        delete record['__selected__']
      }
    })

    this.approveGrist.data = { records: [] }
    this.rejectGrist.data = { records: [] }

    await this.approveGrist.updateComplete
    await this.rejectGrist.updateComplete

    this.approveGrist.data = { records: approvedData }
    this.rejectGrist.data = { records: rejectedData }
  }

  async _proceedEditedBatch() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.you_wont_be_able_to_revert_this'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      const response = await client.query({
        query: gql`
          mutation {
            proceedEditedBatch(${gqlBuilder.buildArgs({
              ganNo: this.ganNo,
              approvedProducts: this.approveGrist.data.records.map(record => {
                return { id: record.id }
              }),
              rejectedProducts: this.rejectGrist.data.records.map(record => {
                return { id: record.id }
              })
            })})
          }
        `
      })

      if (!response.errors) {
        await CustomAlert({
          title: i18next.t('title.edited_batch_no'),
          text: i18next.t('text.edited_batch_no_have_been_processed'),
          confirmButton: { text: i18next.t('button.confirm') }
        })

        this.dispatchEvent(new CustomEvent('completed'))
        window.history.back()
      }
    } catch (e) {
      this._showToast(e)
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

window.customElements.define('proceed-edited-batch-popup', ProceedEditedBatchPopup)
