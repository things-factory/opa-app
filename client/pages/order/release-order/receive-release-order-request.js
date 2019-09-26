import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS } from '../constants/order'

class ReceiveReleaseOrderRequest extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _ownTransport: Boolean,
      _shippingOption: Boolean,
      productGristConfig: Object,
      currentOrderType: String,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object,
      _orderStatus: String,
      _releaseOrderNo: String
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
      title: i18next.t('title.receive_release_order'),
      actions: [
        {
          title: i18next.t('button.receive'),
          action: this._receiveReleaseOrder.bind(this)
        },
        {
          title: i18next.t('button.reject'),
          action: this._rejectReleaseOrder.bind(this)
        }
      ]
    }
  }

  activated(active) {
    if (JSON.parse(active)) {
      this.fetchReleaseOrder()
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>
            ${i18next.t('title.release_no')}: ${this._releaseOrderNo}
          </legend>

          <label>${i18next.t('label.release_date')}</label>
          <input name="releaseDate" type="datetime-local" min="${this._getStdDatetime()}" disabled />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.co_no')}</label>
          <input name="collectionOrderNo" ?hidden="${!this._ownTransport}" disabled />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
          <input name="truckNo" ?hidden="${!this._ownTransport}" disabled />

          <input
            name="shippingOption"
            type="checkbox"
            ?checked="${this._shippingOption}"
            @change=${e => {
              this._shippingOption = e.currentTarget.checked
            }}
            disabled
          />
          <label>${i18next.t('label.shipping_option')}</label>

          <label ?hidden="${!this._shippingOption}">${i18next.t('label.container_no')}</label>
          <input name="container_no" ?hidden="${!this._shippingOption}" disabled />

          <label ?hidden="${!this._shippingOption}">${i18next.t('label.container_load_type')}</label>
          <select name="loadType" ?hidden="${!this._shippingOption}" disabled>
            ${LOAD_TYPES.map(
              loadType => html`
                <option value="${loadType.value}">${i18next.t(`label.${loadType.name}`)}</option>
              `
            )}
          </select>

          <label ?hidden="${!this._shippingOption}">${i18next.t('label.container_arrival_date')}</label>
          <input
            name="conArrivalDate"
            type="datetime-local"
            min="${this._getStdDatetime()}"
            ?hidden="${!this._shippingOption}"
            disabled
          />

          <label ?hidden="${!this._shippingOption}">${i18next.t('label.container_leaving_date')}</label>
          <input
            name="conLeavingDate"
            type="datetime-local"
            min="${this._getStdDatetime()}"
            ?hidden="${!this._shippingOption}"
            disabled
          />

          <label ?hidden="${!this._shippingOption}">${i18next.t('label.ship_name')}</label>
          <input name="shipName" ?hidden="${!this._shippingOption}" disabled />

          <input
            name="ownTransport"
            type="checkbox"
            ?checked="${this._ownTransport}"
            @change=${e => {
              this._ownTransport = e.currentTarget.checked
            }}
            disabled
          />
          <label>${i18next.t('label.own_transport')}</label>

          <label class="trs-input" ?hidden="${this._ownTransport}">${i18next.t('label.deliver_to')}</label>
          <input name="to" class="trs-input" ?hidden="${this._ownTransport}" disabled />

          <label class="trs-input" ?hidden="${this._ownTransport}">${i18next.t('label.tel_no')}</label>
          <input name="telNo" class="trs-input" ?hidden="${this._ownTransport}" disabled />

          <label>${i18next.t('label.status')}</label>
          <select name="status" disabled
            >${Object.keys(ORDER_STATUS).map(key => {
              const status = ORDER_STATUS[key]
              return html`
                <option value="${status.value}">${i18next.t(`label.${status.name}`)}</option>
              `
            })}</select
          >

          <label>${i18next.t('label.remark')}</label>
          <textarea name="remark"></textarea>
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

        <data-grist
          id="product-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productGristConfig}
          .data="${this.productData}"
        ></data-grist>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
        ></data-grist>
      </div>
    `
  }

  firstUpdated() {
    this.productGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: {
            align: 'center',
            options: { queryName: 'products' }
          },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            align: 'center',
            options: { queryName: 'products' }
          },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { align: 'center' },
          width: 180
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
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
          type: 'select',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { align: 'center', options: ['kg', 'g'] },
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

    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: {
            align: 'center',
            options: { queryName: 'vass' }
          },
          width: 250
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { align: 'center' },
          width: 180
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: {
            align: 'center',
            options: [i18next.t('label.all')]
          },
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

  updated(changedProps) {
    if (changedProps.has('_releaseOrderNo')) {
      this.fetchReleaseOrder()
    }
  }

  async fetchReleaseOrder() {
    if (!this._releaseOrderNo) return
    const response = await client.query({
      query: gql`
        query {
          releaseOrder(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo
          })}) {
            id
            name
            deliveryOrderNo
            from
            to
            releaseDateTime
            ownTransport
            shippingOption
            truckNo
            shipName
            containerNo
            shippingOrder{
              id
              name
            }
            truckNo
            status
            orderProducts {
              id
              batchId
              product {
                id
                name
                description
              }
              description
              packingType
              weight
              unit
              packQty
              totalWeight
              palletQty
            }
            orderVass {
              vas {
                id
                name
                description
              }
              description
              batchId
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._ownTransport = response.data.releaseOrder.ownTransport
      this._shippingOption = response.data.releaseOrder.shippingOption

      this._fillupForm(response.data.releaseOrder)
      this.productData = {
        ...this.productData,
        records: response.data.releaseOrder.orderProducts
      }

      this.vasData = {
        ...this.vasData,
        records: response.data.releaseOrder.orderVass
      }
    }
  }

  _fillupForm(releaseOrder) {
    for (let key in releaseOrder) {
      Array.from(this.form.querySelectorAll('input', 'select')).forEach(field => {
        if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(releaseOrder[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = releaseOrder[key]
        }
      })
    }
  }

  async _receiveReleaseOrder() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            receiveReleaseOrder(${gqlBuilder.buildArgs({
              name: this._releaseOrderNo
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) {
        history.back()
        this._showToast({ message: i18next.t('text.order_received') })
      }
    } catch (e) {
      this._showToast({ message: e.message })
    }
  }

  async _rejectReleaseOrder() {
    const patch = this._getRemark()
    if (!patch) {
      return this._showToast({ message: i18next.t('text.remark_is_empty') })
    } else {
      try {
        const response = await client.query({
          query: gql`
                mutation {
                  rejectReleaseOrder(${gqlBuilder.buildArgs({
                    name: this._releaseOrderNo,
                    patch
                  })}) {
                    name
                  }
                }
              `
        })

        if (!response.errors) {
          history.back()
          this._showToast({ message: i18next.t('text.release_order_rejected') })
        }
      } catch (e) {
        this._showToast({ message: e.message })
      }
    }
  }

  _getTextAreaByName(name) {
    return this.shadowRoot.querySelector(`textarea[name=${name}]`)
  }

  _getRemark() {
    return {
      remark: this._getTextAreaByName('remark').value
    }
  }

  stateChanged(state) {
    if (JSON.parse(this.active)) {
      this._releaseOrderNo = state && state.route && state.route.resourceId
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

window.customElements.define('receive-release-order-request', ReceiveReleaseOrderRequest)
