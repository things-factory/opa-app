import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getCodeByName } from '@things-factory/code-base'
import { client, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'

class ClaimChitDetail extends connect(store)(localize(i18next)(PageView)) {
  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        select {
          color: black;
        }

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
      _claimId: String,
      _claimOrderGristConfig: Object,
      _claimDetailGristConfig: Object,
      _claimOrdersData: Object,
      _claimDetailsData: Object,
      _driverList: Object,
      _vehicleList: Object,
      _bizplaceList: Object,
      _selectedDriver: String,
      _selectedTruck: String,
      _totalToll: Float32Array,
      _totalDieselFC: Float32Array,
      _totalDieselCash: Float32Array,
      _totalHandling: Float32Array,
      _totalOther: Float32Array,
      _totalClaim: Float32Array
    }
  }

  constructor() {
    super()
  }

  get context() {
    return {
      title: i18next.t('claim_chit_detail')
    }
  }

  get _columns() {
    return this._claimDetailGristConfig.columns
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

  async pageUpdated(changes) {
    if (this.active) {
      this._bizplaceList = { ...(await this.fetchBizplaceList()) }

      this._claimId = changes.params.id ? changes.param.id : this._claimId || ''

      if (this._claimId) {
        await this._fetchClaimChit()
      }
    }
  }

  async pageInitialized() {
    // this._editable = true
    this._claimTypes = await getCodeByName('CLAIM_TYPES')
    this._driverList = {}
    this._vehicleList = {}
    this._bizplaceList = {}

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
              if (this._editable) {
                this._claimOrdersData = {
                  ...this._claimOrdersData,
                  records: data.records.filter((record, idx) => idx !== rowIndex)
                }
              }
            }
          }
        },
        {
          type: 'select',
          name: 'name',
          header: i18next.t('field.order_no'),
          record: {
            editable: this._editable,
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
              if (this._editable) {
                this._claimDetailsData = {
                  ...this._claimDetailsData,
                  records: data.records.filter((record, idx) => idx !== rowIndex)
                }
                let name = data.records[rowIndex].name
                let amount = parseFloat(data.records[rowIndex].amount)

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
                    if (item.amount) return parseFloat(item.amount)
                  })
                  .reduce((a, b) => a + b, 0)
              }
            }
          }
        },
        {
          type: 'select',
          name: 'name',
          header: i18next.t('field.claim_type'),
          record: {
            editable: this._editable,
            align: 'center',
            options: ['', ...Object.keys(this._claimTypes).map(key => this._claimTypes[key].name)]
          },
          width: 300
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: this._editable, align: 'center' },
          width: 450
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.receipt_reference_no'),
          record: { editable: this._editable, align: 'center' },
          width: 350
        },
        {
          type: 'float',
          name: 'amount',
          header: i18next.t('field.amount'),
          record: { editable: this._editable, align: 'center' },
          width: 150
        }
      ]
    }
    await this.updateComplete
  }

  render() {
    return html`
      <form class="multi-column-form" autocomplete="off">
        <fieldset>
          <legend>${i18next.t('title.claim_chit')}</legend>

          <label>${i18next.t('label.name')}</label>
          <input readonly name="name" value="" />

          <label>${i18next.t('label.driver_name')}</label>
          <input readonly name="transportDriverName" value="" />

          <label>${i18next.t('label.lorry_no')}</label>
          <input readonly name="transportVehicleName" value="" />

          <label>${i18next.t('label.customer')}</label>
          <select ?disabled="${!this._editable}" name="bizplace">
            <option value="">-- ${i18next.t('text.please_select_a_customer')} --</option>

            ${Object.keys(this._bizplaceList.data ? this._bizplaceList.data.bizplaces.items : {}).map(key => {
              let bizplace = this._bizplaceList.data.bizplaces.items[key]
              return html`
                <option value="${bizplace.id}">${bizplace.name}</option>
              `
            })}
            <option value="others">Others</option>
          </select>

          <label>${i18next.t('label.billing_mode')}</label>
          <input ?readonly="${!this._editable}" name="billingMode" value="" />

          <label>${i18next.t('label.charges')}</label>
          <input ?readonly="${!this._editable}" name="charges" value="" type="number" step="0.01" />

          <label>${i18next.t('label.drum')}</label>
          <input ?readonly="${!this._editable}" name="drum" value="" type="number" step="0.01" />

          <label>${i18next.t('label.pallet')}</label>
          <input ?readonly="${!this._editable}" name="pallet" value="" type="number" step="0.01" />

          <label>${i18next.t('label.carton')}</label>
          <input ?readonly="${!this._editable}" name="carton" value="" type="number" step="0.01" />

          <label>${i18next.t('label.bag')}</label>
          <input ?readonly="${!this._editable}" name="bag" value="" type="number" step="0.01" />

          <label>${i18next.t('label.other')}</label>
          <input ?readonly="${!this._editable}" name="other" value="" type="number" step="0.01" />

          <label>${i18next.t('label.status')}</label>
          <select ?disabled="${!this._editable}" name="status">
            <option value="PENDING">PENDING</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
          </select>

          <label>${i18next.t('label.from')}</label>
          <textarea ?readonly="${!this._editable}" name="from" value="" type="text"></textarea>

          <label>${i18next.t('label.to')}</label>
          <textarea ?readonly="${!this._editable}" name="to" value="" type="text"></textarea>

          <label>${i18next.t('label.remark')}</label>
          <textarea ?readonly="${!this._editable}" name="remark"></textarea>
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

  async _fetchClaimChit() {
    if (!this._claimId) return

    const response = await client.query({
      query: gql`
        query {
          claim(${gqlBuilder.buildArgs({
            id: this._claimId
          })}) {
            id
            name
            description
            billingMode
            transportDriver{
              id
              name
              driverCode
            }
            transportVehicle{
              id
              name
            }
            bizplace{
              id
              name
            }
            charges
            drum
            pallet
            carton
            bag
            other
            from
            to
            remark
            status
            claimOrders {
              id
              name
            }     
            claimDetails {
              id
              name
              description
              refNo
              amount
            }
          }
        }
      `
    })

    if (!response.errors) {
      if (response.data.claim.status !== 'APPROVE') {
        this._editable = true
      } else {
        this._editable = false
      }

      this._selectedDriver = response.data.claim.transportDriver.id
      this._selectedTruck = response.data.claim.transportVehicle.id

      this._claimOrdersData = {
        total: response.data.claim.claimOrders.length || 0,
        records: response.data.claim.claimOrders || {}
      }
      this._claimDetailsData = {
        total: response.data.claim.claimDetails.length || 0,
        records: response.data.claim.claimDetails || {}
      }
      this._fillOrderDetails(this._form, {
        ...response.data.claim,
        bizplace: response.data.claim.bizplace.id,
        transportDriverName:
          response.data.claim.transportDriver.name + ' - ' + response.data.claim.transportDriver.driverCode,
        transportVehicleName: response.data.claim.transportVehicle.name
      })
      this._updateClaimSummary(response.data.claim.claimDetails)
      this._updatePageConfig()
      await this.fetchOrderList()
    }
  }

  _updatePageConfig() {
    this._claimOrderGristConfig = {
      ...this._claimOrderGristConfig,
      columns: this._claimOrderGristConfig.columns.map(column => {
        if (column.type !== 'gutter') {
          column.record = { ...column.record, editable: this._editable }
        }
        return column
      })
    }
    this._claimDetailGristConfig = {
      ...this._claimDetailGristConfig,
      columns: this._claimDetailGristConfig.columns.map(column => {
        if (column.type !== 'gutter') {
          column.record = { ...column.record, editable: this._editable }
        }
        return column
      })
    }

    let actions = [{ title: i18next.t('button.back'), action: () => history.back() }]
    let newContext = this.context

    if (this._editable) {
      actions = [{ title: i18next.t('button.update'), action: this._updateClaim.bind(this) }, ...actions]
    } else {
      newContext = {
        ...newContext,
        printable: {
          accept: ['preview'],
          content: this
        }
      }
    }

    newContext = {
      ...newContext,
      actions: actions
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: newContext
    })
  }

  async fetchOrderList() {
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
                  ...this._claimOrdersData.records.map(key => {
                    return key.name
                  }),
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

  _fillOrderDetails(form, objData) {
    Object.keys(objData).map(key => {
      Array.from(form.querySelectorAll('select,input,textarea')).forEach(field => {
        if (field.name === key) field.value = objData[key]
      })
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

  async _updateClaim() {
    try {
      var result = this._getClaimData()
      const response = await client.query({
        query: gql`
            mutation {
              updateClaim(${gqlBuilder.buildArgs({
                id: this._claimId,
                patch: result
              })}) {
                id
                name
              }
            }
          `
      })
      if (!response.errors) {
        this._showToast({ message: i18next.t('claim_updated') })
        history.back()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getClaimData() {
    this._dataClaimOrdersGrist.fetch()
    this._dataClaimDetailsGrist.fetch()
    let claim = {}
    this._form.querySelectorAll('select,input,textarea').forEach(input => {
      if (input.name !== 'transportDriverName' && input.name !== 'transportVehicleName')
        claim[input.name] = input.type === 'number' ? parseFloat(input.value || 0) : input.value
    })

    let claimOrders = []
    claimOrders = this._dataClaimOrdersGrist.dirtyData.records.map(item => {
      return { name: item.name }
    })

    let claimDetails = []
    claimDetails = this._dataClaimDetailsGrist.dirtyData.records.map(item => {
      return {
        name: item.name,
        description: item.description || '',
        refNo: item.refNo || '',
        amount: parseFloat(item.amount)
      }
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

window.customElements.define('claim-chit-detail', ClaimChitDetail)
