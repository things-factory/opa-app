import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { gqlBuilder } from '@things-factory/utils'
import { css, html } from 'lit-element'
import '../../components/popup-note'
import { ORDER_STATUS } from '../constants/order'
import './delivery-note-popup'

class PrintDeliveryOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _doNo: String,
      _driverName: String,
      _driver: String,
      _truckNo: String,
      _ownCollection: Boolean,
      _status: String,
      _date: Date,
      _orderInventories: Object,
      _bizplace: Object,
      _customerName: String,
      _workerName: String,
      _recipient: String,
      _company: String,
      _companyBrn: String,
      _companyAddress: String,
      _companyCP: Object,
      _palletQty: String,
      _proceedFlag: Boolean,
      _customerContactPoints: Array
    }
  }

  constructor() {
    super()
    this._workerName = ''
    this._truckNo = ''
    this._customerName = ''
    this._palletQty = '0'
    this._company = ''
    this._date = ''
    this._status = ''
  }

  static get styles() {
    return [
      css`
        :host {
          display: flex;
          flex-direction: column;
          padding: 20px;
          font-family: 'Times New Roman', Times;
        }

        [goods-delivery-note] {
          overflow: scroll;
        }

        /* Hide scrollbar for Chrome, Safari and Opera*/
        [goods-delivery-note]::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE and Edge */
        [goods-delivery-note] {
          -ms-overflow-style: none;
        }

        [business-info] {
          width: 40%;
          white-space: nowrap;
        }

        [business-name] {
          display: inline-block;
          font-weight: bold;
        }

        [business-info] [address] {
          white-space: normal;
        }

        [customer-address] {
          min-height: 70px;
        }

        [title] {
          text-align: center;
          font-weight: bold;
        }

        [brief] {
          display: grid;
          grid-template-columns: 3fr 1fr;
        }

        [brief] > div {
          display: grid;
          grid-gap: 1px;
          grid-template-columns: 3fr 1fr;
          position: relative;
        }

        [brief] > div[right] {
          grid-template-columns: 5fr 8fr;
          grid-auto-rows: 25px 25px 25px;
        }

        [brief] > div[left] {
          grid-template-columns: 1fr;
          grid-auto-rows: 25px 25px auto;
        }

        [customer-company],
        [ref-no],
        [delivered-by] {
          font-size: 1.2em;
          font-weight: bold;
          text-transform: uppercase;
        }

        [ref-no] {
          font-size: 1em;
          line-height: 0.5;
        }

        [detail] {
          flex: 1;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        [pallet-quantity] {
          text-align: right;
        }

        [business-verification] {
          flex: 1;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        [customer-confirmation] {
          flex: 1;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        table {
          width: 100%;
          height: 100%;
          border-spacing: 0;
          border-collapse: collapse;
          margin-top: 20px;
          margin-bottom: 20px;
        }

        [verification-head] > th:nth-child(-n + 4) {
          text-align: center;
          width: 15%;
        }

        [verification-body] > td:nth-child(-n + 5) {
          text-align: center;
          max-height: 100px;
          padding: 93px 0px 7px;
        }

        [confirmation-head] > td:nth-child(1) {
          text-align: justify;
          text-justify: inter-word;
          width: 65%;
          padding: 10px 10px 200px;
        }

        [confirmation-head] > td:nth-child(2) {
          text-align: center;
          width: 35%;
          max-height: 100px;
          padding: 90px 0px 0px;
        }

        [confirmation-body] > td:nth-child(1) {
          text-align: center;
          width: 35%;
          max-height: 100px;
          padding: 90px 0px 0px;
        }

        [dopono] > td:nth-child(1) {
          padding: 10px;
        }

        th {
          background-color: #f0f0f0;
          text-transform: capitalize;
        }

        th,
        td {
          border: 1px solid black;
          padding: 0px 10px;
        }

        em {
          font-weight: bold;
        }

        hr {
          width: 75%;
        }

        [agreement] {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-gap: 100px;
        }

        [agreement] [customer-side] [business-name] {
          font-size: 1em;
          font-weight: bold;
        }

        [signature] {
          height: 100px;
          border-bottom: 1px solid black;
        }

        [desc] {
          font-style: italic;
        }

        [footer] {
          text-align: center;
          text-transform: uppercase;
        }

        [business-side] [name],
        [business-side] [date] {
          margin-top: 10px;
          margin-bottom: 10px;
        }

        [idx] {
          width: 20px;
          text-align: center;
        }

        @media print {
          :host {
            font-size: 0.6em;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          #date,
          #driver_name,
          #receipient_address,
          #Header,
          #Footer {
            display: none !important;
          }
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.goods_delivery_note_details'),
      actions: this._actions,
      printable: {
        accept: ['preview'],
        content: this
      }
    }
  }

  render() {
    var company = this._company.toUpperCase()
    var brn = this._companyBrn
    var companyAddress = this._companyAddress
    var phonefax = this._companyCP && this._companyCP.phone ? this._companyCP.phone : ''
    var email = this._companyCP && this._companyCP.email ? this._companyCP.email : ''

    var customer = this._customerName.toUpperCase()
    var totalPallet = this._palletQty
    var doNo = this._doNo || ''
    var refNo = this._releaseOrderName || ''
    var date = this._date || ''
    var workerName = this._workerName || ''
    var driverName = this._driverName || ''
    var truckNo = this._truckNo || ''

    var address = this._recipient ? this._recipient.split(',') : ''

    return html`
      <div goods-delivery-note>
        <div business-info>
          <h2 business-name>${company}</h2>
          <span business-brn>(${brn})</span>
          <div business-address>${companyAddress}</div>
          <div business-contact>${phonefax}</div>
          <div business-email>${email}</div>
        </div>

        <h1 title>GOODS DELIVERY NOTE</h1>

        <div brief>
          <div left>
            <span>M/s <i>${customer}</i></span>
            <label><strong>To be delivered to/collected by:</strong></label>
            <div customer>
              <address customer-address>
                ${(address || []).map((part, index) =>
                  index == 0
                    ? html`
                        ${part} <br />
                      `
                    : index == address.length - 1
                    ? html`
                        ${part}. <br />
                      `
                    : html`
                        ${part}, <br />
                      `
                )}
              </address>
              <br />
            </div>
          </div>

          <div right>
            <label>DO No. : </label><b>${doNo}</b>

            <label>Reference No. : </label><b>${refNo}</b>

            <label>Date : </label>${date}
          </div>
        </div>

        <div detail>
          <table product-table>
            <thead>
              <tr>
                <th idx>#</th>
                <th>Items</th>
                <th>Description</th>
                <th>Batch ID</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(this._orderInventories || {}).map((key, index) => {
                let sku = this._orderInventories[key]
                return html`
                  <tr>
                    <td idx>${index + 1}</td>
                    <td>${sku.product.name}</td>
                    <td>${sku.product.description}</td>
                    <td>${sku.batchId}</td>
                    <td>${sku.releaseQty} ${sku.packingType}</td>
                  </tr>
                `
              })}
              <tr>
                <td colspan="4" pallet-quantity><strong>Total Pallet</strong></td>
                <td>${totalPallet}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div business-verification>
          <label>Verification by ${company}</label>
          <table>
            <thead>
              <tr verification-head>
                <th>Issued By</th>
                <th>Loaded By</th>
                <th>Checked By</th>
                <th>Truck Number</th>
                <th>Driver's Signature</th>
              </tr>
            </thead>
            <tbody>
              <tr verification-body>
                <td></td>
                <td>${workerName}</td>
                <td></td>
                <td>${truckNo}</td>
                <td>
                  <span><hr width="85%"/></span>${driverName} <br />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div customer-confirmation>
          <label>Confirmation by ${customer}</label>
          <table confirmation_table>
            <tr confirmation-head>
              <td rowspan="2">
                <em>
                  Please examine the goods before acceptance as we will not be responsible for any damage or defect
                  after delivery. Goods once accepted are not returnable.
                </em>
                <br /><br />[REMARK]:
              </td>
              <td><hr /></td>
            </tr>
            <tr confirmation-body>
              <td>
                Please sign & stamp here in receipt
              </td>
            </tr>
            <tr dopono>
              <td colspan="2">[Customer DO No./PO No.]:</td>
            </tr>
          </table>
        </div>
      </div>
    `
  }

  async pageUpdated(changes) {
    if (this.active) {
      if (changes.resourceId) {
        this._doNo = changes.resourceId || this._doNo || ''
        await this._fetchDeliveryOrder(this._doNo)
        this._updateContext()
      }
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  async _fetchDeliveryOrder(name) {
    const response = await client.query({
      query: gql`
        query {
          deliveryOrderByWorksheet(${gqlBuilder.buildArgs({
            name
          })}) {
            deliveryOrderInfo {
              partnerBizplace
              domainBizplace
              domainBrn
              domainAddress
              releaseGoodNo
              to
              ownCollection
              palletQty
              doStatus
              driverName
              deliveryDate
              truckNo
              updaterName
            }
            loadedInventoryInfo {
              palletId
              batchId
              product {
                id
                name
                description
              }
              packingType
              releaseQty
              releaseWeight
              status
              productDescription
            }
            contactPointInfo {
              contactName
              address
              phone
              fax
              email
            }
          }
        }
      `
    })

    if (!response.errors) {
      const deliveryOrderData = response.data.deliveryOrderByWorksheet
      const loadedInventoryData = deliveryOrderData.loadedInventoryInfo
      this._releaseOrderName = deliveryOrderData.deliveryOrderInfo.releaseGoodNo

      this._status = deliveryOrderData.deliveryOrderInfo.doStatus
      this._ownCollection = deliveryOrderData.deliveryOrderInfo.ownCollection
      this._truckNo = deliveryOrderData.deliveryOrderInfo.truckNo

      this._recipient = deliveryOrderData.deliveryOrderInfo.to || ''
      this._date = deliveryOrderData.deliveryOrderInfo.deliveryDate || ''
      this._workerName = deliveryOrderData.deliveryOrderInfo.updaterName
      this._palletQty = deliveryOrderData.deliveryOrderInfo.palletQty
      this._driverName = deliveryOrderData.deliveryOrderInfo.driverName || ''

      if (loadedInventoryData.length > 0) {
        this._orderInventories = loadedInventoryData
      }

      this._company = deliveryOrderData.deliveryOrderInfo.domainBizplace
      this._companyBrn = deliveryOrderData.deliveryOrderInfo.domainBrn
      this._companyAddress = deliveryOrderData.deliveryOrderInfo.domainAddress
      this._customerName = deliveryOrderData.deliveryOrderInfo.partnerBizplace
      this._customerContactPoints = deliveryOrderData.contactPointInfo
    }
  }

  async _executeDeliveryOrder() {
    try {
      this._validateInput()
      this._proceedFlag = false

      if (!this._recipient) {
        await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.dispatch_delivery_order_without_delivery_address'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') },
          callback: async result => {
            if (result.dismiss) return
            else if (result.value) this._proceedFlag = true
          }
        })
      } else {
        await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.dispatch_delivery_order'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') },
          callback: async result => {
            if (result.dismiss) return
            else if (result.value) this._proceedFlag = true
          }
        })
      }

      if (this._proceedFlag === true) {
        var args = {
          orderInfo: {
            name: this._doNo,
            to: this._recipient,
            deliveryDate: this._date,
            driverName: this._driverName || null
          }
        }

        const response = await client.query({
          query: gql`
            mutation {
              dispatchDeliveryOrder(${gqlBuilder.buildArgs(args)}) {
                name
              }
            }
          `
        })

        if (!response.errors) {
          this._status = ORDER_STATUS.DELIVERING
          this._updateContext()
          this._showToast({ message: i18next.t('text.dispatch_successful') })
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _checkDeliveredOrder() {
    const popup = openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.remark')}"
          @submit="${async e => {
            try {
              const result = await CustomAlert({
                title: i18next.t('title.are_you_sure'),
                text: i18next.t('text.completed_delivery_order'),
                confirmButton: { text: i18next.t('button.confirm') },
                cancelButton: { text: i18next.t('button.cancel') }
              })

              if (!result.value) {
                return
              }

              const response = await client.query({
                query: gql`
                mutation {
                  checkDeliveredOrder(${gqlBuilder.buildArgs({
                    name: this._doNo,
                    patch: { remark: e.detail.value }
                  })}) {
                    name
                  }
                }
              `
              })

              if (!response.errors) {
                navigate('delivery_orders')
                this._showToast({ message: i18next.t('text.delivery_order_completed') })
              }
            } catch (e) {
              this._showToast(e)
            }
          }}"
        ></popup-note>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.completed_delivery_order')
      }
    )
    popup.onclosed
  }

  _editDeliveryNote() {
    openPopup(
      html`
        <delivery-note-popup
          .contactPoints="${this._customerContactPoints}"
          .ownCollection="${this._ownCollection}"
          .doNo="${this._doNo}"
          @delivery-dispatched="${() => {
            this.pageReset()
          }}"
        ></delivery-note-popup>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.edit_delivery_note')
      }
    )
  }

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.READY_TO_DISPATCH.value) {
      this._actions = [
        {
          title: i18next.t('button.edit'),
          action: this._editDeliveryNote.bind(this)
        }
      ]
    } else if (this._status === ORDER_STATUS.DELIVERING.value) {
      this._actions = [
        {
          title: i18next.t('button.complete'),
          action: this._checkDeliveredOrder.bind(this)
        }
      ]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
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

window.customElements.define('print-delivery-note', PrintDeliveryOrder)
