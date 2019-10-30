import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, gqlBuilder } from '@things-factory/shell'
import { css, html } from 'lit-element'
import gql from 'graphql-tag'

class DeliveryNoteDetail extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _grnNo: String,
      _products: Array,
      _bizplace: Object,
      _arrivalNotice: Object,
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
          grid-auto-rows: 20px 20px;
        }

        [customer-company],
        [grn-no],
        [delivered-by] {
          font-size: 1.2em;
          font-weight: bold;
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

        [business_verification] {
          flex: 1;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        [customer_confirmation] {
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
    var company = 'KIMEDA SDN. BHD.'
    var brn = '31810-W'
    var address = 'Lot 541, 7 3/4 Miles, Jalan Kapar, 42200 Kapar, Klang'
    var contact = '012-6059803 & 016-3320078'
    var email = 'support@kimeda.com'

    var customer = 'HATIO SEA SDN. BHD.'

    var deliveredBy = 'container'
    var grnName = this._grnName
    var refNo = this._refNo
    var date = this._date

    var footer = i18next.t('text.please_write_down_full_name_clearly')

    return html`
      <div goods-receival-note>
        <div business-info>
          <h2 business-name>${company}</h2>
        </div>

        <h1 title>GOODS DELIVERY NOTE</h1>

        <label>M/s</label>
        <div brief>
          <div left>
            <label>To be delivered to/collected by: </label>
            <div customer>&nbsp;</div>
          </div>

          <div right>
            <label>GRN No. : </label>
            <span grn-no>${grnName}</span>

            <label>Reference No. : </label>
            <span grn-no>${refNo}</span>

            <label>Date : </label>
            <span>30/10/2019</span>
          </div>
        </div>

        <div detail>
          <table product>
            <thead>
              <tr>
                <th idx>#</th>
                <th>SKU</th>
                <th>Description</th>
                <th>Packing Type</th>
                <th>Loose Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>the SKU-001</td>
                <td>any description here</td>
                <td>the packing type here</td>
                <td>the loose quantity here</td>
              </tr>
              <tr>
                <td>2</td>
                <td>the SKU-002</td>
                <td>any description here</td>
                <td>the packing type here</td>
                <td>the loose quantity here</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div business_verification>
          <label>Verification by ${company}</label>
          <table>
            <thead>
              <tr>
                <th>Issued By</th>
                <th>Loaded By</th>
                <th>Checked By</th>
                <th>Truck Number</th>
                <th>Driver's Signature</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div customer_confirmation>
          <label>Confirmation by ${customer}</label>
          <table>
            <tr width="70%">
              <td rowspan="2">
                Please examine the goods before acceptance as we will not be responsible for any damage or defect after
                delivery. Goods once accepted are not returnable.
              </td>
              <td></td>
            </tr>
            <tr width="30%">
              <td>Please sign & stamp here in receipt</td>
            </tr>
          </table>
        </div>
      </div>
    `
  }

  // async pageUpdated(changes) {
  //   if (this.active) {
  //     this._grnNo = changes.resourceId || this._grnNo || ''
  //     await this._fetchGRN(this._grnNo)
  //   }
  // }

  // async _fetchGRN(grnNo) {
  //   if (!grnNo) return
  //   const response = await client.query({
  //     query: gql`
  //       query {
  //         goodsReceivalNote(${gqlBuilder.buildArgs({
  //           name: grnNo
  //         })}) {
  //           id
  //           name
  //           description
  //           refNo
  //           bizplace {
  //             id
  //             name
  //             description
  //             company {
  //               id
  //               name
  //               address
  //               brn
  //             }
  //           }
  //           arrivalNotice {
  //             id
  //             name
  //             description
  //           }
  //           createdAt
  //         }
  //       }
  //     `
  //   })

  //   if (!response.errors) {
  //     const goodsReceivalNote = response.data.goodsReceivalNote
  //     this._bizplace = goodsReceivalNote.bizplace
  //     this._arrivalNotice = goodsReceivalNote.arrivalNotice
  //     this._grnName = goodsReceivalNote.name
  //     this._refNo = goodsReceivalNote.refNo
  //     const date = goodsReceivalNote.createdAt
  //     this._date = new Date(parseInt(date))
  //     this._date = new Date(this._date).toUTCString()
  //     this._date = this._date
  //       .split(' ')
  //       .slice(1, 4)
  //       .join(' ')

  //     await this._fetchOrderProducts()
  //   }
  // }

  // async _fetchOrderProducts() {
  //   const filters = [
  //     {
  //       name: 'arrivalNotice',
  //       operator: 'eq',
  //       value: this._arrivalNotice.id
  //     }
  //   ]

  //   const response = await client.query({
  //     query: gql`
  //       query {
  //         orderProducts(${gqlBuilder.buildArgs({
  //           filters
  //         })}) {
  //           items {
  //             id
  //             batchId
  //             product {
  //               id
  //               name
  //             }
  //             packingType
  //             packQty
  //             remark
  //             bizplace {
  //               id
  //               name
  //               company {
  //                 id
  //                 name
  //                 address
  //                 brn
  //               }
  //             }
  //           }
  //           total
  //         }
  //       }
  //     `
  //   })

  //   if (!response.errors) {
  //     this._products = response.data.orderProducts.items || []
  //   }
  // }
}

window.customElements.define('delivery-note-detail', DeliveryNoteDetail)
