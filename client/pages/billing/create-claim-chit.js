import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { BILLING_MODE } from './constants/claim'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import {
  client,
  gqlBuilder,
  isMobileDevice,
  navigate,
  PageView,
  ScrollbarStyles,
  store,
  flattenObject
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { openPopup } from '@things-factory/layout-base'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/import-pop-up'

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
      claimDetailsGristConfig: Object,
      claimDetailsData: Object,
      config: Object,
      data: Object,
      importHandler: Object,
      _orderNo: Object,
      _selectedOrderNo: String
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.create_claim_chit')}</legend>

          <label>${i18next.t('label.orderNo')}</label>
          <select name="orderNo" @change=${e => (this._selectedOrderNo = e.target.value)}>
            <option value="">-- Please Select an Order --</option>

            ${Object.keys(this.___orderNo.data.claimOrderList || {}).map(key => {
              const orderNo = this.___orderNo.data.claimOrderList[key]
              return html`
                <option value="${orderNo.orderNo}">${orderNo.name}</option>
              `
            })}</select
          >

          <label>Billing Mode</label>
          <input disabled name="billingMode" value="" data-name="billingMode"></label>

          <label>Date</label>
          <input disabled name="orderDate" value="" data-name="orderDate"></label>

          <label>Lorry No</label>
          <input disabled name="lorryNo" value="" data-name="transportVehicle|name"></label>

          <label>Driver Code</label>
          <input disabled name="driveCode" value="" data-name="transportDriver|name"></label>

          <label>Customer</label>
          <input disabled name="bizplace" value="" data-name="bizplace|name"></label>

          <label>From</label>
          <input disabled name="from" value="" data-name="from"></label>

          <label>To</label>
          <input disabled name="to" value="" data-name="to"></label>
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${'title.claim_chit_details'}</h2>

        <data-grist
          id="claim-details-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.claimDetailsGristConfig}
          .data="${this.claimDetailsData}"
        ></data-grist>
      </div>
    `
  }

  firstUpdated() {
    this.claimDetailsGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close'
        },
        {
          type: 'select',
          name: 'claimType',
          header: i18next.t('field.claimType'),
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          width: 180
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.receipt_reference_no'),
          width: 150
        },
        {
          type: 'float',
          name: 'amount',
          header: i18next.t('field.amount'),
          width: 80
        }
      ]
    }
  }

  updated(changes) {
    if (changes.has('_selectedOrderNo') && this.___selectedOrderNo && this.___selectedOrderNo.trim() != '') {
      this.fetchOrderDetail()
    }
  }

  get context() {
    return {
      title: 'Create Claim Chit',
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._createNewClaim.bind(this)
        }
      ]
    }
  }

  async pageInitialized() {
    var x = await this.fetchOrderList()
    this._orderNo = x
  }

  async _fetchCODO() {
    this._orderNo = BILLING_MODE
  }

  get _columns() {
    return this.config.columns
  }

  async _createNewClaim() {
    try {
      //validation
      //create new claim
    } catch (e) {
      this._showToast(e)
    }
  }

  async fetchOrderList() {
    return await client.query({
      query: gql`
        query {
          claimOrderList {
            name
            orderNo
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
            name
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
    this.fillOrderDetails(result)
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  fillOrderDetails(responseDate) {
    debugger
    let deliveryOrder = responseDate.data.claimOrderDetail.deliveryOrder
    var obj = flattenObject(deliveryOrder)
    Object.keys(obj).map(key => {
      Array.from(this.form.querySelectorAll('input')).forEach(field => {
        if (field.dataset.name === key && field.type === 'datetime-local') {
          const datetime = Number(obj[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.dataset.name === key) {
          field.value = obj[key]
        }
      })
    })
  }

  // flattenObject(obj, delimiter = '|') {
  //   var objResult = {}
  //   for (var items in obj) {
  //     if (!!obj[items] && typeof obj[items] == 'object') {
  //       var flatObject = this.flattenObject(obj[items], delimiter)
  //       for (var x in flatObject) {
  //         objResult[items + delimiter + x] = flatObject[x]
  //       }
  //     } else {
  //       objResult[items] = obj[items]
  //     }
  //   }
  //   return objResult
  // }
}

window.customElements.define('create-claim-chit', CreateClaimChit)
