import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../components/popup-note'
import '../../components/vas-relabel'
import { ORDER_STATUS } from '../constants/order'

class RejectedArrivalNotice extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _ganNo: String,
      _ownTransport: Boolean,
      _path: String,
      productGristConfig: Object,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object,
      _template: Object,
      _rejectReason: String
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
        }
        popup-note {
          flex: 1;
        }
        .container {
          display: flex;
          flex: 4;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
        .guide-container {
          max-width: 30vw;
          display: flex;
        }
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .grist h2 {
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }

        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }

        h2 + data-grist {
          padding-top: var(--grist-title-with-grid-padding);
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.rejected_arrival_notice_detail'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ]
    }
  }

  render() {
    return html`
      <popup-note
        .title="${i18next.t('title.rejection_reason')}"
        .value="${this._rejectReason}"
        .readonly="${true}"
      ></popup-note>
      <form name="arrivalNotice" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.gan_no')}: ${this._ganNo}</legend>
          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.container_no')}</label>
          <input name="containerNo" ?hidden="${this._ownTransport}" readonly />

          <label>${i18next.t('label.do_no')}</label>
          <input name="deliveryOrderNo" readonly />

          <label>${i18next.t('label.eta_date')}</label>
          <input name="etaDate" type="date" readonly />

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            @change="${e => (this._ownTransport = e.currentTarget.checked)}"
            disabled
          />
          <label>${i18next.t('label.own_transport')}</label>

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
          <input ?hidden="${!this._ownTransport}" name="truckNo" readonly />
        </fieldset>

        <label>${i18next.t('label.status')}</label>
        <select name="status" disabled
          >${Object.keys(ORDER_STATUS).map(key => {
            const status = ORDER_STATUS[key]
            return html`
              <option value="${status.value}">${i18next.t(`label.${status.name}`)}</option>
            `
          })}</select
        >
      </form>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

          <data-grist
            id="product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.productGristConfig}
            .data="${this.productData}"
          ></data-grist>
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

          <data-grist
            id="vas-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.vasGristConfig}
            .data="${this.vasData}"
          ></data-grist>
        </div>

        <div class="guide-container">
          ${this._template}
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.productData = { records: [] }
    this.vasData = { records: [] }
    this._importedOrder = false
    this._ownTransport = true
    this._path = ''
  }

  get arrivalNoticeForm() {
    return this.shadowRoot.querySelector('form[name=arrivalNotice]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  pageInitialized() {
    this.productGristConfig = {
      list: { fields: ['batchId', 'product', 'packingType', 'totalWeight'] },
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'center', options: { queryName: 'products' } },
          width: 350
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center', codeName: 'PACKING_TYPES' },
          width: 150
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'code',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { align: 'center', codeName: 'WEIGHT_UNITS' },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'totalWeight',
          header: i18next.t('field.total_weight'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { align: 'center' },
          width: 80
        }
      ]
    }

    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true },
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.vas && record.vas.operationGuideType === 'template') {
              this._template = document.createElement(record.vas.operationGuide)
              this._template.record = { ...record, operationGuide: JSON.parse(record.operationGuide) }
            } else {
              this._template = null
            }
          }
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { editable: true, align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { editable: true, align: 'center', options: ['', i18next.t('label.all')] },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
        }
      ]
    }
  }

  pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._ganNo = changes.resourceId
      this._fetchGAN()
    }
  }

  async _fetchGAN() {
    const response = await client.query({
      query: gql`
        query {
          arrivalNotice(${gqlBuilder.buildArgs({
            name: this._ganNo
          })}) {
            name
            containerNo
            ownTransport
            etaDate
            deliveryOrderNo
            status
            truckNo
            refNo
            importCargo
            remark
            orderProducts {
              batchId
              product {
                name
                description
              }
              packingType
              weight
              unit
              packQty
              totalWeight
              palletQty
            }
            orderVass {
              vas {
                name
                description
                operationGuide
                operationGuideType
              }
              batchId
              remark
              status
              operationGuide
            }
          }
        }
      `
    })

    if (!response.errors) {
      const arrivalNotice = response.data.arrivalNotice
      const orderProducts = arrivalNotice.orderProducts
      const orderVass = arrivalNotice.orderVass

      this._rejectReason = arrivalNotice.remark
      this._ownTransport = arrivalNotice.ownTransport
      this._fillupANForm(arrivalNotice)

      this.productData = { records: orderProducts }
      this.vasData = { records: orderVass }
    }
  }

  _fillupANForm(data) {
    this._fillupForm(this.arrivalNoticeForm, data)
  }

  _fillupForm(form, data) {
    for (let key in data) {
      Array.from(form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type !== 'file') {
          field.value = data[key]
        }
      })
    }
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

window.customElements.define('rejected-arrival-notice', RejectedArrivalNotice)
