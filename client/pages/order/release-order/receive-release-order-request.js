import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { CustomAlert } from '../../../utils/custom-alert'
import '../../components/popup-note'
import '../../components/vas-relabel'

class ReceiveReleaseOrderRequest extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _releaseOrderNo: String,
      _ownTransport: Boolean,
      _exportOption: Boolean,
      inventoryGristConfig: Object,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
      _status: String,
      _template: Object
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
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.release_order_detail'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        },
        {
          title: i18next.t('button.reject'),
          action: this._rejectReleaseOrder.bind(this)
        },
        {
          title: i18next.t('button.receive'),
          action: this._receiveReleaseOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form name="releaseOrder" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.release_order_no')}: ${this._releaseOrderNo}</legend>
          <label>${i18next.t('label.release_date')}</label>
          <input name="releaseDate" type="date" readonly />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.co_no')}</label>
          <input name="collectionOrderNo" ?hidden="${!this._ownTransport}" readonly />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
          <input name="truckNo" ?hidden="${!this._ownTransport}" readonly />

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
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 350
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'center',
            codeName: 'PACKING_TYPES'
          },
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
        }
      ]
    }

    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true },
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
      list: { fields: ['vas', 'inventory', 'product', 'remark'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'object',
          name: 'inventory',
          header: i18next.t('field.inventory'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'center' },
          width: 350
        }
      ]
    }
  }

  pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._releaseOrderNo = changes.resourceId
      this._fetchReleaseOrder()
    }
  }

  async _fetchReleaseOrder() {
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
            ownTransport
            exportOption
            releaseDate
            collectionOrderNo
            inventoryInfos {
              name
              batchId
              packingType
              qty
              releaseQty
              product {
                name
                description
              }
              location {
                name
              }              
            }
            shippingOrder {
              containerNo
              containerLeavingDate
              containerArrivalDate
              shipName
            }
            orderVass {
              vas {
                name
                description
                operationGuide
                operationGuideType
              }
              inventory {
                name
                description
              }
              description
              batchId
              remark
              operationGuide
              status
            }
          }
        }
      `
    })

    if (!response.errors) {
      const releaseOrder = response.data.releaseGoodDetail
      const shippingOrder = releaseOrder.shippingOrder
      const orderInventories = releaseOrder.inventoryInfos
      const orderVass = releaseOrder.orderVass

      this._exportOption = response.data.releaseGoodDetail.exportOption
      if (this._exportOption) {
        this._ownTransport = true
      } else if (!this._exportOption) {
        this._ownTransport = response.data.releaseGoodDetail.ownTransport
      }

      this._status = releaseOrder.status
      this._fillupRGForm(releaseOrder)
      if (this._exportOption) this._fillupSOForm(shippingOrder)

      this.inventoryData = { records: orderInventories }
      this.vasData = { records: orderVass }
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
