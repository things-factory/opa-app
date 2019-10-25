import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'
import '../../components/vas-relabel'
import { ORDER_STATUS } from '../constants/order'

class ArrivalNoticeDetail extends localize(i18next)(PageView) {
  static get properties() {
    return {
      /**
       * @description
       * flag for whether use transportation from warehouse or not.
       * true =>
       */
      _ganNo: String,
      _ownTransport: Boolean,
      _importCargo: Boolean,
      _status: String,
      productGristConfig: Object,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object,
      _template: Object
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
        .container {
          flex: 1;
          display: flex;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .guide-container {
          max-width: 30vw;
          display: flex;
          flex-direction: column;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
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
      title: i18next.t('title.arrival_notice_detail'),
      actions: this._actions
    }
  }

  render() {
    return html`
      <form name="arrivalNotice" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.gan_no')}: ${this._ganNo}</legend>
          <label ?hidden="${!this._importedOrder}">${i18next.t('label.container_no')}</label>
          <input name="containerNo" ?hidden="${!this._importedOrder}" readonly />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.do_no')}</label>
          <input name="deliveryOrderNo" ?hidden="${!this._ownTransport}" readonly />

          <label ?hidden="${this._importedOrder || !this._ownTransport}">${i18next.t('label.truck_no')}</label>
          <input ?hidden="${this._importedOrder || !this._ownTransport}" name="truckNo" readonly />

          <label>${i18next.t('label.eta_date')}</label>
          <input name="etaDate" type="date" readonly />

          <input id="importedOrder" type="checkbox" name="importCargo" ?checked="${this._importedOrder}" disabled />
          <label for="importedOrder">${i18next.t('label.import_cargo')}</label>

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            @change="${e => (this._ownTransport = e.currentTarget.checked)}"
            disabled
          />
          <label>${i18next.t('label.own_transport')}</label>
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
    this._ownTransport = true
    this._importCargo = false
  }

  get arrivalNoticeForm() {
    return this.shadowRoot.querySelector('form[name=arrivalNotice]')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async pageUpdated(changes) {
    if (this.active) {
      this._ganNo = changes.resourceId || this._ganNo || ''
      await this._fetchGAN()
      this._updateContext()
    }
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
          record: {
            align: 'center',
            codeName: 'PACKING_TYPES'
          },
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
      list: { fields: ['ready', 'vas', 'batchId', 'remark'] },
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
          record: { align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center', options: ['', i18next.t('label.all')] },
          width: 150
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'center' },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.comment'),
          width: 350
        }
      ]
    }
  }

  async _fetchGAN() {
    if (!this._ganNo) return
    this._status = ''
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
            importCargo
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
                operationGuide
                operationGuideType
              }
              description
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

      this._ownTransport = arrivalNotice.ownTransport
      this._importCargo = arrivalNotice.importCargo
      this._status = arrivalNotice.status
      this._fillupANForm(arrivalNotice)

      this.productData = { records: orderProducts }
      this.vasData = { records: orderVass }
    }
  }

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.PENDING.value) {
      this._actions = [
        {
          title: i18next.t('button.delete'),
          action: this._deleteArrivalNotice.bind(this)
        },
        {
          title: i18next.t('button.confirm'),
          action: this._confirmArrivalNotice.bind(this)
        }
      ]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _fillupANForm(data) {
    this._fillupForm(this.arrivalNoticeForm, data)
  }

  _fillupForm(form, data) {
    for (let key in data) {
      Array.from(form.querySelectorAll('input, textarea, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  async _deleteArrivalNotice() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.you_wont_be_able_to_revert_this'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      this._executeRevertTransactions()
      const response = await client.query({
        query: gql`
            mutation {
              deleteArrivalNotice(${gqlBuilder.buildArgs({
                name: this._ganNo
              })}) 
            }
          `
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.gan_has_been_deleted') })
        navigate(`arrival_notices`)
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _executeRevertTransactions() {
    try {
      for (let i = 0; i < this.vasData.records.length; i++) {
        const record = this.vasData.records[i]
        if (record.vas.operationGuideType && record.vas.operationGuideType === 'template') {
          const template = document.createElement(record.vas.operationGuide)

          for (let j = 0; j < template.revertTransactions.length; j++) {
            const trx = template.revertTransactions[j]
            await trx(record)
          }
        }
      }
    } catch (e) {
      throw e
    }
  }

  async _confirmArrivalNotice() {
    const result = await CustomAlert({
      title: i18next.t('title.are_you_sure'),
      text: i18next.t('text.confirm_arrival_notice'),
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (!result.value) {
      return
    }

    try {
      const response = await client.query({
        query: gql`
            mutation {
              confirmArrivalNotice(${gqlBuilder.buildArgs({
                name: this._ganNo
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.gan_confirmed') })
        navigate('arrival_notices')
      }
    } catch (e) {
      this._showToast(e)
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

window.customElements.define('arrival-notice-detail', ArrivalNoticeDetail)
