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
      _arrivalNotice: Object
    }
  }

  constructor() {
    super()
    this._products = []
    this._bizplace = {}
    this._arrivalNotice = {}
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
          text-align: right;
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
          grid-template-columns: 2fr 1fr;
        }

        [brief] > div {
          display: grid;
          grid-template-columns: 1fr 3fr;
          grid-gap: 10px;
        }

        [brief] > div[right] {
          grid-auto-rows: 20px 20px;
        }

        [customer-company],
        [dnno],
        [delivered-by] {
          font-size: 1.2em;
          font-weight: bold;
          text-transform: capitalize;
        }

        [dnno] {
          font-size: 2em;
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

        @media print {
          :host {
            font-size: 0.6em;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.gan_view'),
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
    var customerPhone = '603-5191-2911'
    var customerFax = '603-5192-5811'
    var customerEmail = 'public@chem.com.my'

    var deliveredBy = 'container'
    var dnNo = '082433'
    var date = '02/10/2019'

    var footer = i18next.t('text.please_write_down_full_name_clearly')

    return html`
      <div business-info>
        <h2 business-name>${company}</h2>
        <span business-brn>(${brn})</span>
        <div business-address>${address}</div>
        <div business-contact>${contact}</div>
        <div business-email>${email}</div>
      </div>

      <h1 title>GOODS RECEIVAL NOTE</h1>

      <div brief>
        <div left>
          <label>to : </label>
          <div customer>
            <div customer-company>${customerCompany}</div>
            <span customer-brn>(${customerBrn})</span>
            <div customer-address>${customerAddress}</div>
            <div customer-contact>${customerPhone}</div>
            <div customer-contact>${customerFax}</div>
            <div customer-email>${customerEmail}</div>
          </div>

          <label>delivered by : </label>
          <span delivered-by>${deliveredBy}</span>
        </div>

        <div right>
          <label>GRN No. : </label>
          <span dnno>${dnNo}</span>

          <label>Date : </label>
          <span>${date}</span>
        </div>
      </div>

      <div detail>
        <table product>
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Product</th>
              <th>Pallet ID</th>
              <th>Quantity</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(this._products || {}).map(key => {
              let product = this._products[key]
              return html`
                <tr>
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

      <h4 footer>** ${footer} **</h4>
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
            }
          }
        }
      `
    })

    if (!response.errors) {
      const goodsReceivalNote = response.data.goodsReceivalNote
      this._bizplace = goodsReceivalNote.bizplace
      this._arrivalNotice = goodsReceivalNote.arrivalNotice

      await this._fetchOrderProducts()
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
      console.log(this._products)
    }
  }
}

window.customElements.define('receival-note-detail', ReceivalNoteDetail)
