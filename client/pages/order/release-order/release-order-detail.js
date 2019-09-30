import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import Swal from 'sweetalert2'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS } from '../constants/order'

class ReleaseOrderDetail extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _releaseOrderNo: String,
      _ownTransport: Boolean,
      _shippingOption: Boolean,
      inventoryGristConfig: Object,
      currentOrderType: String,
      vasGristConfig: Object,
      inventoryData: Object,
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
      title: i18next.t('title.release_order_detail')
    }
  }

  constructor() {
    super()
    this.inventoryData = {}
    this.vasData = {}
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.fetchReleaseOrder()
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.release_order')}</legend>
          <label>${i18next.t('label.release_date')}</label>
          <input name="releaseDateTime" type="datetime-local" disabled />

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
          <input shipping name="containerNo" ?hidden="${!this._shippingOption}" disabled />

          <label>${i18next.t('label.load_type')}</label>
          <select name="loadType" disabled>
            ${LOAD_TYPES.map(
              loadType => html`
                <option value="${loadType.value}">${i18next.t(`label.${loadType.name}`)}</option>
              `
            )}
          </select>

          <label ?hidden="${!this._shippingOption}">${i18next.t('label.container_arrival_date')}</label>
          <input
            shipping
            name="containerArrivalDate"
            type="datetime-local"
            ?hidden="${!this._shippingOption}"
            disabled
          />

          <label ?hidden="${!this._shippingOption}">${i18next.t('label.container_leaving_date')}</label>
          <input
            shipping
            name="containerLeavingDate"
            type="datetime-local"
            ?hidden="${!this._shippingOption}"
            disabled
          />

          <label ?hidden="${!this._shippingOption}">${i18next.t('label.ship_name')}</label>
          <input shipping name="shipName" ?hidden="${!this._shippingOption}" disabled />

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
          <label ?hidden="${this._ownTransport}">${i18next.t('label.delivery_date')}</label>
          <input delivery name="deliveryDateTime" type="datetime-local" ?hidden="${this._ownTransport}" disabled />

          <label>${i18next.t('label.release_from')}</label>
          <input name="from" disabled />

          <label>${i18next.t('label.release_to')}</label>
          <input name="to" disabled />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.tel_no')}</label>
          <input delivery name="telNo" ?hidden="${this._ownTransport}" disabled />
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_inventory')}</h2>

        <data-grist
          id="inventory-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.inventoryGristConfig}
          .data="${this.inventoryData}"
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

  pageInitialized() {
    this.inventoryGristConfig = {
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
              this.inventoryData = {
                ...this.inventoryData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }

              this._updateBatchList()
            }
          }
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
          name: 'product',
          header: i18next.t('field.release_inventory_list'),
          record: { align: 'center' },
          width: 250
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
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 100
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
    const response = await client.query({
      query: gql`
        query {
          releaseGoodDetail(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo
          })}) {
            id
            name
            from
            to
            loadType
            truckNo
            status
            ownTransport
            shippingOption
            releaseDateTime
            inventoryInfos {
              name
              batchId
              product {
                name
                description
              }
              location {
                name
              }
              packingType
              qty
              releaseQty
            }
            releaseGoodInfo {
              containerNo
              containerLeavingDate
              containerArrivalDate
              shipName
              deliveryDateTime
              telNo
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
      this._shippingOption = response.data.releaseGoodDetail.shippingOption
      this._ownTransport = response.data.releaseGoodDetail.ownTransport
      this._status = response.data.releaseGoodDetail.status
      this._actionsHandler()
      this._fillupForm(response.data.releaseGoodDetail)
      this._fillupForm(response.data.releaseGoodDetail.releaseGoodInfo)
      this.inventoryData = {
        records: response.data.releaseGoodDetail.inventoryInfos
      }

      this.vasData = {
        ...this.vasData,
        records: response.data.releaseGoodDetail.orderVass
      }
    }
  }

  _fillupForm(data) {
    for (let key in data) {
      Array.from(this.form.querySelectorAll('input, textarea, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  async _updateReleaseOrder(patch) {
    const response = await client.query({
      query: gql`
        mutation {
          updateReleaseGood(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo,
            patch
          })}) {
            name 
          }
        }
      `
    })

    if (!response.errors) {
      this.fetchReleaseOrder()
    } else {
      throw new Error(response.errors[0])
    }
  }

  async _confirmReleaseOrder() {
    const response = await client.query({
      query: gql`
        mutation {
          confirmReleaseGood(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo
          })}) {
            name
          }
        }
      `
    })

    if (response.errors) {
      throw new Error(response.errors[0])
    }
  }

  _getStdDatetime() {
    let date = new Date()
    date.setDate(date.getDate() + 1)
    return `${date.toISOString().substr(0, 11)}00:00:00`
  }

  _actionsHandler() {
    let actions = []

    if (this._status === ORDER_STATUS.PENDING.value) {
      actions = [
        {
          title: i18next.t('button.edit'),
          action: async () => {
            try {
              await this._updateReleaseOrder({ status: ORDER_STATUS.EDITING.value })
              this._showToast({ message: i18next.t('text.order_is_now_editable') })
            } catch (e) {
              this._showToast(e)
            }
          }
        },
        {
          title: i18next.t('button.confirm'),

          action: async () => {
            try {
              await this._confirmReleaseOrder()
              Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, confirm it!'
              }).then(result => {
                if (result.value) {
                  this._showToast({ message: i18next.t('text.order_is_confirmed') })
                  navigate('release_orders')
                }
              })
            } catch (e) {
              this._showToast(e)
            }
          }
        }
      ]
    } else if (this._status === ORDER_STATUS.EDITING.value) {
      navigate(`create_release_order/${this._releaseOrderNo}`)
    }

    actions = [...actions, { title: i18next.t('button.back'), action: () => navigate('release_orders') }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        ...this.context,
        actions
      }
    })
  }

  stateChanged(state) {
    if (this.active) {
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

window.customElements.define('release-order-detail', ReleaseOrderDetail)
