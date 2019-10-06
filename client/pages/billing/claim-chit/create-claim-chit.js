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

  static get properties() {
    return {
      config: Object,
      data: Object,
      _claimDetailGristConfig: Object,
      _orders: Object,
      _selectedOrderNo: String,
      _claimDetailsData: Object
    }
  }

  constructor() {
    super()
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

  get _dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async pageInitialized() {
    this._orders = { ...(await this.fetchOrderList()) }
    this._claimDetailGristConfig = {
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
              this._claimDetailsData = {
                ...this._claimDetailsData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
              this._dataGrist.fetch()
            }
          }
        },
        {
          type: 'select',
          name: 'name',
          header: i18next.t('field.claimType'),
          record: {
            editable: true,
            align: 'center',
            options: ['', ...Object.keys(TRIP_CLAIM).map(key => TRIP_CLAIM[key].value)]
          },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'center' },
          width: 600
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.receipt_reference_no'),
          record: { editable: true, align: 'center' },
          width: 500
        },
        {
          type: 'float',
          name: 'amount',
          header: i18next.t('field.amount'),
          record: { editable: true, align: 'center' },
          width: 180
        }
      ]
    }

    await this.updateComplete
    this._dataGrist.fetch()
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.create_claim_chit')}</legend>

          <label>${i18next.t('label.order_no')}</label>
          <select name="orderNo" @change=${e => (this._selectedOrderNo = e.target.value)} data-name="name">
            <option value="">-- Please Select an Order --</option>

            ${Object.keys(this.___orders.data.claimOrderList || {}).map(key => {
              const orderNo = this.___orders.data.claimOrderList[key]
              return html`
                <option value="${orderNo.name}">${orderNo.description}</option>
              `
            })}</select
          >

          <label>${i18next.t('label.billing_mode')}</label>
          <input disabled name="billingMode" value="" data-name="billingMode"></label>

          <label>${i18next.t('label.date')}</label>
          <input disabled name="orderDate" value="" type="datetime-local" data-name="orderDate"></label>

          <label>${i18next.t('label.lorry_no')}</label>
          <input disabled name="lorryNo" value="" data-name="transportVehicle|name"></label>

          <label>${i18next.t('label.driver_code')}</label>
          <input disabled name="driveCode" value="" data-name="transportDriver|name"></label>

          <label>${i18next.t('label.customer')}</label>
          <input disabled name="bizplace" value="" data-name="bizplace|name"></label>

          <label>${i18next.t('label.from')}</label>
          <input disabled name="from" value="" data-name="from"></label>

          <label>${i18next.t('label.to')}</label>
          <input disabled name="to" value="" data-name="to"></label>
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.create_claim_chit_details')}</h2>

        <data-grist
          id="claim-details-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this._claimDetailGristConfig}
          .data="${this._claimDetailsData}"
        ></data-grist>
      </div>
    `
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this._orders = { ...(await this.fetchOrderList()) }
    }
  }

  updated(changes) {
    if (changes.has('_selectedOrderNo') && this._selectedOrderNo !== '') {
      Array.from(this._form.querySelectorAll('input')).map(field => {
        field.value = ''
      })
      if (this.___selectedOrderNo && this.___selectedOrderNo.trim() != '') this.fetchOrderDetail()
    }
  }

  async fetchOrderList() {
    return await client.query({
      query: gql`
        query {
          claimOrderList {
            name
            description
          }
        }
      `
    })
  }

  async fetchOrderDetail() {
    var filters = [
      {
        ////order no = order name in order tables
        name: 'orderNo',
        value: this._selectedOrderNo
      }
    ]

    var result = await client.query({
      query: gql`
        query {
          claimOrderDetail (${gqlBuilder.buildArgs({
            filters
          })}){
            deliveryOrder{
              deliveryDateTime
              from
              to
              loadType
              transportDriver{
                id
                name
              }
              transportVehicle{
                id
                name
              }
              bizplace{
                name
              }
            }   
            collectionOrder{
              collectionDateTime
              from
              to
              loadType
              transportDriver{
                id
                name
              }
              transportVehicle{
                id
                name
              }
              bizplace{
                name
              }
            }         
          }
        }
      `
    })
    this._fillOrderDetails(result.data.claimOrderDetail)
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

  _fillOrderDetails(objData) {
    var obj = flattenObject(objData.deliveryOrder || objData.collectionOrder)
    Object.keys(obj).map(key => {
      Array.from(this._form.querySelectorAll('input')).forEach(field => {
        if (
          field.dataset.name === 'orderDate' &&
          field.type === 'datetime-local' &&
          (key === 'deliveryDateTime' || key === 'collectionDateTime')
        ) {
          const datetime = Number(obj[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.dataset.name === key) {
          field.value = obj[key]
        }
      })
    })
  }

  async _resetAll() {
    this._form.reset()
    this._selectedOrderNo = ''
    this._claimDetailsData = {}
    this._dataGrist.fetch()
    this._orders = { ...(await this.fetchOrderList()) }
  }

  _validateData(data) {
    let error = ''

    if (data.name === '') error = error + 'Please choose the order for claim.'
    if (data.claimDetails.length === 0) error = error + 'Please add at least one (1) claim to proceed.'

    if (error.trim() !== '') throw new Error(error)
  }

  _getClaimData() {
    let claim = {}
    Array.from(this._form.querySelectorAll('select')).forEach(field => {
      claim['description'] = field.options[field.selectedIndex].text
      claim['name'] = field.value
    })

    let claimDetails = {}
    claimDetails = this._dataGrist.dirtyRecords.map(claimDetail => {
      let patchField = {}
      const dirtyFields = claimDetail.__dirtyfields__
      for (let key in dirtyFields) {
        patchField[key] = dirtyFields[key].after
      }

      return { ...patchField }
    })

    return { ...claim, claimDetails }
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
