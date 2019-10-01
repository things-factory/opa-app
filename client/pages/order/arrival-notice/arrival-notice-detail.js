import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { ORDER_STATUS } from '../constants/order'
import { CustomAlert } from '../../../utils/custom-alert'

class ArrivalNoticeDetail extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      /**
       * @description
       * flag for whether use transportation from warehouse or not.
       * true =>
       */
      _ganNo: String,
      _ownTransport: Boolean,
      _status: String,
      _loadTypes: Array,
      productGristConfig: Object,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object
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
      title: i18next.t('title.arrival_notice_detail')
    }
  }

  render() {
    return html`
      <form name="arrivalNotice" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.gan_no')}: ${this._ganNo}</legend>
          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" readonly />

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
            readonly
          />
          <label>${i18next.t('label.own_transport')}</label>

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.transport_reg_no')}</label>
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

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

        <data-grist
          id="product-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productGristConfig}
          .data="${this.productData}"
        ></data-grist>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
        ></data-grist>
      </div>

      <div class="co-form-container" ?hidden="${this._ownTransport}">
        <form name="collectionOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.collection_order')}</legend>

            <label>${i18next.t('label.collection_date')}</label>
            <input name="collectionDate" type="date" readonly />

            <label>${i18next.t('label.destination')}</label>
            <input name="from" readonly />

            <label>${i18next.t('label.load_type')}</label>
            <select name="loadType" disabled>
              <option value=""></option>
              ${this._loadTypes.map(
                loadType => html`
                  <option value="${loadType.name}">${i18next.t(`label.${loadType.description}`)}</option>
                `
              )}
            </select>

            <!--label>${i18next.t('label.document')}</label>
            <input name="attiachment" type="file" ?required="${!this._ownTransport}" /-->
          </fieldset>
        </form>
      </div>
    `
  }

  constructor() {
    super()
    this.productData = { records: [] }
    this.vasData = { records: [] }
    this._importedOrder = false
    this._ownTransport = true
    this._loadTypes = []
  }

  get arrivalNoticeForm() {
    return this.shadowRoot.querySelector('form[name=arrivalNotice]')
  }

  get collectionOrderForm() {
    return this.shadowRoot.querySelector('form[name=collectionOrder]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get _collectionDateInput() {
    return this.shadowRoot.querySelector('input[name=collectionDate]')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async firstUpdated() {
    this._loadTypes = await getCodeByName('LOAD_TYPES')
  }

  pageInitialized() {
    this.productGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { editable: true, align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { editable: true, align: 'center', options: { queryName: 'products' } },
          width: 350
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: true,
            align: 'center',
            codeName: 'PACKING_TYPES'
          },
          width: 150
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { editable: true, align: 'center' },
          width: 80
        },
        {
          type: 'code',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { editable: true, align: 'center', codeName: 'WEIGHT_UNITS' },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { editable: true, align: 'center' },
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
          record: { editable: true, align: 'center' },
          width: 80
        }
      ]
    }

    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
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
          header: i18next.t('field.batch_id'),
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

  updated(changedProps) {
    if (changedProps.has('_ganNo')) {
      this._fetchGAN()
    }

    if (changedProps.has('_status')) {
      this._updateContext()
    }
  }

  async _fetchGAN() {
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
              }
              batchId
              remark
            }
            collectionOrder {
              from
              loadType
              collectionDate
            }   
          }
        }
      `
    })

    if (!response.errors) {
      const arrivalNotice = response.data.arrivalNotice
      const collectionOrder = arrivalNotice.collectionOrder
      const orderProducts = arrivalNotice.orderProducts
      const orderVass = arrivalNotice.orderVass

      this._ownTransport = arrivalNotice.ownTransport
      this._status = arrivalNotice.status
      this._fillupANForm(arrivalNotice)

      if (!this._ownTransport) this._fillupCOForm(collectionOrder)
      this.productData = { records: orderProducts }
      this.vasData = { records: orderVass }
    }
  }

  _fillupANForm(data) {
    this._fillupForm(this.arrivalNoticeForm, data)
  }

  _fillupCOForm(data) {
    this._fillupForm(this.collectionOrderForm, data)
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

  _updateContext() {
    let actions = []

    if (this._status === ORDER_STATUS.PENDING.value) {
      actions = [
        {
          title: i18next.t('button.edit'),
          type: 'transaction',
          action: this._changeToEditable.bind(this)
        },
        {
          title: i18next.t('button.confirm'),
          type: 'transaction',
          action: this._confirmArrivalNotice.bind(this)
        }
      ]
    } else if (this._status === ORDER_STATUS.EDITING.value) {
      navigate(`edit_arrival_notice/${this._ganNo}`)
    }

    actions = [...actions, { title: i18next.t('button.back'), action: () => navigate('arrival_notices') }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        ...this.context,
        actions
      }
    })
  }

  async _changeToEditable(cb) {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.change_to_editable'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (result.value) {
        const response = await client.query({
          query: gql`
            mutation {
              updateArrivalNotice(${gqlBuilder.buildArgs({
                name: this._ganNo,
                patch: { status: ORDER_STATUS.EDITING.value }
              })}) {
                name 
              }
            }
          `
        })

        if (!response.errors) {
          this._fetchGAN()
        }
      }
    } catch (e) {
      this._showToast(e)
    } finally {
      cb()
    }
  }
  async _confirmArrivalNotice(cb) {
    const result = await CustomAlert({
      title: i18next.t('title.are_you_sure'),
      text: i18next.t('text.confirm_arrival_notice'),
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') }
    })
    if (!result.value) return

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
    } finally {
      cb()
    }
  }

  stateChanged(state) {
    if (this.active) {
      this._ganNo = state && state.route && state.route.resourceId
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
