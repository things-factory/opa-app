import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store } from '@things-factory/shell'
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
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: minmax(24px, auto);
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

        .summary label {
          text-align: right;
          text-transform: capitalize;
          color: #394e64;
          grid-column: span 2 / auto;
        }

        .multi-column-form .filler {
          grid-column: span 12 / auto;
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
      _claimOrdersData: Object,
      _claimDetailsData: Object,
      _driverList: Object,
      _vehicleList: Object,
      _bizplaceList: Object,
      _selectedDriver: String,
      _selectedTruck: String,
      _totalClaim: Float32Array,
      _totalToll: Float32Array,
      _totalDieselFC: Float32Array,
      _totalDieselCash: Float32Array,
      _totalHandling: Float32Array,
      _totalOther: Float32Array
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
    this._claimTypes = await getCodeByName('CLAIM_TYPES')
    this._driverList = { ...(await this.fetchDriverList()) }
    this._vehicleList = { ...(await this.fetchVehicleList()) }
    this._bizplaceList = { ...(await this.fetchBizplaceList()) }

    this._totalToll = 0
    this._totalDieselFC = 0
    this._totalDieselCash = 0
    this._totalHandling = 0
    this._totalOther = 0
    this._totalClaim = 0

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
          header: i18next.t('field.order_no'),
          record: {
            editable: true,
            align: 'left',
            options: ['']
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
              let name = data.records[rowIndex].name
              let amount = data.records[rowIndex].amount

              switch (name) {
                case 'Toll':
                  this._totalToll = this._totalToll - amount
                  break
                case 'Diesel FC':
                  this._totalDieselFC = this._totalDieselFC - amount
                  break
                case 'Diesel Cash':
                  this._totalDieselCash = this._totalDieselCash - amount
                  break
                case 'Handling':
                  this._totalHandling = this._totalHandling - amount
                  break
                default:
                  this._totalOther = this._totalOther - amount
                  break
              }

              this._totalClaim = this._claimDetailsData.records
                .map(item => {
                  if (item.amount) return item.amount
                })
                .reduce((a, b) => a + b, 0)
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
            options: ['', ...Object.keys(this._claimTypes).map(key => this._claimTypes[key].name)]
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
      <form class="multi-column-form" autocomplete="off">
        <fieldset>
          <legend>${i18next.t('title.create_claim_chit')}</legend>

          <label>${i18next.t('label.driver_name')}</label>
          <select @change=${e => (this._selectedDriver = e.target.value)} name="transportDriver" @>
            <option value="">-- ${i18next.t('text.please_select_a_driver')} --</option>

            ${Object.keys(this._driverList.data.transportDrivers.items || {}).map(key => {
              let driver = this._driverList.data.transportDrivers.items[key]
              return html`
                <option value="${driver.id}">${driver.name} - ${driver.driverCode}</option>
              `
            })}
          </select>

          <label>${i18next.t('label.lorry_no')}</label>
          <select @change=${e => (this._selectedTruck = e.target.value)} name="transportVehicle">
            <option value="">-- ${i18next.t('text.please_select_a_truck')} --</option>

            ${Object.keys(this._vehicleList.data.transportVehicles.items || {}).map(key => {
              let vehicle = this._vehicleList.data.transportVehicles.items[key]
              return html`
                <option value="${vehicle.id}">${vehicle.name}</option>
              `
            })}
          </select>

          <label>${i18next.t('label.customer')}</label>
          <select name="bizplace">
            <option value="">-- ${i18next.t('text.please_select_a_customer')} --</option>

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
          <input name="charges" value="" type="number" step="0.01" />

          <div class="filler"></div>

          <label>${i18next.t('label.drum')}</label>
          <input name="drum" value="" type="number" step="0.01" />

          <label>${i18next.t('label.pallet')}</label>
          <input name="pallet" value="" type="number" step="0.01" />

          <label>${i18next.t('label.carton')}</label>
          <input name="carton" value="" type="number" step="0.01" />

          <label>${i18next.t('label.bag')}</label>
          <input name="bag" value="" type="number" step="0.01" />

          <label>${i18next.t('label.other')}</label>
          <input name="other" value="" type="number" step="0.01" />

          <div class="filler"></div>

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
            @field-change="${this._updateAmount.bind(this)}"
          ></data-grist>
        </div>
      </div>

      <div class="summary">
        <label>${i18next.t('label.toll')} : ${this._totalToll.toFixed(2)}</label>
        <label>${i18next.t('label.diesel_fc')} : ${this._totalDieselFC.toFixed(2)}</label>
        <label>${i18next.t('label.diesel_cash')} : ${this._totalDieselCash.toFixed(2)}</label>
        <label>${i18next.t('label.handling')} : ${this._totalHandling.toFixed(2)}</label>
        <label>${i18next.t('label.other')} : ${this._totalOther.toFixed(2)}</label>
        <label>${i18next.t('label.total')} : ${this._totalClaim.toFixed(2)}</label>
      </div>
    `
  }

  _updateClaimSummary(data) {
    this._totalClaim = 0
    this._totalToll = 0
    this._totalDieselFC = 0
    this._totalDieselCash = 0
    this._totalHandling = 0
    this._totalOther = 0

    data.map(item => {
      if (item.amount) {
        let amount = parseFloat(item.amount)
        this._totalClaim = parseFloat(this._totalClaim) + parseFloat(item.amount)

        switch (item.name) {
          case 'Toll':
            this._totalToll = this._totalToll + amount
            break
          case 'Diesel FC':
            this._totalDieselFC = this._totalDieselFC + amount
            break
          case 'Diesel Cash':
            this._totalDieselCash = this._totalDieselCash + amount
            break
          case 'Handling':
            this._totalHandling = this._totalHandling + amount
            break
          default:
            this._totalOther = this._totalOther + amount
            break
        }
      }
    })
  }

  _updateAmount(e) {
    if (e.detail.column.name === 'amount' || e.detail.column.name === 'name') {
      this._updateClaimSummary(this._dataClaimDetailsGrist.dirtyData.records)
    }
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this._driverList = { ...(await this.fetchDriverList()) }
      this._vehicleList = { ...(await this.fetchVehicleList()) }
      this._bizplaceList = { ...(await this.fetchBizplaceList()) }
    }
  }

  async updated(changes) {
    if (changes.has('_selectedDriver') || changes.has('_selectedTruck')) {
      await this.fetchOrderList()
    }
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
    this._claimOrdersData = {}
    this._dataClaimOrdersGrist.fetch()
    if (this._selectedDriver && this._selectedTruck && (this._selectedDriver != '') & (this._selectedTruck != '')) {
      try {
        var result = await client.query({
          query: gql`
          query {
            claimOrderList (${gqlBuilder.buildArgs({
              transportDriver: this._selectedDriver,
              transportVehicle: this._selectedTruck
            })}){
              id
              name
              description
            }
          }
        `
        })
        if (!result.errors) {
          this._claimOrderGristConfig = {
            ...this._claimOrderGristConfig,
            columns: this._claimOrderGristConfig.columns.map(column => {
              if (column.name === 'name')
                column.record.options = [
                  '',
                  ...result.data.claimOrderList.map(key => {
                    return key.name
                  })
                ]

              return column
            })
          }
        }
      } catch (e) {
        this._showToast(e)
      }
    } else {
      this._claimOrderGristConfig = {
        ...this._claimOrderGristConfig,
        columns: this._claimOrderGristConfig.columns.map(column => {
          if (column.name === 'name') column.record.options = ['']
          return column
        })
      }
    }
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
        this._showToast({ message: i18next.t('claim_created') })
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
    this._totalClaim = 0
  }

  _validateData(data) {
    let error = ''
    if (data.transportDriver === '') error = error + 'Please choose a driver for claim. '
    if (data.bizplace === '') error = error + 'Please choose a customer. '
    if (data.billingMode === '') error = error + 'Please enter billing mode for claim. '
    if (data.claimDetails.length === 0) error = error + 'Please add at least one (1) claim to proceed. '

    if (error.trim() !== '') throw new Error(error)
  }

  _getClaimData() {
    let claim = {}
    this._form.querySelectorAll('select,input,textarea').forEach(input => {
      claim[input.name] = input.type === 'number' ? parseFloat(input.value) : input.value
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
