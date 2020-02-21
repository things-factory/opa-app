import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, gqlBuilder } from '@things-factory/shell'
import { css, html } from 'lit-element'
import gql from 'graphql-tag'
import '@things-factory/attachment-ui/client/components/file-selector'
import '@things-factory/image-uploader-ui/client/image-upload-previewer'
import { WORKSHEET_TYPE } from '../../inbound/constants/worksheet'

class ReceivedNoteDetail extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _grnNo: String,
      _files: Array,
      _products: Array,
      _customer: Object,
      _bizplace: Object,
      _arrivalNotice: Object,
      _businessContactPoints: Object,
      _customerContactPoints: Object,
      _grnName: String,
      _refNo: String,
      _remark: String,
      _date: Date
    }
  }

  constructor() {
    super()
    this._files = []
    this._products = []
    this._customer = {}
    this._bizplace = {}
    this._arrivalNotice = {}
    this._businessContactPoints = {}
    this._customerContactPoints = {}
    this._grnName = ''
    this._refNo = ''
    this._remark = ''
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

        [goods-received-note] {
          overflow: scroll;
        }

        /* Hide scrollbar for Chrome, Safari and Opera*/
        [goods-received-note]::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE and Edge */
        [goods-received-note] {
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

        [business-address] {
          white-space: pre-line;
        }

        [business-info] [address] {
          white-space: normal;
        }

        [title] {
          text-align: center;
          font-weight: bold;
          text-transform: uppercase;
        }

        [brief] {
          display: grid;
          grid-template-columns: 3fr 2fr;
        }

        [brief] > div {
          display: grid;
          grid-gap: 1px;
        }

        [brief] > div[right] {
          grid-template-columns: 3fr 5fr;
          grid-auto-rows: 25px 25px 25px;
        }

        [brief] > div[right] > label {
          padding-left: 50px;
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

        [customer-address] {
          padding-right: 10px;
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

        [name] {
          text-transform: capitalize;
        }

        table {
          width: 100%;
          height: 100%;
          border-spacing: 0;
          border-collapse: collapse;
          margin-top: 20px;
          margin-bottom: 20px;
        }

        th {
          background-color: #f0f0f0;
          text-transform: capitalize;
        }

        table,
        th,
        td {
          border: 1px solid #ddd;
        }

        td {
          padding: 5px;
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
          border-bottom: 1px solid #ddd;
        }

        #signature {
          mix-blend-mode: multiply;
          filter: contrast(200%);
          position: relative;
        }

        [signature] > image-upload-previewer {
          vertical-align: middle;
          mix-blend-mode: multiply;
          display: block;
          margin-left: auto;
          margin-right: auto;
          overflow: auto;
          height: 120px;
        }

        [goods-received-note] [agreement] > file-selector {
          grid-column: span 6;
          font: var(--card-list-create-input-font);
          border: none;
          box-sizing: border-box;
          padding: 0;
        }

        #thumbnail-area {
          grid-column: span 10;
          align-self: stretch;
          text-align: center;
          overflow: hidden;
          overflow-x: auto;
          white-space: nowrap;
          overflow: visible;
        }

        image-upload-previewer {
          display: inline-block;
          height: 100%;
        }

        [notice] {
          text-transform: capitalize;
        }

        [date] {
          text-transform: capitalize;
        }

        [desc] {
          font-style: italic;
          text-transform: capitalize;
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

        [pallet-quantity] {
          text-align: right;
        }

        [idx] {
          width: 15px;
          text-align: center;
        }

        #signee_name,
        #signed_date {
          font-size: 1em;
          font-family: 'Times New Roman', Times;
          border: none;
          width: 80%;
        }

        @media print {
          :host {
            font-size: 0.8em;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          file-selector,
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
      title: i18next.t('title.goods_received_note_details'),
      printable: {
        accept: ['preview'],
        content: this
      }
    }
  }

  render() {
    var company = this._bizplace.name || ''
    var brn = `(${this._bizplace.description})` || ''
    var address = this._bizplace.address || ''
    var contact = this._businessContactPoints.phone || ''
    var email = this._businessContactPoints.email || ''

    var customerCompany = this._customer.name || ''
    var customerBrn = `(${this._customer.description})` || ''
    var customerAddress = this._customer.address || ''
    var customerContact =
      'Phone: ' + (this._customerContactPoints.phone || '-') + ' | Fax: ' + (this._customerContactPoints.fax || '-')
    var customerEmail = 'Email: ' + (this._customerContactPoints.email || '-')

    var grnName = this._grnName || ''
    var refNo = this._refNo || '-'
    var date = this._date || ''
    var totalPallet = 0

    var footer = i18next.t('text.please_write_down_full_name_clearly')

    return html`
      <div goods-received-note>
        <div business-info>
          <h2 business-name>${company}</h2>
          <span business-brn>${brn}</span>
          <div business-address>${address}</div>
          <div business-contact>${contact}</div>
          <div business-email>${email}</div>
        </div>

        <h1 title>${i18next.t('title.goods_received_note')}</h1>

        <div brief>
          <div left>
            <label>${i18next.t('label.to')}:</label>
            <div customer>
              <div customer-company><b>${customerCompany}</b> <small customer-brn>${customerBrn}</small></div>
              <div customer-address>${customerAddress}</div>
              <div customer-contact>${customerContact}</div>
              <div customer-email>${customerEmail}</div>
            </div>
          </div>

          <div right>
            <label>${i18next.t('label.grn_no')} : </label><b>${grnName}</b>
            <label>${i18next.t('label.ref_no')} : </label><b>${refNo}</b> <label>${i18next.t('label.date')} : </label
            ><b>${date}</b>
          </div>
        </div>

        <div detail>
          <table product>
            <thead>
              <tr>
                <th idx>#</th>
                <th>${i18next.t('label.batch_id')}</th>
                <th>${i18next.t('label.product')}</th>
                <th>${i18next.t('label.qty')}</th>
                <th>${i18next.t('label.total_weight')}</th>
                <th>${i18next.t('label.remark')}</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(this._products || {}).map((key, index) => {
                let product = this._products[key]
                totalPallet += 1
                return html`
                  <tr>
                    <td idx>${index + 1}</td>
                    <td>${product.batchId}</td>
                    <td>${product.name} (${product.description})</td>
                    <td>${product.packQty} ${product.packingType}</td>
                    <td>${product.totalWeight}</td>
                    <td>${product.issue}</td>
                  </tr>
                `
              })}
              <tr>
                <td colspan="5" pallet-quantity><strong>Total Pallet</strong></td>
                <td>${totalPallet}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div agreement>
          <div business-side>
            <div notice>${i18next.t('text.goods_received_in_good_order_condition')}</div>
            <div signature id="thumbnail-area">
              ${this._files.map(
                file => html`
                  <image-upload-previewer id="signature" .file=${file}></image-upload-previewer>
                `
              )}
            </div>
            <file-selector
              name="file"
              label="${i18next.t('label.select_file')}"
              accept="${this._currentCategory || '*'}/*"
              multiple
              @file-change=${e => {
                this._files = Array.from(e.detail.files)
              }}
            ></file-selector>
            <div desc>${i18next.t('text.official_stamp_signature')}</div>
            <div name>
              ${i18next.t('label.name')}:
              <input id="signee_name" />
            </div>
            <div date>
              ${i18next.t('label.date')}:
              <input id="signed_date" />
            </div>
          </div>
        </div>

        <h5 footer>** ${footer} **</h5>
      </div>
    `
  }

  async pageInitialized() {
    this._businessContactPoints = { ...(await this._fetchBusinessContact()) }
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
              address
            }
            arrivalNotice {
              id
              name
              description
              refNo
              remark
            }
            createdAt
          }
        }
      `
    })

    if (!response.errors) {
      const goodsReceivalNote = response.data.goodsReceivalNote
      this._customer = goodsReceivalNote.bizplace
      this._arrivalNotice = goodsReceivalNote.arrivalNotice
      this._grnName = goodsReceivalNote.name
      this._refNo = goodsReceivalNote.arrivalNotice.refNo
      this._remark = goodsReceivalNote.arrivalNotice.remark
      const date = goodsReceivalNote.createdAt
      this._date = new Date(parseInt(date))
      this._date = new Date(this._date).toUTCString()
      this._date = this._date
        .split(' ')
        .slice(1, 4)
        .join(' ')

      await this._fetchWorksheet()
      await this._fetchCustomerContact()
    }
  }

  async _fetchWorksheet() {
    const filters = [
      {
        name: 'arrivalNotice',
        operator: 'eq',
        value: this._arrivalNotice.id
      },
      {
        name: 'type',
        operator: 'eq',
        value: WORKSHEET_TYPE.UNLOADING.value
      }
    ]

    const response = await client.query({
      query: gql`
        query {
          worksheets(${gqlBuilder.buildArgs({
            filters
          })}) {
            items {
              id
              name
              worksheetDetails {
                id
                issue
                targetProduct {
                  id
                  batchId
                  product {
                    id
                    name
                    description
                  }
                  packingType
                  packQty
                  unit
                  totalWeight
                }
              }
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      const _worksheet = response.data.worksheets.items[0]
      this._products = _worksheet.worksheetDetails.map(worksheetDetail => {
        const _product = worksheetDetail.targetProduct
        return {
          name: _product.product.name,
          description: _product.product.description,
          batchId: _product.batchId,
          packingType: _product.packingType,
          packQty: _product.packQty,
          totalWeight: _product.totalWeight,
          issue: worksheetDetail.issue || '-'
        }
      })
    }
  }

  async _fetchBusinessBizplace() {
    const name = ''
    const response = await client.query({
      query: gql`
        query {
          businessBizplace(${gqlBuilder.buildArgs({
            name: name
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
    const filters = [
      {
        name: 'bizplace',
        operator: 'eq',
        value: this._customer.id
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
      this._customerContactPoints = response.data.contactPoints.items[0] || []
    }
  }
}

window.customElements.define('received-note-detail', ReceivedNoteDetail)
