import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, gqlBuilder } from '@things-factory/shell'
import { css, html } from 'lit-element'
import gql from 'graphql-tag'

class ReceivalNoteDetail extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _grnNo: String,
      _products: Array,
      _bizplace: Object,
      _arrivalNotice: Object,
      _contactPoints: Object,
      _grnName: String,
      _refNo: String,
      _date: Date
    }
  }

  constructor() {
    super()
    this._products = []
    this._bizplace = {}
    this._arrivalNotice = {}
    this._contactPoints = {}
    this._grnName = ''
    this._refNo = ''
    this._date = ''
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

        label {
          text-transform: capitalize;
          text-align: left;
        }

        [goods-receival-note] {
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
          grid-template-columns: 1fr 15fr;
          padding-left: 0;
        }

        [customer-company],
        [grn-no],
        [delivered-by] {
          font-size: 1.2em;
          text-transform: uppercase;
        }

        [grn-no] {
          font-size: 1em;
          line-height: 0.5;
        }

        [detail] {
          flex: 1;
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
          padding: 15px;
          align: left;
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
      title: i18next.t('title.goods_receival_note_details'),
      printable: {
        accept: ['preview'],
        content: this
      }
    }
  }

  render() {
    var company = 'KIMEDA SDN BHD'
    var brn = '31810-W'
    var address = 'Lot 541, 7 3/4 Miles, Jalan Kapar, 42200 Kapar, Klang'
    var contact = '012-6059803 & 016-3320078'
    var email = 'support@kimeda.com'

    var customerCompany = this._bizplace.company.name
    var customerBrn = this._bizplace.company.brn
    var customerAddress = this._bizplace.company.address
    var customerContact = 'Phone: ' + this._contactPoints.phone + ' | Fax: ' + this._contactPoints.fax
    var customerEmail = 'Email: ' + this._contactPoints.email

    var deliveredBy = 'container'
    var grnName = this._grnName
    var refNo = this._refNo
    var date = this._date

    var footer = 'please write down full name clearly'

    return html`
      <div goods-receival-note>
        <div business-info>
          <h2 business-name>${company}</h2>
          <span business-brn>(${brn})</span>
          <div business-address>${address}</div>
          <div business-contact>${contact}</div>
          <div business-email>${email}</div>
        </div>

        <h1 title>GOODS RECEIVE NOTE</h1>

        <div brief>
          <div left>
            <label>to : </label>
            <div customer>
              <div customer-company><b>${customerCompany}</b> <small customer-brn>(${customerBrn})</small></div>
              <div customer-address>${customerAddress}</div>
              <div customer-contact>${customerContact}</div>
              <div customer-email>${customerEmail}</div>
            </div>
          </div>

          <div right>
            <label>GRN No. : </label><b>${grnName}</b>

            <label>Reference No. : </label><b>${refNo}</b>

            <label>Date : </label>${date}
          </div>
        </div>

        <div detail>
          <table product>
            <thead>
              <tr>
                <th idx>#</th>
                <th>Batch ID</th>
                <th>Product</th>
                <th>Pallet ID</th>
                <th>Quantity</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(this._products || {}).map((key, index) => {
                let product = this._products[key]
                return html`
                  <tr>
                    <td idx>${index + 1}</td>
                    <td>${product.batchId}</td>
                    <td>${product.product.name}</td>
                    <td>${product.packingType}</td>
                    <td>${product.packQty}</td>
                    <td>${product.remark}</td>
                  </tr>
                `
              })}
            </tbody>
          </table>
        </div>

        <div agreement>
          <div business-side>
            <div notice>Goods received in good order & condition</div>
            <div signature></div>
            <div desc>Official Stamp & Signature</div>
            <div name>Name:</div>
            <div date>Date:</div>
          </div>

          <div customer-side>
            <div>For <span customer-name>${customerCompany}</span></div>
            <div signature></div>
            <div desc>Authorized Signature</div>
          </div>
        </div>

        <h5 footer>** ${footer} **</h5>
      </div>
    `
  }

  async pageUpdated(changes) {
    if (this.active) {
      this._grnNo = changes.resourceId || this._grnNo || ''
      await this._fetchGRN(this._grnNo)
    }
  }

  async _fetchGRN(grnNo) {
    if (!grnNo) return
    const response = await client.query({
      query: gql`
        query {
          goodsReceivalNote(${gqlBuilder.buildArgs({
            name: grnNo
          })}) {
            id
            name
            description
            refNo
            bizplace {
              id
              name
              description
              company {
                id
                name
                address
                brn
              }
            }
            arrivalNotice {
              id
              name
              description
              refNo
            }
            createdAt
          }
        }
      `
    })

    if (!response.errors) {
      const goodsReceivalNote = response.data.goodsReceivalNote
      this._bizplace = goodsReceivalNote.bizplace
      this._arrivalNotice = goodsReceivalNote.arrivalNotice
      this._grnName = goodsReceivalNote.name
      this._refNo = goodsReceivalNote.arrivalNotice.refNo
      const date = goodsReceivalNote.createdAt
      this._date = new Date(parseInt(date))
      this._date = new Date(this._date).toUTCString()
      this._date = this._date
        .split(' ')
        .slice(1, 4)
        .join(' ')

      await this._fetchOrderProducts()
      await this._fetchContactPoints()
    }
  }

  async _fetchOrderProducts() {
    const filters = [
      {
        name: 'arrivalNotice',
        operator: 'eq',
        value: this._arrivalNotice.id
      }
    ]

    const response = await client.query({
      query: gql`
        query {
          orderProducts(${gqlBuilder.buildArgs({
            filters
          })}) {
            items {
              id
              batchId
              product {
                id
                name
              }
              packingType
              packQty
              remark
              bizplace {
                id
                name
                company {
                  id
                  name
                  address
                  brn
                }
              }
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      this._products = response.data.orderProducts.items || []
    }
  }
  async _fetchContactPoints() {
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

    if (!response.errors) {
      this._contactPoints = response.data.contactPoints.items[0] || []
    }
  }
}

window.customElements.define('receival-note-detail', ReceivalNoteDetail)
