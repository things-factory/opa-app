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

        [detail] {
          flex: 1;
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
        <h2>${customerCompany}</h2>
        <span brn>(${customerBrn})</span>
        <span address>${customerAddress}</span>
        <span contact>${customerContact}</span>
        <span email>${customerEmail}</span>
      </div>

      <h2>DELIVERY NOTE</h2>

      <div brief>
        <div to>
          <label>to</label>
          <span to-company>${toCompany}</span>
          <span to-address>${toAddress}</span>
        </div>
        <div attn>
          <label>attn</label>
          <span>${attn}</span>
        </div>
        <div tel>
          <label>tel</label>
          <span>${tel}</span>
        </div>
        <div delivered-by>
          <label>delivered by</label>
          <span>${deliveredBy}</span>
        </div>

        <div dn-no>
          <label>D/N No.</label>
          <span>${dnNo}</span>
        </div>
        <div date>
          <label>Date</label>
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
          <span notice>Goods received in good order & condition</span>
          <span signature></span>
          <span desc>Official Stamp & Signature</span>
          <label name>Name:</label>
          <label date>Date:</label>
        </div>

        <div customer-side>
          <label customer>For<span>${customerCompany}</span></label>
          <span signature></span>
          <span desc>Authorized Signature</span>
        </div>
      </div>

      <h2 footer>** SILA TULIS NAMA PENUH DENGAN JELAS **</h2>
    `
  }

  pageInitialized() {}
}

window.customElements.define('gan-official-view', GANOfficialView)
