import '@things-factory/grist-ui'
import { client, gqlBuilder } from '@things-factory/shell'
import { css, html, LitElement } from 'lit-element'
import { fetchSettingRule } from '../../../fetch-setting-value'
import { i18next, localize } from '@things-factory/i18n-base'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import gql from 'graphql-tag'

class DeliveryNotePopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      _driverList: Array,
      _isDisabled: Boolean,
      _otherDestination: Boolean,
      _truckExist: Boolean,
      _truckList: Array,
      contactPoints: Array,
      doNo: String,
      ownCollection: Boolean,
      truckNo: String
    }
  }

  constructor() {
    super()
    this._otherDestination = false
    this._isDisabled = true
  }

  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
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

  async firstUpdated() {
    this._driverList = await this._fetchTruckDriver()
    this._truckList = await this._fetchTrucks()
    this._isDisabled = await fetchSettingRule('disable-reusable-pallet')
  }

  render() {
    return html`
      <form id="input-form" class="single-column-form">
        <fieldset>
          <legend>${i18next.t('title.delivery_information')} - ${this.doNo}</legend>
          <label>${i18next.t('label.delivery_date')}</label>
          <input name="deliveryDate" type="date" min="${this._getStdDate()}" required />

          <label>${i18next.t('label.driver_name')}</label>
          <input name="otherDriver" ?hidden="${!this.ownCollection}" />
          <select name="ownDriver" ?hidden="${this.ownCollection}">
            <option value="">-- ${i18next.t('text.please_select_a_driver')} --</option>
            ${(this._driverList || []).map(
              driver =>
                html`
                  <option value="${driver && driver.name}">${driver && driver.name}</option>
                `
            )}
          </select>
          
          <label>${i18next.t('label.truck_no')}</label>
          <input name="otherTruck" ?hidden="${!this.ownCollection}"
            value="${this.truckNo}"/>
          <select name="ownTruck" ?hidden="${this.ownCollection}">
            ${this._truckExist == true ?
              html `<option value="${this.truckNo}">${this.truckNo}</option>`
              :
              html `<option value="">-- ${i18next.t('text.please_select_a_truck')} --</option>`
            }

            ${(this._truckList || []).map(
              truck =>
                html`
                  <option value="${truck && truck.name}">${truck && truck.name}</option>
                `
            )}
          </select>

          <label ?hidden="${this._otherDestination}">${i18next.t('label.to')}</label>
          <select name="contactPoint" ?hidden="${this._otherDestination}">
            <option value="">-- ${i18next.t('text.please_select_a_destination')} --</option>
            ${(this.contactPoints || []).map(
              cp =>
                html`
                  <option value="${cp && cp.id}">${cp && cp.contactName},${cp && cp.address}</option>
                `
            )}
          </select>

          <input
            name="otherDestBoolean"
            type="checkbox"
            ?checked="${this._otherDestination}"
            @change="${e => (this._otherDestination = e.currentTarget.checked)}"
          />
          <label>${i18next.t('label.other_destination')}</label>

          <label ?hidden="${!this._otherDestination}">${i18next.t('label.contact_name')}</label>
          <input name="contactName" ?hidden="${!this._otherDestination}" />

          <label ?hidden="${!this._otherDestination}">${i18next.t('label.other_destination')}</label>
          <textarea name="otherDestination" ?hidden="${!this._otherDestination}"></textarea>

          <label ?hidden="${this._isDisabled}">${i18next.t('label.reusable_pallet')}</label>
          <textarea name="reusablePallet" ?hidden="${this._isDisabled}" ?disabled="${this._isDisabled}" placeholder="(${i18next.t('text.optional')})"></textarea>
        </fieldset>
      </form>

      <div class="button-container">
        <button @click="${this._saveDeliveryInfo}">${i18next.t('button.dispatch')}</button>
      </div>
    `
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  async _fetchTruckDriver() {
    const response = await client.query({
      query: gql`
      query {
        transportDrivers(${gqlBuilder.buildArgs({
          filters: [],
          sortings: [{name: 'name'}]
        })}) {
          items{
              id
              name
              driverCode
            }
        }
      }
    `
    })

    if (!response.errors) {
      return response.data.transportDrivers.items || []
    }
  }

  async _fetchTrucks() {
    const response = await client.query({
      query: gql`
      query {
        transportVehicles(${gqlBuilder.buildArgs({
          filters: [],
          sortings: [{name: 'name'}]
        })}) {
          items {
            id
            name
          }
        }
      }
    `
    })

    if (!response.errors) {
      this._truckExist = false
      const trucks = response.data.transportVehicles.items || []
      let filteredTrucks = trucks.filter(truck => truck.name != this.truckNo)

      if (trucks.length > filteredTrucks.length) this._truckExist = true
      return filteredTrucks
    }
  }

  async _saveDeliveryInfo() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            dispatchDeliveryOrder(${gqlBuilder.buildArgs({
              orderInfo: { ...this._getDeliveryInfo() }
            })}) {
              id
              name
              description
            }
          }
        `
      })

      if (!response.errors) {
        window.history.back()
        this._showToast({ message: i18next.t('text.delivery_has_been_dispatched') })
        this.dispatchEvent(new CustomEvent('delivery-dispatched'))
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getDeliveryInfo() {
    if (this.shadowRoot.querySelector('form').checkValidity()) {
      return {
        name: this.doNo,
        deliveryDate: this._getInputByName('deliveryDate').value,
        otherDriver: this._getInputByName('otherDriver').value,
        ownDriver: this._getInputByName('ownDriver').value,
        otherTruck: this.ownCollection ? this._getInputByName('otherTruck').value.toUpperCase().replace(/\s+/g, '') : null,
        ownTruck: this.ownCollection ? null : this._getInputByName('ownTruck').value,
        contactPoint: this._getInputByName('contactPoint').value,
        contactName: this._getInputByName('contactName').value,
        otherDestination: this._getInputByName('otherDestination').value,
        reusablePallet: this._getInputByName('reusablePallet').value
      }
    } else {
      throw new Error(i18next.t('text.delivery_info_not_valid'))
    }
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`textarea[name=${name}], select[name=${name}], input[name=${name}]`)
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  _fillUpForm(form, data) {
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

window.customElements.define('delivery-note-popup', DeliveryNotePopup)
