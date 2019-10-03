import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../popup-note'

class CompletedDeliveryOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _doNo: String,
      _status: String,
      _loadTypes: Array,
      drivers: Array,
      vehicles: Array,
      _prevDriverName: String,
      _prevVehicleName: String
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
      title: i18next.t('title.delivery_order_detail'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ]
    }
  }

  constructor() {
    super()
    this._transportOptions = []
    this._loadTypes = []
    this.drivers = []
    this.vehicles = []
  }

  render() {
    return html`
      <div class="co-form-container">
        <form name="deliveryOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.delivery_order')}</legend>
            <label>${i18next.t('label.issued_do_no')}</label>
            <input name="name" readonly />

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="deliveryDate" type="date" readonly />

            <label>${i18next.t('label.destination')}</label>
            <input name="to" readonly />

            <label>${i18next.t('label.ref_no')}</label>
            <input name="refNo" readonly />

            <label>${i18next.t('label.load_type')}</label>
            <select name="loadType" disabled>
              <option value=""></option>
              ${this._loadTypes.map(
                loadType => html`
                  <option value="${loadType.name}">${i18next.t(`label.${loadType.description}`)}</option>
                `
              )}
            </select>

            <label>${i18next.t('label.assign_driver')}</label>
            <select name="driver" id="driver" disabled>
              ${this.drivers.map(
                driver => html`
                  <option
                    ?selected="${this._prevDriverName === driver.name}"
                    driver-id="${driver.id}"
                    value="${driver.name}"
                    >${driver.driverCode}-${driver.name}</option
                  >
                `
              )}</select
            >

            <label>${i18next.t('label.assign_vehicle')}</label>
            <select name="vehicle" id="vehicle" disabled>
              ${this.vehicles.map(
                vehicle => html`
                  <option
                    ?selected="${this._prevVehicleName === vehicle.name}"
                    vehicle-id="${vehicle.id}"
                    value="${vehicle.name}"
                    >${vehicle.regNumber}</option
                  >
                `
              )}</select
            >

            <!-- <label>${i18next.t('label.document')}</label>
            <input name="attachment" type="file" readonly /> -->
          </fieldset>
        </form>
      </div>
    `
  }

  get deliveryOrderForm() {
    return this.shadowRoot.querySelector('form[name=deliveryOrder]')
  }

  get driver() {
    return this.shadowRoot.querySelector('select#driver')
  }

  get vehicle() {
    return this.shadowRoot.querySelector('select#vehicle')
  }

  async firstUpdated() {
    this._loadTypes = await getCodeByName('LOAD_TYPES')
  }

  async pageUpdated(changes) {
    if (this.active) {
      this._doNo = changes.resourceId || this._doNo || ''
      this._fetchDeliveryOrder()
      this._fetchTransportDriver()
      this._fetchTransportVehicle()
    }
  }

  async _fetchDeliveryOrder() {
    if (!this._doNo) return
    this._status = ''
    const response = await client.query({
      query: gql`
        query {
          deliveryOrder(${gqlBuilder.buildArgs({
            name: this._doNo
          })}) {
            id
            name
            deliveryDate
            refNo
            to
            loadType
            status
            transportDriver {
              id
              name
              driverCode
            }
            transportVehicle {
              id
              name
              regNumber
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._prevDriverName = response.data.deliveryOrder.transportDriver.name
      this._prevVehicleName = response.data.deliveryOrder.transportVehicle.name

      const deliveryOrder = response.data.deliveryOrder
      this._status = deliveryOrder.status
      this._fillupDOForm(deliveryOrder)
    }
  }

  async _fetchTransportDriver() {
    if (!this._doNo) return
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

  async _fetchTransportVehicle() {
    if (!this._doNo) return
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

  _getDeliveryOrder() {
    return this._serializeForm(this.deliveryOrderForm)
  }

  _fillupDOForm(data) {
    this._fillupForm(this.deliveryOrderForm, data)
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

window.customElements.define('completed-delivery-order', CompletedDeliveryOrder)
