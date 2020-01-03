import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, gqlBuilder } from '@things-factory/shell'
import { css, html } from 'lit-element'
import gql from 'graphql-tag'

class PrintDeliveryOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _releaseOrderName: String,
      _doNo: String,
      _driverName: String,
      _truckNo: String,
      _date: Date,
      _orderInventories: Object,
      _bizplace: Object,
      _customerId: String,
      _customerName: String,
      _workerName: String,
      _receipient: String,
      _customerContactPoints: Array
    }
  }

  constructor() {
    super()
    this._workerName = ''
    this._driverName = ''
    this._truckNo = ''
    this._releaseOrderName = ''
    this._customerName = ''
    this._date = ''
    this._customerContactPoints = []
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
        }

        [brief] > div[right] {
          grid-template-columns: 5fr 8fr;
          grid-auto-rows: 25px 25px 25px;
        }

        [brief] > div[left] {
          grid-template-columns: 1fr;
          grid-auto-rows: 25px 25px 25px;
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

        [verification_head] > th:nth-child(-n + 4) {
          text-align: center;
          width: 15%;
        }

        [verification_body] > td:nth-child(-n + 5) {
          text-align: center;
          max-height: 100px;
          padding: 93px 0px 7px;
        }

        [confirmation_head] > td:nth-child(1) {
          text-align: justify;
          text-justify: inter-word;
          width: 65%;
          padding: 10px 10px 200px;
        }

        [confirmation_head] > td:nth-child(2) {
          text-align: center;
          width: 35%;
          max-height: 100px;
          padding: 90px 0px 0px;
        }

        [confirmation_body] > td:nth-child(1) {
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
    var company = this._bizplace.name || ''
    var brn = `(${this._bizplace.description})` || ''
    var customer = this._customerName.toUpperCase()
    var address = ''
    var totalPallet = 0
    var doNo = this._doNo
    var refNo = this._releaseOrderName
    var date = this._date
    var workerName = this._workerName
    var driverName = this._driverName
    var truckNo = this._truckNo

    return html`
      <div goods-delivery-note>
        <div business-info>
          <h2 business-name>${company}</h2>
          <span business-brn>${brn}</span>
        </div>

        <h1 title>GOODS DELIVERY NOTE</h1>

        <div brief>
          <div left>
            <span>M/s <i>${customer}</i></span>
            <label><strong>To be delivered to/collected by:</strong></label>
            <div customer>
              <span>${this._receipient}</span>
              <select id="receipient_address" @change="${e => this._receipient = e.currentTarget.value}">
                <option value="">-- ${i18next.t('text.please_select')} --</option>
                ${Object.keys(this._customerContactPoints || {}).map((key, index) => {
                  let contactPoint = this._customerContactPoints[key]
                  return html`
                  <option value="${contactPoint && contactPoint.name} ${contactPoint && contactPoint.address}"
                  >${contactPoint && contactPoint.name}
                  ${contactPoint && contactPoint.address ? ` ${contactPoint && contactPoint.address}` : ''}</option
                >
                  `
                })}
              </select>
            </div>
          </div>

          <div right>
            <label>DO No. : </label><b>${doNo}</b>

            <label>Reference No. : </label><b>${refNo}</b>

            <label>Date : </label>${date}
            <input id="date" name="deliveryDate" type="date" min="${this._getStdDate()}" @input="${e => this._date=e.currentTarget.value}" required />
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
                totalPallet += sku.palletQty
                return html`
                  <tr>
                    <td idx>${index + 1}</td>
                    <td>${sku.inventory.product.name}</td>
                    <td>${sku.inventory.product.description}</td>
                    <td>${sku.inventory.batchId}</td>
                    <td>${sku.releaseQty} ${sku.inventory.packingType}</td>
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
              <tr verification_head>
                <th>Issued By</th>
                <th>Loaded By</th>
                <th>Checked By</th>
                <th>Truck Number</th>
                <th>Driver's Signature</th>
              </tr>
            </thead>
            <tbody>
              <tr verification_body>
                <td></td>
                <td>${workerName}</td>
                <td></td>
                <td>${truckNo}</td>
                <td>
                  <span><hr width="85%"/></span>${driverName}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div customer-confirmation>
          <label>Confirmation by ${customer}</label>
          <table confirmation_table>
            <tr confirmation_head>
              <td rowspan="2">
                <em>
                  Please examine the goods before acceptance as we will not be responsible for any damage or defect
                  after delivery. Goods once accepted are not returnable.
                </em>
                <br /><br />[REMARK]:
              </td>
              <td><hr /></td>
            </tr>
            <tr confirmation_body>
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

  async pageInitialized() {
    this._bizplace = { ...(await this._fetchBusinessBizplace()) }
  }

  async pageUpdated(changes) {
    if (this.active) {
      this._doNo = changes.resourceId || this._doNo || ''
      await this._fetchDeliveryOrder(this._doNo)
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  get _deliveryDate() {
    return this.shadowRoot.querySelector('input[name=deliveryDate]')
  }

  async _fetchBusinessBizplace() {
    const name = ''
    const response = await client.query({
      query: gql`
        query {
          businessBizplace(${gqlBuilder.buildArgs({
            name
          })}) {
            id
            name
            description
            address
          }
        }
      `
    })

    return response.data.businessBizplace
  }

  async _fetchBusinessContact() {
    this._bizplace = { ...(await this._fetchBusinessBizplace()) }
    const filters = [
      {
        name: 'bizplace',
        operator: 'eq',
        value: this._bizplace.id
      }
    ]

    const response = await client.query({
      query: gql`
        query {
          contactPoints(${gqlBuilder.buildArgs({
            filters
          })}) {
            items {
              id
              name
              bizplace {
                id
                name
              }
              description
              email
              phone
              fax
            }
            total
          }
        }
      `
    })

    return response.data.contactPoints.items[0] || []
  }

  async _fetchCustomerContact() {
    if (this._customerId) {
      const filters = [
        {
          name: 'bizplace',
          operator: 'eq',
          value: this._customerId
        }
      ]

      const response = await client.query({
        query: gql`
        query {
          contactPoints(${gqlBuilder.buildArgs({
            filters
          })}) {
            items {
              id
              name
              bizplace {
                id
                name
              }
              address
              description
              email
              phone
              fax
            }
            total
          }
        }
      `
      })

      if (!response.errors) {
        return response.data.contactPoints.items || []
      }
    }
  }

  async _fetchDeliveryOrder(name) {
    const response = await client.query({
      query: gql`
        query {
          deliveryOrder(${gqlBuilder.buildArgs({
            name
          })}) {
            id
            name
            releaseGood {
              id
              name
            }
            bizplace {
              id
              name
            }
            transportVehicle {
              regNumber
            }
            transportDriver {
              name
            }
          }
        }
      `
    })

    if (!response.errors) {
      const _deliveryOrder = response.data.deliveryOrder
      const _releaseOrderId = _deliveryOrder.releaseGood.id
      this._releaseOrderName = _deliveryOrder.releaseGood.name
      this._truckNo = _deliveryOrder.transportVehicle.regNumber
      this._driverName = _deliveryOrder.transportDriver.name

      if (_releaseOrderId) {
        let orderInventories = await this._fetchOrderInventories(_releaseOrderId)

        if (orderInventories.length > 0) {
          orderInventories = await Promise.all(
            orderInventories.map(async orderInventory => {
              const worksheetDetails = await this._fetchWorksheetDetail(orderInventory.id)
              orderInventory.palletQty = worksheetDetails.total
              if (worksheetDetails && worksheetDetails.items[0].updater)
                this._workerName = worksheetDetails.items[0].updater.name
              return orderInventory
            })
          )
          this._orderInventories = orderInventories 
        }
      }

      const _bizplace = _deliveryOrder.bizplace
      if (_bizplace) {
        this._customerId = _bizplace.id
        this._customerName = _bizplace.name
        this._customerContactPoints = { ...(await this._fetchCustomerContact()) }
      }
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

  async _fetchWorksheetDetail(orderInventoryId) {
    const filters = [
      {
        name: 'targetInventory',
        operator: 'eq',
        value: orderInventoryId
      },
      {
        name: 'type',
        operator: 'eq',
        value: 'LOADING'
      }
    ]

    const response = await client.query({
      query: gql`
        query {
          worksheetDetails(${gqlBuilder.buildArgs({
            filters
          })}) {
            items {
              updater {
                id
                name
              }
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.worksheetDetails || {}
    }
  }
}

window.customElements.define('print-delivery-note', PrintDeliveryOrder)
