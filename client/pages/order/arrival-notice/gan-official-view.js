import { i18next, localize } from '@things-factory/i18n-base'
import { PageView } from '@things-factory/shell'
import { css, html } from 'lit-element'

class GANOfficialView extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _ganNo: String
    }
  }

  static get styles() {
    return [
      css`
        :host {
          display: flex;
          flex-direction: column;
        }

        label {
          text-transform: capitalize;
          text-align: right;
        }

        [customer-info] {
        }

        [customer-name] {
          display: inline-block;
          font-weight: bold;
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

        [to-company],
        [dnno],
        [delivered-by] {
          font-size: 1.2em;
          font-weight: bold;
          text-transform: capitalize;
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
          background-color: lightgray;
        }

        th,
        td {
          border: 1px solid black;
        }

        [agreement] {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-gap: 100px;
        }

        [agreement] [customer-side] [customer-name] {
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
        }

        [supplier-side] [name],
        [supplier-side] [date] {
          margin-top: 10px;
          margin-bottom: 10px;
        }

        @media print {
          :host {
            font-size: 0.6em;
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
    var customerCompany = 'PUBLICHEM SDN BHD'
    var customerBrn = '811511-H'
    var customerAddress = '48-1,Jalan Putra Mahkota 7/6B,Putra Heights, Subang Jaya.'
    var customerContact = 'Tel: 603-5191-2911 Fax: 603-5192-5811'
    var customerEmail = 'public@chem.com.my'

    var toCompany = 'KIMEDA SDN BHD'
    var toAddress = 'Lot 541, 7 3/4 Miles, Jalan Kapar, 42200 Kapar, Klang'
    var attn = 'Sue/Fatin - warehouse Zone 1B'
    var tel = '012-6059803 & 016-3320078'
    var deliveredBy = 'container'
    var dnNo = '082433'
    var date = '02/10/2019'

    return html`
      <div customer-info>
        <h2 customer-name>${customerCompany}</h2>
        <span brn>(${customerBrn})</span>
        <div address>${customerAddress}</div>
        <div contact>${customerContact}</div>
        <div email>${customerEmail}</div>
      </div>

      <h1 title>DELIVERY NOTE</h1>

      <div brief>
        <div left>
          <label>to : </label>
          <div to>
            <div to-company>${toCompany}</div>
            <div to-address>${toAddress}</div>
          </div>

          <label>attn : </label>
          <span>${attn}</span>

          <label>tel : </label>
          <span>${tel}</span>

          <label>delivered by : </label>
          <span delivered-by>${deliveredBy}</span>
        </div>

        <div right>
          <label>D/N No. : </label>
          <span dnno>${dnNo}</span>

          <label>Date : </label>
          <span>${date}</span>
        </div>
      </div>

      <div detail>
        <table product>
          <thead>
            <tr>
              <th>item</th>
              <th>description</th>
              <th>packing</th>
              <th>quantity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div agreement>
        <div supplier-side>
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

      <h4 footer>** SILA TULIS NAMA PENUH DENGAN JELAS **</h4>
    `
  }

  pageInitialized() {}
}

window.customElements.define('gan-official-view', GANOfficialView)
