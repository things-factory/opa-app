import { CustomAlert } from '../../../utils/custom-alert'
import '@things-factory/grist-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { openPopup } from '@things-factory/layout-base'
import '../release-order/inventory-product-selector'
import { ORDER_STATUS } from '../constants/order'

class CreateVasOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _vasNo: String,
      vasGristConfig: Object,
      vasData: Object,
      _status: String
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
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
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .grist h2 {
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }

        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }

        h2 + data-grist {
          padding-top: var(--grist-title-with-grid-padding);
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.create_vas_order'),
      actions: [
        {
          title: i18next.t('button.create'),
          action: this._generateVasOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas_order')}</h2>

        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this.vasData = { records: [] }
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  updated(changedProps) {
    if (changedProps.has('_vasNo') && this._vasNo) {
      this.fetchVas()
    } else if (changedProps.has('_vasNo') && !this._vasNo) {
      this._clearPage()
    }
  }

  pageInitialized() {
    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.vasData = {
                ...this.vasData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
            }
          }
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.inventory_list'),
          record: { editable: true, align: 'center' },
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._openInventoryProduct()
            }
          },
          width: 250
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { editable: true, align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
        }
      ]
    }
  }

  _openInventoryProduct() {
    openPopup(
      html`
        <inventory-product-selector
          @selected="${e => {
            this.vasData = {
              ...this.vasData,
              records: e.detail
            }
          }}"
        ></inventory-product-selector>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.inventory_product_selection')
      }
    )
  }

  _clearPage() {
    this.vasGrist.data = Object.assign({ records: [] })
  }

  _validateVas() {
    this.vasGrist.commit()
    if (this.vasGrist.data.records && this.vasGrist.data.records.length) {
      // required field (vas && remark)
      if (this.vasGrist.data.records.filter(record => !record.vas || !record.remark).length)
        throw new Error(i18next.t('text.empty_value_in_list'))

      // duplication of vas for same batch
      const vasBatches = this.vasGrist.data.records.map(vas => `${vas.vas.id}-${vas.batchId}`)
      if (vasBatches.filter((vasBatch, idx, vasBatches) => vasBatches.indexOf(vasBatch) !== idx).length)
        throw new Error(i18next.t('text.duplicated_vas_on_same_batch'))
    }
  }

  async _generateVasOrder() {
    try {
      this._validateVas()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_vas_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      let args = {
        vasOrder: this._getVasOrder()
      }

      const response = await client.query({
        query: gql`
            mutation {
              generateVasOrder(${gqlBuilder.buildArgs(args)}) {
                id
                name
              }
            }
          `
      })

      if (!response.errors) {
        navigate(`vas_order_detail/${response.data.generateVasOrder.name}`)
        this._showToast({ message: i18next.t('vas_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getVasOrder() {
    let vasOrder = {}

    vasOrder.orderVass = this.vasGrist.data.records.map((record, idx) => {
      delete record.__typename
      delete record.vas.__typename
      return {
        batchId: record.batchId,
        remark: record.remark,
        inventory: {
          id: record.id
        },
        vas: record.vas
      }
    })

    return vasOrder
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

window.customElements.define('create-vas-order', CreateVasOrder)
