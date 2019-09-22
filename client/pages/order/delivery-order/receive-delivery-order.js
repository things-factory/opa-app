import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS } from '../constants/order'

class ReceiveDeliveryOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _orderName: String,
      productGristConfig: Object,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object,
      drivers: Array,
      vehicles: Array
    }
  }

  constructor() {
    super()
    this.drivers = []
    this.vehicles = []
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
      title: i18next.t('title.receive_delivery_order'),
      actions: [
        {
          title: i18next.t('button.receive'),
          action: this._receiveDeliveryOrder.bind(this)
        },
        {
          title: i18next.t('button.reject'),
          action: this._rejectDeliveryOrder.bind(this)
        }
      ]
    }
  }

  activated(active) {
    if (JSON.parse(active)) {
      this.fetchDeliveryOrder()
      this.fetchTransportDriver()
      this.fetchTransportVehicle()
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get driver() {
    return this.shadowRoot.querySelector('select#driver')
  }

  get vehicle() {
    return this.shadowRoot.querySelector('select#vehicle')
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>
            ${i18next.t('title.doNo')}: ${this._orderName}
          </legend>

          <label>${i18next.t('label.from')}</label>
          <input name="from" disabled />

          <label>${i18next.t('label.to')}</label>
          <input name="to" disabled />

          <label hidden>${i18next.t('label.truck_no')}</label>
          <input name="truckNo" hidden />

          <label>${i18next.t('label.delivery_date')}</label>
          <input name="deliveryDateTime" type="datetime-local" disabled />

          <label>${i18next.t('label.load_type')}</label>
          <select name="loadType" disabled>
            ${LOAD_TYPES.map(
              loadType => html`
                <option value="${loadType.value}">${i18next.t(`label.${loadType.name}`)}</option>
              `
            )}
          </select>

          <label>${i18next.t('label.tel_no')}</label>
          <input name="telNo" disabled />

          <label>${i18next.t('label.assign_driver')}</label>
          <select name="driver" id="driver" required>
            <option>--CHOOSE DRIVER--</option>
            ${this.drivers.map(
              driver => html`
                <option driver-id="${driver.id}" value="${driver.name}">${driver.driverCode}-${driver.name}</option>
              `
            )}</select
          >

          <label>${i18next.t('label.assign_vehicle')}</label>
          <select name="vehicle" id="vehicle" required>
            <option>--CHOOSE TRUCK--</option>
            ${this.vehicles.map(
              vehicle => html`
                <option vehicle-id="${vehicle.id}" value="${vehicle.name}">${vehicle.regNumber}</option>
              `
            )}</select
          >

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
          width: 180
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
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
          record: { align: 'right' },
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
          record: { align: 'right' },
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
          width: 350
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('_orderName')) {
      this.fetchDeliveryOrder()
      this.fetchTransportDriver()
      this.fetchTransportVehicle()
    }
  }

  async fetchDeliveryOrder() {
    if (!this._orderName) return
    const response = await client.query({
      query: gql`
        query {
          deliveryOrder(${gqlBuilder.buildArgs({
            name: this._orderName
          })}) {
            id
            name
            deliveryDateTime
            from
            to
            loadType
            truckNo
            telNo
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
      this._fillupForm(response.data.deliveryOrder)
      this.productData = {
        ...this.productData,
        records: response.data.deliveryOrder.orderProducts
      }

      this.vasData = {
        ...this.vasData,
        records: response.data.deliveryOrder.orderVass
      }
    }
  }

  async fetchTransportDriver() {
    if (!this._orderName) return
    const response = await client.query({
      query: gql`
        query {
          transportDrivers(${gqlBuilder.buildArgs({
            filters: []
          })}) {
            items {
              id
              name
              bizplace{
                id
                name
              }
              driverCode
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      this.drivers = response.data.transportDrivers.items
    }
  }

  async fetchTransportVehicle() {
    if (!this._orderName) return
    const response = await client.query({
      query: gql`
        query {
          transportVehicles(${gqlBuilder.buildArgs({
            filters: []
          })}) {
            items {
              id
              name
              bizplace{
                id
                name
              }
              regNumber
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      this.vehicles = response.data.transportVehicles.items
    }
  }

  _fillupForm(deliveryOrder) {
    for (let key in deliveryOrder) {
      Array.from(this.form.querySelectorAll('input', 'select')).forEach(field => {
        if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(deliveryOrder[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = deliveryOrder[key]
        }
      })
    }
  }

  async _receiveDeliveryOrder() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            receiveDeliveryOrder(${gqlBuilder.buildArgs({
              name: this._orderName,
              patch: this._getDriverVehicle()
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) {
        history.back()
        this._showToast({ message: i18next.t('text.delivery_order_received') })
      }
    } catch (e) {
      this._showToast({ message: e.message })
    }
  }

  async _rejectDeliveryOrder() {
    try {
      const patch = this._getRemark()
      if (patch) {
        const response = await client.query({
          query: gql`
              mutation {
                rejectDeliveryOrder(${gqlBuilder.buildArgs({
                  name: this._orderName,
                  patch
                })}) {
                  name
                }
              }
            `
        })

        if (!response.errors) {
          history.back()
          this._showToast({ message: i18next.t('text.delivery_order_rejected') })
        }
      } else {
        return this._showToast({ message: i18next.t('text.remark_is_empty') })
      }
    } catch (e) {
      this._showToast({ message: e.message })
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

  _getDriverVehicle() {
    if (this.driver.value && this.vehicle.value) {
      return {
        transportDriver: { id: this.driver.selectedOptions[0].getAttribute('driver-id'), name: this.driver.value },
        transportVehicle: { id: this.vehicle.selectedOptions[0].getAttribute('vehicle-id'), name: this.vehicle.value }
      }
    } else {
      throw new Error(i18next.t('text.invalid_form'))
    }
  }

  stateChanged(state) {
    if (JSON.parse(this.active)) {
      this._orderName = state && state.route && state.route.resourceId
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

window.customElements.define('receive-delivery-order', ReceiveDeliveryOrder)
