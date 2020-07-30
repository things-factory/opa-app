import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { getRenderer } from '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../../components/popup-note'
import '../../components/vas-templates'
import '../../components/attachment-viewer'
import {
  VAS_BATCH_AND_PRODUCT_TYPE,
  VAS_BATCH_NO_TYPE,
  VAS_ETC_TYPE,
  ORDER_STATUS,
  VAS_PRODUCT_TYPE
} from '../constants'

class ReceiveReleaseOrderRequest extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _releaseOrderNo: String,
      _ownTransport: Boolean,
      _crossDocking: Boolean,
      _exportOption: Boolean,
      inventoryGristConfig: Object,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
      _status: String,
      _attachments: Array,
      _template: Object,
      _mimetype: String,
      _doPath: String
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
        .do-preview {
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

  get context() {
    return {
      title: i18next.t('title.release_order_detail'),
      actions: this._actions
    }
  }

  render() {
    return html`
      <form name="releaseOrder" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.release_order_no')}: ${this._releaseOrderNo}</legend>
          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label>${i18next.t('label.release_date')}</label>
          <input name="releaseDate" type="date" readonly />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.co_no')}</label>
          <input name="collectionOrderNo" ?hidden="${!this._ownTransport}" readonly />

          <input id="exportOption" type="checkbox" name="exportOption" ?checked="${this._exportOption}" disabled />
          <label>${i18next.t('label.export')}</label>

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            ?hidden="${this._exportOption}"
            disabled
          />
          <label ?hidden="${this._exportOption}">${i18next.t('label.own_transport')}</label>

          ${this._crossDocking
            ? html`
                <input
                  id="crossDocking"
                  type="checkbox"
                  name="crossDocking"
                  ?checked="${this._crossDocking}"
                  disabled
                />
                <label for="crossDocking">${i18next.t('label.cross_docking')}</label>
              `
            : ''}
        </fieldset>
      </form>

      <div class="so-form-container" ?hidden="${!this._exportOption || (this._exportOption && !this._ownTransport)}">
        <form name="shippingOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.export_order')}</legend>
            <label>${i18next.t('label.container_no')}</label>
            <input name="containerNo" readonly />

            <label>${i18next.t('label.container_arrival_date')}</label>
            <input name="containerArrivalDate" type="date" readonly />

            <label>${i18next.t('label.container_leaving_date')}</label>
            <input name="containerLeavingDate" type="date" readonly />

            <label>${i18next.t('label.ship_name')}</label>
            <input name="shipName" readonly />
          </fieldset>
        </form>
      </div>

      <div class="do-attachment-container" ?hidden="${!this._ownTransport}">
        <form name="doAttachment" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.attachment')}</legend>
            <div class="do-preview">
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
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_product_list')}</h2>
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

        <div class="guide-container">
          ${this._template}
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.inventoryData = { records: [] }
    this.vasData = { records: [] }
    this._exportOption = false
    this._downloadable = true
    this._ownTransport = true
  }

  get releaseOrderForm() {
    return this.shadowRoot.querySelector('form[name=releaseOrder]')
  }

  get shippingOrderForm() {
    return this.shadowRoot.querySelector('form[name=shippingOrder]')
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

  get _isDownloadable() {
    return this._status !== ORDER_STATUS.PENDING.value
  }

  pageInitialized() {
    this.inventoryGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      list: { fields: ['name', 'batchId', 'product', 'location', 'releaseQty'] },
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
          name: 'qty',
          header: i18next.t('field.available_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { align: 'center', options: { min: 0 } },
          width: 100
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.available_weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'float',
          name: 'releaseWeight',
          header: i18next.t('field.release_weight'),
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

  async pageUpdated(changes) {
    if (this.active) {
      this._releaseOrderNo = changes.resourceId || this._releaseOrderNo || ''
      await this._fetchReleaseOrder()
      this._updateContext()
    }
  }

  async _fetchReleaseOrder() {
    if (!this._releaseOrderNo) return
    this._status = ''
    const response = await client.query({
      query: gql`
        query {
          releaseGoodDetail(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo
          })}) {
            id
            name
            truckNo
            status
            refNo
            ownTransport
            crossDocking
            arrivalNotice {
              name
            }
            exportOption
            releaseDate
            collectionOrderNo
            attachment {
              id
              name
              refBy
              path
              mimetype
            }
            inventoryInfos {
              name
              batchId
              productName
              packingType
              qty
              weight
              releaseQty
              releaseWeight
            }
            shippingOrderInfo {
              containerNo
              containerLeavingDate
              containerArrivalDate
              shipName
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
      const releaseOrder = response.data.releaseGoodDetail
      const shippingOrder = releaseOrder.shippingOrderInfo
      const orderInventories = releaseOrder.inventoryInfos.map(inventoryInfo => {
        return {
          ...inventoryInfo,
          roundedWeight: inventoryInfo.releaseQty * (inventoryInfo.weight / inventoryInfo.qty) || ''
        }
      })

      const orderVass = releaseOrder.orderVass

      this._exportOption = releaseOrder.exportOption
      if (this._exportOption) {
        this._ownTransport = true
      } else if (!this._exportOption) {
        this._ownTransport = releaseOrder.ownTransport
      }
      this._crossDocking = releaseOrder.crossDocking
      if (this._crossDocking) {
        this._ganNo = releaseOrder.arrivalNotice.name
      }

      this._status = releaseOrder.status

      if (this._ownTransport) {
        this._attachments = releaseOrder && releaseOrder.attachment
      }

      this._fillupRGForm(releaseOrder)
      if (this._exportOption) this._fillupSOForm(shippingOrder)

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

  _fillupRGForm(data) {
    this._fillupForm(this.releaseOrderForm, data)
  }

  _fillupSOForm(data) {
    this._fillupForm(this.shippingOrderForm, data)
  }

  _fillupForm(form, data) {
    for (let key in data) {
      Array.from(form.querySelectorAll('input, textarea, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  async _receiveReleaseOrder() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.accept_release_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            generateReleaseGoodWorksheet(${gqlBuilder.buildArgs({
              releaseGoodNo: this._releaseOrderNo
            })}) {
              pickingWorksheet {
                name
              }
            }
          }
        `
      })

      if (!response.errors) {
        history.back()

        this._showToast({ message: i18next.t('text.release_order_received') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _rejectReleaseOrder() {
    const popup = openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.remark')}"
          @submit="${async e => {
            try {
              if (!e.detail.value) throw new Error(i18next.t('text.remark_is_empty'))
              const result = await CustomAlert({
                title: i18next.t('title.are_you_sure'),
                text: i18next.t('text.reject_release_order'),
                confirmButton: { text: i18next.t('button.confirm') },
                cancelButton: { text: i18next.t('button.cancel') }
              })

              if (!result.value) {
                return
              }

              if (this._crossDocking) {
                const result = await CustomAlert({
                  title: i18next.t('title.cross_docking'),
                  text: i18next.t('text.related_order_will_be_rejected'),
                  confirmButton: { text: i18next.t('button.confirm') },
                  cancelButton: { text: i18next.t('button.cancel') }
                })

                if (!result.value) return
              }

              const response = await client.query({
                query: gql`
                mutation {
                  rejectReleaseGood(${gqlBuilder.buildArgs({
                    name: this._releaseOrderNo,
                    patch: { remark: e.detail.value }
                  })}) {
                    name
                  }
                }
              `
              })

              if (!response.errors) {
                navigate('release_order_requests')
                this._showToast({ message: i18next.t('text.release_order_rejected') })
              }
            } catch (e) {
              this._showToast(e)
            }
          }}"
        ></popup-note>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.reject_release_order')
      }
    )

    popup.onclosed
  }

  async _confirmCancellationReleaseOrder() {
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
              confirmCancellationReleaseOrder(${gqlBuilder.buildArgs({
                name: this._releaseOrderNo
              })})
            }
          `
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.release_order_has_been_cancelled') })
        navigate(`release_order_requests`)
      }
    } catch (e) {
      throw e
    }
  }

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.PENDING_RECEIVE.value && !this._crossDocking) {
      this._actions = [
        { title: i18next.t('button.reject'), action: this._rejectReleaseOrder.bind(this) },
        { title: i18next.t('button.receive'), action: this._receiveReleaseOrder.bind(this) }
      ]
    }

    if (this._status === ORDER_STATUS.PENDING_CANCEL.value && !this._crossDocking) {
      this._actions = [{ title: i18next.t('button.confirm'), action: this._confirmCancellationReleaseOrder.bind(this) }]
    }

    if (this._crossDocking) {
      const params = new URLSearchParams()
      params.append('name', this._ganNo)
      this._actions = [
        {
          title: i18next.t('button.move_to_x', { state: { x: i18next.t('title.arrival_notice') } }),
          action: () => navigate(`arrival_notice_requests?${params.toString()}`)
        }
      ]
    }

    this._actions = [
      ...this._actions,
      { title: i18next.t('button.back'), action: () => navigate('release_order_requests') }
    ]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
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

window.customElements.define('receive-release-order-request', ReceiveReleaseOrderRequest)
