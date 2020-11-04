import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { getRenderer } from '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { connect } from 'pwa-helpers/connect-mixin'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../components/popup-note'
import '../../components/attachment-viewer'
import '../../components/vas-templates'
import {
  ORDER_STATUS,
  VAS_BATCH_AND_PRODUCT_TYPE,
  VAS_BATCH_NO_TYPE,
  VAS_ETC_TYPE,
  VAS_PRODUCT_TYPE
} from '../../constants'

class RejectedReturnOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _userType: String,
      _returnOrderNo: String,
      _template: Object,
      _ownTransport: Boolean,
      _crossDocking: Boolean,
      _ganNo: String,
      _exportOption: Boolean,
      customerBizplaceId: String,
      partnerBizplaceId: String,
      inventoryGristConfig: Object,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
      _attachments: Array,
      _status: String,
      _mimetype: String,
      _doPath: String,
      _rejectReason: String
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
        .container {
          flex: 1;
          display: flex;
          overflow-y: auto;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .guide-container {
          max-width: 30vw;
          display: flex;
          flex-direction: column;
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

        .ro-preview {
          display: flex;
          flex-direction: row;
          flex: 1;
        }
        attachment-viewer {
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <popup-note
        .title="${i18next.t('title.rejection_reason')}"
        .value="${this._rejectReason}"
        .readonly="${true}"
      ></popup-note>

      <form name="returnOrder" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.return_order_no')}: ${this._returnOrderNo}</legend>

          <input id="ownTransport" type="checkbox" name="ownTransport" ?checked="${this._ownTransport}" disabled />
          <label>${i18next.t('label.own_transport')}</label>

          <input
            id="warehouseTransport"
            type="checkbox"
            name="warehouseTransport"
            ?checked="${!this._ownTransport}"
            disabled
          />
          <label>${i18next.t('label.warehouse_transport')}</label>
        </fieldset>

        <fieldset>
          <legend></legend>
          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label>${i18next.t('label.eta_date')}</label>
          <input name="etaDate" type="date" readonly />
        </fieldset>
      </form>

      <div class="ro-attachment-container" ?hidden="${this._attachments.length > 0 ? false : true}">
        <form name="roAttachment" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.attachment')}</legend>
            <div class="ro-preview">
              ${(this._attachments || []).map(
                attachment =>
                  html`
                    <attachment-viewer
                      name="${attachment.name}"
                      src="${location.origin}/attachment/${attachment.path}"
                      .mimetype="${attachment.mimetype}"
                      .downloadable="${this._downloadable}"
                    ></attachment-viewer>
                  `
              )}
            </div>
          </fieldset>
        </form>
      </div>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.return_product_list')}</h2>
          <data-grist
            id="inventory-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.inventoryGristConfig}
            .data=${this.inventoryData}
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>
          <data-grist
            id="vas-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.vasGristConfig}
            .data="${this.vasData}"
          ></data-grist>
        </div>

        <div class="guide-container">${this._template}</div>
      </div>
    `
  }

  constructor() {
    super()
    this._exportOption = false
    this._ownTransport = true
    this._downloadable = true
    this._attachments = []
    this.inventoryData = { records: [] }
    this.vasData = { records: [] }
  }

  get context() {
    return {
      title: i18next.t('title.rejected_return_order'),
      actions: [{ title: i18next.t('button.back'), action: () => history.back() }]
    }
  }

  get returnOrderForm() {
    return this.shadowRoot.querySelector('form[name=returnOrder]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._returnOrderNo = changes.resourceId
      this._fetchReturnOrder()
    }
  }

  async pageInitialized() {
    this.inventoryGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      list: { fields: ['productName', 'batchId', 'packingType', 'returnQty', 'returnWeight'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'productName',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 150
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'integer',
          name: 'returnQty',
          header: i18next.t('field.return_qty'),
          record: { align: 'center', options: { min: 0 } },
          width: 100
        },
        {
          type: 'float',
          name: 'returnWeight',
          header: i18next.t('field.return_weight'),
          record: { align: 'center', options: { min: 0 } },
          width: 100
        }
      ]
    }

    this.vasGristConfig = {
      list: { fields: ['targetType', 'targetDisplay', 'packingType'] },
      pagination: { infinite: true },
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.vas && record.vas.operationGuideType === 'template') {
              this._template = document.createElement(record.vas.operationGuide)
              this._template.record = { ...record, operationGuide: JSON.parse(record.operationGuide) }
            } else {
              this._template = null
            }
          }
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'set',
          header: i18next.t('field.set'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'targetType',
          header: i18next.t('field.target_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'target',
          header: i18next.t('field.target'),
          record: {
            renderer: (value, column, record, rowIndex, field) => {
              if (record.targetType === VAS_BATCH_NO_TYPE) {
                return getRenderer()(record.targetBatchId, column, record, rowIndex, field)
              } else if (record.targetType === VAS_PRODUCT_TYPE) {
                return getRenderer('object')(record.targetProduct, column, record, rowIndex, field)
              } else if (record.targetType === VAS_BATCH_AND_PRODUCT_TYPE) {
                return getRenderer()(
                  `${record.targetBatchId} / ${record.targetProduct.name}`,
                  column,
                  record,
                  rowIndex,
                  field
                )
              } else if (record.targetType === VAS_ETC_TYPE) {
                return getRenderer()(record.otherTarget, column, record, rowIndex, field)
              }
            },
            align: 'center'
          },

          width: 250
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'center' },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.comment'),
          width: 350
        }
      ]
    }
  }

  async _fetchReturnOrder() {
    if (!this._returnOrderNo) return
    const response = await client.query({
      query: gql`
        query {
          returnOrderDetail(${gqlBuilder.buildArgs({
            name: this._returnOrderNo
          })}) {
            id
            name
            truckNo
            status
            refNo
            ownTransport
            remark
            eta
            etaDate
            attachment {
              id
              name
              refBy
              path
              mimetype
            }
            bizplace {
              id
              name
              description
            }
            inventoryInfos {
              id
              name
              batchId
              palletId
              product {
                id
                name
                description
              }
              productName
              packingType
              qty
              weight
              returnQty
              returnWeight
              location {
                id
                name
              }
              status
            }
            orderVass {
              vas {
                name
                operationGuide
                operationGuideType
              }
              set
              targetType
              targetBatchId
              targetProduct {
                id
                name
                description
              }
              packingType
              qty
              weight
              otherTarget
              description
              remark
              status
              operationGuide
            }
          }
        }
      `
    })

    if (!response.errors) {
      const returnOrder = response.data.returnOrderDetail
      const orderInventories = returnOrder.inventoryInfos.map(inventoryInfo => {
        return {
          ...inventoryInfo,
          inventory: {
            id: inventoryInfo.id,
            name: inventoryInfo.name,
            palletId: inventoryInfo.palletId,
            product: inventoryInfo.product,
            batchId: inventoryInfo.batchId,
            location: inventoryInfo.location,
            packingType: inventoryInfo.packingType,
            remainQty: inventoryInfo.qty,
            remainWeight: inventoryInfo.weight
          },
          remainQty: inventoryInfo.qty,
          remainWeight: inventoryInfo.weight,
          status: inventoryInfo.status,
          existing: true,
          roundedWeight: inventoryInfo.returnQty * (inventoryInfo.weight / inventoryInfo.qty) || ''
        }
      })

      const orderVass = returnOrder.orderVass

      this.partnerBizplaceId = returnOrder.bizplace.id
      this._ownTransport = response.data.returnOrderDetail.ownTransport

      this._status = returnOrder.status
      this._rejectReason = returnOrder.remark

      this._fillupROForm(response.data.returnOrderDetail)

      if (returnOrder && returnOrder?.attachment) {
        this._attachments = returnOrder && returnOrder.attachment
      }

      this.inventoryData = { records: orderInventories }
      this.vasData = {
        records: orderVass
          .sort((a, b) => a.set - b.set)
          .map(orderVas => {
            return {
              ...orderVas,
              set: `Set ${orderVas.set}`
            }
          })
      }
    }
  }

  get _isDownloadable() {
    return this._status !== ORDER_STATUS.PENDING.value
  }

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.PENDING.value) {
      this._actions = [
        {
          title: i18next.t('button.delete'),
          action: this._deleteReturnOrder.bind(this)
        },
        {
          title: i18next.t('button.confirm'),
          action: this._confirmReturnOrder.bind(this)
        }
      ]
    }

    if (
      this._status !== ORDER_STATUS.PENDING.value &&
      this.partnerBizplaceId === this.customerBizplaceId &&
      this._status !== ORDER_STATUS.PENDING_RECEIVE.value &&
      this._status !== ORDER_STATUS.PENDING_CANCEL.value &&
      this._status !== ORDER_STATUS.CANCELLED.value &&
      this._status !== ORDER_STATUS.DONE.value
    ) {
      this._actions = [
        {
          title: i18next.t('button.cancel_order'),
          action: this._submitCancellationReturnOrder.bind(this)
        }
      ]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _fillupROForm(data) {
    this._fillupForm(this.returnOrderForm, data)
  }

  _fillupForm(form, data) {
    form.reset()
    for (let key in data) {
      Array.from(form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          if (data[key] instanceof Object) {
            const objectData = data[key]
            field.value = `${objectData.name} ${objectData.description ? `(${objectData.description})` : ''}`
          } else {
            field.value = data[key]
          }
        }
      })
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

window.customElements.define('rejected-return-order', RejectedReturnOrder)
