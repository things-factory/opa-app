import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { getRenderer } from '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../components/vas-templates'
import { BATCH_AND_PRODUCT_TYPE, BATCH_NO_TYPE, ETC_TYPE, PRODUCT_TYPE } from '../constants'
import { ORDER_PRODUCT_STATUS, ORDER_STATUS } from '../constants/order'
import '../../components/attachment-viewer'
import './extra-product-popup'
import './proceed-edited-batch-popup'
import './proceed-extra-product-popup'

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
      _hasContainer: Boolean,
      _looseItem: Boolean,
      isUserBelongsDomain: Boolean,
      _status: String,
      _attachments: Array,
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

        .gan-preview {
          display: flex;
          flex-direction: row;
          flex: 1;
        }
        attachment-viewer {
          flex: 1;
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
          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.do_no')}</label>
          <input name="deliveryOrderNo" ?hidden="${!this._ownTransport}" readonly />

          <label>${i18next.t('label.eta_date')}</label>
          <input name="etaDate" type="date" readonly />

          <label ?hidden="${this._importedOrder || !this._ownTransport}">${i18next.t('label.truck_no')}</label>
          <input ?hidden="${this._importedOrder || !this._ownTransport}" name="truckNo" readonly />

          <label ?hidden="${!this._hasContainer}">${i18next.t('label.container_no')}</label>
          <input ?hidden="${!this._hasContainer}" type="text" name="containerNo" readonly />

          <label>${i18next.t('label.container_size')}</label>
          <input type="text" name="containerSize" readonly />

          <label>${i18next.t('label.status')}</label>
          <select name="status" disabled
            >${Object.keys(ORDER_STATUS).map(key => {
              const status = ORDER_STATUS[key]
              return html` <option value="${status.value}">${i18next.t(`label.${status.name}`)}</option> `
            })}</select
          >

          <input id="container" type="checkbox" name="container" ?checked="${this._hasContainer}" disabled />
          <label for="container">${i18next.t('label.container')}</label>

          <input id="importedOrder" type="checkbox" name="importCargo" ?checked="${this._importedOrder}" disabled />
          <label for="importedOrder">${i18next.t('label.import_cargo')}</label>

          <input id="looseItem" type="checkbox" name="looseItem" ?checked="${this._looseItem}" disabled />
          <label for="looseItem">${i18next.t('label.loose_item')}</label>

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
      </form>

      <div class="gan-attachment-container" ?hidden="${this._attachments.length > 0 ? false : true}">
        <form name="ganAttachment" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.attachment')}</legend>
            <div class="gan-preview">
              ${(this._attachments || []).map(
                attachment =>
                  html`
                    <attachment-viewer
                      name="${attachment.name}"
                      src="${location.origin}/attachment/${attachment.path}"
                      .mimetype="${attachment.mimetype}"
                      .downloadable="${this._downloadable}"
                    ></attachment-viewer>
                  `
              )}
            </div>
          </fieldset>
        </form>
      </div>

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
    this._downloadable = true
    this._attachments = []
    this.vasData = { records: [] }
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
      this._template = null
      await this._fetchGAN()
      this._updateContext()
    }
  }

  async pageInitialized() {
    this.isUserBelongsDomain = await this._checkUserBelongsDomain()

    this.productGristConfig = {
      list: { fields: ['batchId', 'product', 'packingType', 'totalWeight'] },
      pagination: { infinite: true },
      rows: {
        appendable: false,
        classifier: (record, rowIndex) => {
          return {
            emphasized: record.status === ORDER_PRODUCT_STATUS.READY_TO_APPROVED.value
          }
        }
      },
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
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
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
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { align: 'center' },
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
      list: { fields: ['targetType', 'targetDisplay', 'packingType'] },
      pagination: { infinite: true },
      rows: {
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
          type: 'string',
          name: 'set',
          header: i18next.t('field.set'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'targetType',
          header: i18next.t('field.target_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'target',
          header: i18next.t('field.target'),
          record: {
            renderer: (value, column, record, rowIndex, field) => {
              if (record.targetType === BATCH_NO_TYPE) {
                return getRenderer()(record.targetBatchId, column, record, rowIndex, field)
              } else if (record.targetType === PRODUCT_TYPE) {
                return getRenderer('object')(record.targetProduct, column, record, rowIndex, field)
              } else if (record.targetType === BATCH_AND_PRODUCT_TYPE) {
                return getRenderer()(
                  `${record.targetBatchId} / ${record.targetProduct.name}`,
                  column,
                  record,
                  rowIndex,
                  field
                )
              } else if (record.targetType === ETC_TYPE) {
                return getRenderer()(record.otherTarget, column, record, rowIndex, field)
              }
            },
            align: 'center'
          },

          width: 250
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { align: 'center', options: { queryName: 'vass' } },
          width: 250
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
            bizplace {
              id
              name
            }
            containerNo
            ownTransport
            etaDate
            looseItem
            deliveryOrderNo
            status
            truckNo
            refNo
            importCargo
            jobSheet {
              containerSize
            }
            attachment {
              id
              name
              refBy
              path
              mimetype
            }
            orderProducts {
              id
              batchId
              product {
                name
                description
              }
              remark
              status
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
              set
              targetType
              targetBatchId
              targetProduct {
                id
                name
                description
              }
              packingType
              qty
              weight
              otherTarget
              description
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
      this.orderBizplace = arrivalNotice.bizplace

      this._hasContainer = arrivalNotice.containerNo ? true : false
      this._looseItem = arrivalNotice.looseItem
      this._ownTransport = arrivalNotice.ownTransport
      this._importCargo = arrivalNotice.importCargo
      this._status = arrivalNotice.status
      this._fillupANForm({
        ...arrivalNotice,
        ...arrivalNotice.jobSheet
      })

      if (arrivalNotice && arrivalNotice?.attachment) {
        this._attachments = arrivalNotice && arrivalNotice.attachment
      }

      this.productData = { records: orderProducts }
      this.vasData = {
        records: orderVass
          .sort((a, b) => a.set - b.set)
          .map(orderVas => {
            return {
              ...orderVas,
              set: `Set ${orderVas.set}`
            }
          })
      }
    }
  }

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.PENDING.value) {
      this._actions = [
        { title: i18next.t('button.delete'), action: this._deleteArrivalNotice.bind(this) },
        { title: i18next.t('button.confirm'), action: this._confirmArrivalNotice.bind(this) }
      ]
    }

    if (this._status === ORDER_STATUS.PROCESSING.value && this.isUserBelongsDomain) {
      this._actions = [{ title: i18next.t('button.add'), action: this.openExtraProductPopup.bind(this) }]
    }

    if (
      !this.isUserBelongsDomain &&
      this._status === ORDER_STATUS.PROCESSING.value &&
      this.productData.records.some(product => product.status === ORDER_PRODUCT_STATUS.READY_TO_APPROVED.value)
    ) {
      this._actions = [{ title: i18next.t('button.approve'), action: this.openApproveProductPopup.bind(this) }]
    }

    if (
      !this.isUserBelongsDomain &&
      this._status === ORDER_STATUS.PENDING_APPROVAL.value &&
      this.productData.records.some(product => product.status === ORDER_PRODUCT_STATUS.PENDING_APPROVAL.value)
    ) {
      this._actions = [{ title: i18next.t('button.approve'), action: this.openApproveBatchPopup.bind(this) }]
    }

    if (!this.isUserBelongsDomain && this._status !== ORDER_STATUS.PENDING.value) {
      this._actions = [
        ...this._actions,
        { title: i18next.t('button.duplicate'), action: () => window.open(`duplicate_arrival_notice/${this._ganNo}`) }
      ]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  async _checkUserBelongsDomain() {
    try {
      const response = await client.query({
        query: gql`
          query {
            checkUserBelongsDomain
          }
        `
      })

      if (!response.errors) {
        return response.data.checkUserBelongsDomain
      }
    } catch (e) {
      this._showToast(e)
    }
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

  openExtraProductPopup() {
    openPopup(
      html`
        <extra-product-popup
          .ganNo="${this._ganNo}"
          .bizplace="${this.orderBizplace}"
          @completed="${this._fetchGAN.bind(this)}"
        ></extra-product-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.extra_product')
      }
    )
  }

  openApproveProductPopup() {
    openPopup(
      html`
        <proceed-extra-product-popup
          .ganNo="${this._ganNo}"
          .data="${this.productData}"
          @completed="${() => {
            this._fetchGAN()
            this._updateContext()
          }}"
        ></proceed-extra-product-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.proceed_extra_product')
      }
    )
  }

  openApproveBatchPopup() {
    openPopup(
      html`
        <proceed-edited-batch-popup
          .ganNo="${this._ganNo}"
          .data="${this.productData}"
          @completed="${() => {
            this._fetchGAN()
            this._updateContext()
          }}"
        ></proceed-edited-batch-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.edited_batch_no_approval')
      }
    )
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
