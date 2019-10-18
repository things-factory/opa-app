import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { TRIP_CLAIM } from '../constants/claim'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store, flattenObject } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'

class CreateClaimChit extends connect(store)(localize(i18next)(PageView)) {
  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
        }

        .grist,
        .summary {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .summary {
          align-items: flex-end;
          padding: var(--data-list-item-padding);
        }

        .grist-claim-orders {
          flex: 1;
        }
        .grist-claim-details {
          flex: 4;
        }

        .grist-container {
          overflow-y: hidden;
          display: flex;
          flex: 1;
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
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }

        h2 mwc-icon {
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

  static get properties() {
    return {
      config: Object,
      data: Object,
      _claimOrderGristConfig: Object,
      _claimDetailGristConfig: Object,
      _driverList: Object,
      _vehicleList: Object,
      _bizplaceList: Object,
      _orderList: Array,
      _claimOrdersData: Object,
      _claimDetailsData: Object
    }
  }

  constructor() {
    super()
    this._claimOrdersData = {}
    this._claimDetailsData = {}
  }

  get context() {
    return {
      title: i18next.t('create_claim_chit'),
      actions: [
        {
          title: i18next.t('button.create'),
          action: this._createNewClaim.bind(this)
        }
      ]
    }
  }

  get _columns() {
    return this.config.columns
  }

  get _form() {
    return this.shadowRoot.querySelector('form')
  }

  get _dataClaimOrdersGrist() {
    return this.shadowRoot.querySelector('#claim-orders-grist')
  }

  get _dataClaimDetailsGrist() {
    return this.shadowRoot.querySelector('#claim-details-grist')
  }

  async pageInitialized() {
    this._driverList = { ...(await this.fetchDriverList()) }
    this._vehicleList = { ...(await this.fetchVehicleList()) }
    this._bizplaceList = { ...(await this.fetchBizplaceList()) }
    this._orderList = await this.fetchOrderList()

    this._claimOrderGristConfig = {
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._claimOrdersData = {
                ...this._claimOrdersData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
              this._dataClaimOrdersGrist.fetch()
            }
          }
        },
        {
          type: 'select',
          name: 'name',
          header: i18next.t('field.order'),
          record: {
            editable: true,
            align: 'left',
            options: [
              '',
              ...this._orderList.map(key => {
                return key.name
              })
            ]
          },
          width: 250
        }
      ]
    }

    this._claimDetailGristConfig = {
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._claimDetailsData = {
                ...this._claimDetailsData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
              this._dataClaimDetailsGrist.fetch()
            }
          }
        },
        {
          type: 'select',
          name: 'name',
          header: i18next.t('field.claim_type'),
          record: {
            editable: true,
            align: 'center',
            options: ['', ...Object.keys(TRIP_CLAIM).map(key => TRIP_CLAIM[key].value)]
          },
          width: 300
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'center' },
          width: 450
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.receipt_reference_no'),
          record: { editable: true, align: 'center' },
          width: 350
        },
        {
          type: 'float',
          name: 'amount',
          header: i18next.t('field.amount'),
          record: { editable: true, align: 'center' },
          width: 150
        }
      ]
    }

    await this.updateComplete
    this._dataClaimOrdersGrist.fetch()
    this._dataClaimDetailsGrist.fetch()
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.create_claim_chit')}</legend>

          <label>${i18next.t('label.order_no')}</label>
          <select name="transportDriver">
            <option value="">-- Please select a Driver --</option>

            ${Object.keys(this._driverList.data.transportDrivers.items || {}).map(key => {
              let driver = this._driverList.data.transportDrivers.items[key]
              return html`
                <option value="${driver.id}">${driver.name} - ${driver.driverCode}</option>
              `
            })}
          </select>

          <label>${i18next.t('label.lorry_no')}</label>
          <select name="transportVehicle">
            <option value="">-- Please select a Truck --</option>

            ${Object.keys(this._vehicleList.data.transportVehicles.items || {}).map(key => {
              let vehicle = this._vehicleList.data.transportVehicles.items[key]
              return html`
                <option value="${vehicle.id}">${vehicle.name}</option>
              `
            })}
          </select>

          <label>${i18next.t('label.customer')}</label>
          <select name="bizplace">
            <option value="">-- Please select a Bizplace --</option>

            ${Object.keys(this._bizplaceList.data.bizplaces.items || {}).map(key => {
              let bizplace = this._bizplaceList.data.bizplaces.items[key]
              return html`
                <option value="${bizplace.id}">${bizplace.name}</option>
              `
            })}
            <option value="others">Others</option>
          </select>

          <label>${i18next.t('label.billing_mode')}</label>
          <input name="billingMode" value="" />

          <label>${i18next.t('label.charges')}</label>
          <input name="charges" value="" type="number" />

          <label>${i18next.t('label.from')}</label>
          <textarea name="from" value="" type="text"></textarea>

          <label>${i18next.t('label.to')}</label>
          <textarea name="to" value="" type="text"></textarea>

          <label>${i18next.t('label.remark')}</label>
          <textarea name="remark"></textarea>
        </fieldset>
      </form>

      <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.create_claim_chit_details')}</h2>
      <div class="grist-container">
        <div class="grist grist-claim-orders">
          <data-grist
            id="claim-orders-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this._claimOrderGristConfig}
            .data="${this._claimOrdersData}"
          ></data-grist>
        </div>
        <div class="grist grist-claim-details">
          <data-grist
            id="claim-details-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this._claimDetailGristConfig}
            .data="${this._claimDetailsData}"
          ></data-grist>
        </div>
      </div>

      <div class="summary">
        <h2>${i18next.t('label.total')} : 0.00</h2>
      </div>
    `
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this._driverList = { ...(await this.fetchDriverList()) }
      this._vehicleList = { ...(await this.fetchVehicleList()) }
      this._bizplaceList = { ...(await this.fetchBizplaceList()) }
      this._orderList = { ...(await this.fetchOrderList()) }
    }
  }

  updated(changes) {
    // if (changes.has('_selectedOrderNo') && this._selectedOrderNo !== '') {
    //   Array.from(this._form.querySelectorAll('input')).map(field => {
    //     field.value = ''
    //   })
    //   if (this.___selectedOrderNo && this.___selectedOrderNo.trim() != '') this.fetchOrderDetail()
    // }
  }

  async fetchDriverList() {
    return await client.query({
      query: gql`
        query {
          transportDrivers (${gqlBuilder.buildArgs({ filters: [], pagination: { page: 1, limit: 9999 } })}){
            items{
              id
              name
              description
              driverCode
              bizplace{
                id
                name
              }
            }
          }
        }`
    })
  }

  async fetchVehicleList() {
    return await client.query({
      query: gql`
        query {
          transportVehicles (${gqlBuilder.buildArgs({ filters: [], pagination: { page: 1, limit: 9999 } })}){
            items{
              id
              name
              description
              bizplace{
                id
                name
              }
            }
          }
        }`
    })
  }

  async fetchBizplaceList() {
    return await client.query({
      query: gql`
        query {
          bizplaces (${gqlBuilder.buildArgs({ filters: [], pagination: { page: 1, limit: 9999 } })}){
            items{
              id
              name
              description
            }
          }
        }`
    })
  }

  async fetchOrderList() {
    var result = await client.query({
      query: gql`
        query {
          claimOrderList {
            name
            description
          }
        }
      `
    })

    return result.data.claimOrderList
  }

  async _createNewClaim() {
    try {
      var result = this._getClaimData()
      this._validateData(result)
      const response = await client.query({
        query: gql`
            mutation {
              createClaim(${gqlBuilder.buildArgs({
                claim: result
              })}) {
                id
                name
              }
            }
          `
      })
      if (!response.errors) {
        this._resetAll()
        this._showToast({ message: i18next.t('new_claim_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _resetAll() {
    this._form.reset()
    this._claimOrdersData = {}
    this._claimDetailsData = {}
    this._dataClaimOrdersGrist.fetch()
    this._dataClaimDetailsGrist.fetch()
    this._driverList = { ...(await this.fetchDriverList()) }
    this._vehicleList = { ...(await this.fetchVehicleList()) }
    this._bizplaceList = { ...(await this.fetchBizPlaces()) }
  }

  _validateData(data) {
    let error = ''
    if (data.transportDriver === '') error = error + 'Please choose a driver for claim. '
    if (data.transportVehicle === '') error = error + 'Please choose a truck for claim. '
    if (data.bizplace === '') error = error + 'Please choose a customer. '
    if (data.billingMode === '') error = error + 'Please enter billing mode for claim. '
    if (data.claimDetails.length === 0) error = error + 'Please add at least one (1) claim to proceed. '
    if (error.trim() !== '') throw new Error(error)
  }

  _getClaimData() {
    let claim = {}
    this._form.querySelectorAll('select,input,textarea').forEach(input => {
      claim[input.name] = input.value
    })

    let claimOrders = {}
    claimOrders = this._dataClaimOrdersGrist.dirtyRecords.map(claimOrders => {
      let patchField = {}
      const dirtyFields = claimOrders.__dirtyfields__
      for (let key in dirtyFields) {
        patchField[key] = dirtyFields[key].after
      }
      return { ...patchField }
    })

    let claimDetails = {}
    claimDetails = this._dataClaimDetailsGrist.dirtyRecords.map(claimDetail => {
      let patchField = {}
      const dirtyFields = claimDetail.__dirtyfields__
      for (let key in dirtyFields) {
        patchField[key] = dirtyFields[key].after
      }
      return { ...patchField }
    })
    return { ...claim, claimOrders, claimDetails }
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

window.customElements.define('create-claim-chit', CreateClaimChit)
