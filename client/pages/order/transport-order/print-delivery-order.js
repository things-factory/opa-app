import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, gqlBuilder } from '@things-factory/shell'
import { css, html } from 'lit-element'
import gql from 'graphql-tag'

class PrintDeliveryOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _releaseOrderId: String,
      _releaseOrderName: String,
      _doNo: String,
      _driverName: String,
      _truckNo: String,
      _date: Date,
      _orderInventories: Object
    }
  }

  constructor() {
    super()
    this._releaseOrderId = ''
    this._driverName = ''
    this._truckNo = ''
    this._date = ''
    this._orderInventories = {}
    this._releaseOrderName = ''
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

        [goods-delivery-order] {
          overflow: scroll;
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

        [title] {
          text-align: center;
          font-weight: bold;
        }

        [brief] {
          display: grid;
          grid-template-columns: 4fr 1fr;
        }

        [brief] > div {
          display: grid;
          grid-template-columns: 1fr 10fr;
          grid-gap: 1px;
        }

        [brief] > div[right] {
          grid-template-columns: 5fr 8fr;
          grid-auto-rows: 30px 30px 30px;
        }

        [brief] > div[left] {
          grid-template-columns: 1fr;
          padding-left: 0;
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

        [business_verification] {
          flex: 1;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        [verification] {
          text-align: center;
        }

        [customer_confirmation] {
          flex: 1;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        table [product-table] td {
          padding-top: 10px;
          padding-bottom: 10px;
        }

        table {
          width: 100%;
          height: 100%;
          border: 1px solid black;
          border-spacing: 0;
        }

        th {
          background-color: #f0f0f0;
          text-transform: capitalize;
        }

        th,
        td {
          border: 1px solid black;
        }

        td {
          padding-left: 15px;
          align: left;
        }

        em {
          font-weight: bold;
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
          width: 15px;
          text-align: center;
        }

        @media print {
          :host {
            font-size: 0.6em;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
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
      title: i18next.t('title.goods_delivery_order_details'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ],
      printable: {
        accept: ['preview'],
        content: this
      }
    }
  }

  render() {
    var company = 'KIMEDA SDN. BHD.'
    var brn = '31810-W'
    var address = 'Lot 541, 7 3/4 Miles, Jalan Kapar, 42200 Kapar, Klang'
    var contact = '012-6059803 & 016-3320078'
    var email = 'support@kimeda.com'

    var customer = 'HATIO SEA SDN. BHD.'

    var doNo = this._doNo
    var refNo = this._releaseOrderName
    this._date = new Date()

    var date =
      this._date
        .getDate()
        .toString()
        .padStart(2, '0') +
      '/' +
      (this._date.getMonth() + 1).toString().padStart(2, '0') +
      '/' +
      this._date.getFullYear()

    var driverName = this._driverName
    var truckNo = this._truckNo

    return html`
      <div goods-delivery-order>
        <div business-info>
          <h2 business-name>${company}</h2>
          <span business-brn>(${brn})</span>
        </div>

        <h1 title>GOODS DELIVERY ORDER</h1>

        <div brief>
          <div left>
            <label>M/s</label>${customer}
            <label><strong>To be delivered to/collected by:</strong></label>
            <div customer>&nbsp;</div>
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
                <th>Packing Type</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(this._orderInventories || {}).map((key, index) => {
                let sku = this._orderInventories[key]
                return html`
                  <tr>
                    <td idx style="padding:10px;">${index + 1}</td>
                    <td>${sku.inventory.product.name}</td>
                    <td>${sku.inventory.product.description}</td>
                    <td>${sku.inventory.packingType}</td>
                    <td>${sku.releaseQty}</td>
                  </tr>
                `
              })}
            </tbody>
          </table>
        </div>

        <div business_verification>
          <label>Verification by ${company}</label>
          <table verification>
            <thead>
              <tr>
                <th width="15%">Issued By</th>
                <th width="15%">Loaded By</th>
                <th width="15%">Checked By</th>
                <th width="15%">Truck Number</th>
                <th width="40%">Driver's Signature</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td style="padding-top:50px; padding-bottom:5px;">
                  <span><hr width="85%"/></span>${driverName}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div customer_confirmation>
          <label>Confirmation by ${customer}</label>
          <table>
            <tr>
              <td width="65%" rowspan="2" style="padding-top:5px; padding-bottom:200px;">
                <em>
                  Please examine the goods before acceptance as we will not be responsible for any damage or defect
                  after delivery. Goods once accepted are not returnable.
                </em>
                <br /><br />[REMARK]:
              </td>
              <td style="padding-top:90px; padding-bottom:5px;"><hr width="75%" /></td>
            </tr>
            <tr>
              <td width="35%" style="text-align:center; padding-top:90px; padding-bottom:5px;">
                Please sign & stamp here in receipt
              </td>
            </tr>
            <tr>
              <td colspan="2">[Customer DO No./PO No.]:</td>
            </tr>
          </table>
        </div>
      </div>
    `
  }

  async pageUpdated(changes) {
    if (this.active) {
      this._doNo = changes.resourceId || this._doNo || ''
      this._fetchDeliveryOrder()
    }
  }

  async _fetchDeliveryOrder(doNo) {
    const response = await client.query({
      query: gql`
        query {
          deliveryOrder(${gqlBuilder.buildArgs({
            name: this._doNo
          })}) {
            id
            name
            releaseGood {
              id
              name
            }
            transportOrderDetails {
              id
              name
              description
              transportDriver {
                id
                name
              }
              transportVehicle {
                id
                name
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      const _deliveryOrder = response.data.deliveryOrder
      this._releaseOrderId = _deliveryOrder.releaseGood.id
      this._releaseOrderName = _deliveryOrder.releaseGood.name

      const _transportOrderDetails = _deliveryOrder.transportOrderDetails
      this._driverName = _transportOrderDetails[0].transportDriver.name
      this._truckNo = _transportOrderDetails[0].transportVehicle.name
      this._orderInventories = { ...(await this._fetchOrderInventories(this._releaseOrderId)) }
    }
  }

  async _fetchOrderInventories(releaseGoodsId) {
    const filters = [
      {
        name: 'releaseGood',
        operator: 'eq',
        value: releaseGoodsId
      }
    ]

    const response = await client.query({
      query: gql`
        query {
          orderInventories(${gqlBuilder.buildArgs({
            filters
          })}) {
            items {
              id
              name
              description
              inventory {
                id
                name
                batchId
                packingType
                product {
                  id
                  name
                  description
                }
              }
              releaseQty
            }
            total
          }
        }
      `
    })

    return response.data.orderInventories.items
  }
}

window.customElements.define('print-delivery-order', PrintDeliveryOrder)
