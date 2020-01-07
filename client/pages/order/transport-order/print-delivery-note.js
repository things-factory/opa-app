import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, gqlBuilder, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../components/popup-note'
import { ORDER_STATUS } from '../constants/order'

class PrintDeliveryOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _releaseOrderName: String,
      _doNo: String,
      _driverName: String,
      _driver: String,
      _truckNo: String,
      _status: String,
      _date: Date,
      _orderInventories: Object,
      _bizplace: Object,
      _driverList: Object,
      _customerId: String,
      _customerName: String,
      _workerName: String,
      _recipient: String,
      _customerContactPoints: Array,
      _companyCP: Object
    }
  }

  constructor() {
    super()
    this._workerName = ''
    this._truckNo = ''
    this._releaseOrderName = ''
    this._customerName = ''
    this._date = ''
    this._status = ''
    this._companyCP = {}
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
    var company = this._company && this._company.name ? this._company.name.toUpperCase() : ''
    var brn = this._company && this._company.description ? `(${this._company.description})` : ''
    var companyAddress = this._company && this._company.address ? this._company.address : ''
    var phonefax = this._companyCP && this._companyCP.phone ? this._companyCP.phone : ''
    var email = this._companyCP && this._companyCP.email ? this._companyCP.email : ''

    var customer = this._customerName.toUpperCase()
    var totalPallet = 0
    var doNo = this._doNo || ''
    var refNo = this._releaseOrderName || ''
    var date = this._date || ''
    var workerName = this._workerName || ''
    var driverName = this._driverName
    var truckNo = this._truckNo || ''

    var address = this._recipient ? this._recipient.split(',') : ''

    return html`
      <div goods-delivery-note>
        <div business-info>
          <h2 business-name>${company}</h2>
          <span business-brn>${brn}</span>
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
              <address>
              ${(address || []).map(
                (part, index) => 
                index == 0 ? 
                  html`
                    ${part} <br />
                  `
                  : 
                  index == (address.length - 1) ?
                    html`
                      ${part}. <br />
                    `
                    :
                    html`
                      ${part}, <br />
                    `
              )}
              </address>
              <br />
              <select
                id="receipient_address"
                name="receipient"
                @change="${e => (this._recipient = e.currentTarget.value)}"
                ?hidden="${this._status !== ORDER_STATUS.READY_TO_DISPATCH.value}"
              >
              <option value="">-- ${i18next.t('text.please_select_destination')} --</option>
              ${(this._customerContactPoints || []).map( contactPoint => {
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
            <input
              id="date"
              name="deliveryDate"
              type="date"
              min="${this._getStdDate()}"
              @input="${e => (this._date = e.currentTarget.value)}"
              ?hidden="${this._status !== ORDER_STATUS.READY_TO_DISPATCH.value}"
              required
            />
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
                  <select
                    @change=${e => (this._driverName = e.target.value)}
                    id="driver_name"
                    ?hidden="${this._status !== ORDER_STATUS.READY_TO_DISPATCH.value}"
                  >
                    <option value="">-- ${i18next.t('text.please_select_a_driver')} --</option>

                    ${Object.keys(this._driverList.data.transportDrivers.items || []).map(key => {
                      let driver = this._driverList.data.transportDrivers.items[key]
                      return html`
                        <option value="${driver.name}">${driver.name}-${driver.driverCode}</option>
                      `
                    })}
                  </select>
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

  async pageInitialized() {
    this._company = { ...(await this._fetchBusinessBizplace()) }
    this._companyCP = { ...(await this._fetchBusinessContact()) }

  }

  async pageUpdated(changes) {
    if (this.active) {
      this._doNo = changes.resourceId || this._doNo || ''
      this._driverList = { ...(await this._fetchTruckDriver()) }
      await this._fetchDeliveryOrder(this._doNo)
      this._updateContext()
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
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
    const filters = [
      {
        name: 'bizplace',
        operator: 'eq',
        value: this._company.id
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
        return response.data.contactPoints.items.map( ccp => {
          return {
            ...ccp,
            name: `${ccp.name},`
          }
        })
      }
    }
  }

  async _fetchTruckDriver() {
    return await client.query({
      query: gql`
        query {
          transportDrivers (${gqlBuilder.buildArgs({
            filters: [],
            pagination: { page: 1, limit: 9999 }
          })}){
            items{
              id
              name
              driverCode
            }
          }
        }`
    })
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
            to
            deliveryDate
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
            status
          }
        }
      `
    })

    if (!response.errors) {
      const _deliveryOrder = response.data.deliveryOrder || ''
      const _releaseOrderId = _deliveryOrder.releaseGood.id || ''
      this._releaseOrderName = _deliveryOrder.releaseGood.name
      this._truckNo = _deliveryOrder.transportVehicle.regNumber
      this._status = _deliveryOrder.status || ''

      const _driver = _deliveryOrder.transportDriver || ''
      this._driverName = _driver && _driver.name ? _driver.name : ''
      this._recipient = _deliveryOrder.to || ''
      this._date = _deliveryOrder.deliveryDate || ''

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
        this._customerContactPoints = await this._fetchCustomerContact()
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

  async _executeDeliveryOrder() {
    try {
      this._validateInput()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.dispatch_delivery_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      let args = {
        orderInfo: {
          name: this._doNo,
          to: this._recipient,
          deliveryDate: this._date,
          driverName: this._driverName
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
        navigate('delivery_orders')
        this._showToast({ message: i18next.t('text.delivery_order_dispatched') })
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

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.READY_TO_DISPATCH.value) {
      this._actions = [
        {
          title: i18next.t('button.dispatch'),
          action: this._executeDeliveryOrder.bind(this)
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

  _validateInput() {
    // incomplete input
    if (!this._recipient || !this._date) throw new Error(i18next.t('text.delivery_note_is_incomplete'))
  }
}

window.customElements.define('print-delivery-note', PrintDeliveryOrder)
