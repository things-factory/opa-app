import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { fetchSettingRule } from '../../../fetch-setting-value'
import './contact-point-selector-popup'
import './transport-driver-popup'
import '../../outbound/transport-vehicles-popup'

class DeliveryNotePopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      _driverList: Array,
      _isDisabled: Boolean,
      _otherDestination: Boolean,
      _truckExist: Boolean,
      _truckList: Array,
      bizplace: Object,
      contactPoints: Array,
      doNo: String,
      doGristConfig: Object,
      doData: Object,
      ownCollection: Boolean,
      truckNo: String,
      selectedCP: String
    }
  }

  constructor() {
    super()
    this._otherDestination = false
    this._isDisabled = true
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }
        .container {
          flex: 1;
          display: flex;
          overflow-y: auto;
          min-height: 20vh;
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

  async firstUpdated() {
    this._driverList = await this._fetchTruckDriver()
    this._truckList = await this._fetchTrucks()
    await this.fetchDeliveryInfo()
    this._isDisabled = await fetchSettingRule('disable-reusable-pallet')

    this.doGristConfig = {
      list: { fields: ['ready', 'targetType', 'targetDisplay', 'packingType'] },
      pagination: { infinite: true },
      rows: { appendable: false },
      columns: [
        {
          type: 'string',
          name: 'pallet',
          hidden: true
        },
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'productName',
          header: i18next.t('field.product'),
          width: 220
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'releaseWeight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'systemRemark',
          header: i18next.t('field.system_remark'),
          record: { align: 'left' },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'center', editable: true },
          width: 180
        }
      ]
    }
  }

  render() {
    return html`
      <form id="input-form" name="doForm" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.delivery_information')} - ${this.doNo}</legend>
          <label>${i18next.t('label.delivery_date')}</label>
          <input name="deliveryDate" type="date" min="${this._getStdDate()}" required />

          <label>${i18next.t('label.driver_name')}</label>
          <input name="otherDriver" ?hidden="${!this.ownCollection}" />
          <input
            name="ownDriver"
            ?hidden="${this.ownCollection}"
            readonly
            @click="${this._openDriverSelector.bind(this)}"
          />

          <label>${i18next.t('label.truck_no')}</label>
          <input name="otherTruck" ?hidden="${!this.ownCollection}" value="${this.truckNo}" />
          <input
            name="ownTruck"
            ?hidden="${this.ownCollection}"
            readonly
            @click="${this._openTruckSelector.bind(this)}"
            value=${this.truckNo === null ? '' : this.truckNo}
          />

          <label ?hidden="${this._otherDestination}">${i18next.t('label.to')}</label>
          <input
            name="contactPoint"
            ?hidden="${this._otherDestination}"
            readonly
            @click="${this._openCPSelector.bind(this)}"
          />

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

          <label>${i18next.t('label.overall_remark')}</label>
          <textarea name="remark"></textarea>

          <label ?hidden="${this._isDisabled}">${i18next.t('label.reusable_pallet')}</label>
          <textarea
            name="reusablePallet"
            ?hidden="${this._isDisabled}"
            ?disabled="${this._isDisabled}"
            placeholder="(${i18next.t('text.optional')})"
          ></textarea>
        </fieldset>
      </form>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.edit_remark')}</h2>

          <data-grist
            id="do-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.doGristConfig}
            .data=${this.doData}
          ></data-grist>
        </div>
      </div>

      <div class="button-container">
        <button @click="${this._saveDeliveryInfo}">${i18next.t('button.dispatch')}</button>
      </div>
    `
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get doForm() {
    return this.shadowRoot.querySelector('form[name=doForm]')
  }

  get contactPointInput() {
    return this.shadowRoot.querySelector('input[name=contactPoint]')
  }

  get truckNoInput() {
    return this.shadowRoot.querySelector('input[name=ownTruck]')
  }

  get truckDriverInput() {
    return this.shadowRoot.querySelector('input[name=ownDriver]')
  }

  get doGrist() {
    return this.shadowRoot.querySelector('data-grist#do-grist')
  }

  _openCPSelector() {
    openPopup(
      html`
        <contact-point-selector-popup
          .bizplace="${this.bizplace}"
          @selected="${e => {
            this.contactPointInput.value = `${e.detail.name}, ${e.detail.address}`
            this.selectedCP = e.detail.id
          }}"
        ></contact-point-selector-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.select_destination')
      }
    )
  }

  _openTruckSelector() {
    openPopup(
      html`
        <transport-vehicles-popup
          @selected="${e => {
            this.truckNoInput.value = e.detail.name
          }}"
        ></transport-vehicles-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.select_truck')
      }
    )
  }

  _openDriverSelector() {
    openPopup(
      html`
        <transport-driver-popup
          @selected="${e => {
            this.truckDriverInput.value = e.detail.name
          }}"
        ></transport-driver-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.select_driver')
      }
    )
  }

  async _fetchTruckDriver() {
    const response = await client.query({
      query: gql`
      query {
        transportDrivers(${gqlBuilder.buildArgs({
          filters: [],
          sortings: [{ name: 'name' }]
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
          sortings: [{ name: 'name' }]
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

  async fetchDeliveryInfo() {
    const response = await client.query({
      query: gql`
        query {
          deliveryOrderItems(${gqlBuilder.buildArgs({
            name: this.doNo
          })}) {
            items {
              releaseQty
              releaseWeight
              status
              remark
              systemRemark
              batchId
              productName
              packingType
              pallet
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.doData = {
        records: response.data.deliveryOrderItems.items
      }
    }
  }

  async _saveDeliveryInfo() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            dispatchDeliveryOrder(${gqlBuilder.buildArgs({
              orderInfo: { ...this._getDeliveryInfo() },
              orderItems: this._getOrderItems()
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
        otherTruck: this.ownCollection
          ? this._getInputByName('otherTruck').value.toUpperCase().replace(/\s+/g, '')
          : null,
        ownTruck: this.ownCollection ? null : this._getInputByName('ownTruck').value,
        contactPoint: this.selectedCP,
        contactName: this._getInputByName('contactName').value,
        otherDestination: this._getInputByName('otherDestination').value,
        reusablePallet: this._getInputByName('reusablePallet').value,
        remark: this._getInputByName('remark').value
      }
    } else {
      throw new Error(i18next.t('text.delivery_info_not_valid'))
    }
  }

  _getOrderItems() {
    if (this.doGrist.dirtyData && this.doGrist.dirtyData.records && this.doGrist.dirtyData.records.length > 0) {
      return this.doGrist.dirtyData.records.map(record => {
        let newRecord = {
          pallet: record.pallet,
          productName: record.productName,
          releaseQty: record.releaseQty,
          releaseWeight: record.releaseWeight,
          batchId: record.batchId,
          packingType: record.packingType,
          remark: record?.remark ? record.remark : ''
        }
        return newRecord
      })
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
