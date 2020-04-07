import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../components/vas-relabel'
import { ORDER_STATUS } from '../constants/order'

class ReleaseOrderDetail extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _releaseOrderNo: String,
      _template: Object,
      _ownTransport: Boolean,
      _exportOption: Boolean,
      customerBizplaceId: String,
      partnerBizplaceId: String,
      inventoryGristConfig: Object,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
      _status: String,
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
          overflow-y: auto;
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
      `,
    ]
  }

  render() {
    return html`
      <form name="releaseOrder" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.release_order_no')}: ${this._releaseOrderNo}</legend>
          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label>${i18next.t('label.release_date')}</label>
          <input name="releaseDate" type="date" readonly />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.co_no')}</label>
          <input name="collectionOrderNo" ?hidden="${!this._ownTransport}" readonly />

          <input id="exportOption" type="checkbox" name="exportOption" ?checked="${this._exportOption}" disabled />
          <label>${i18next.t('label.export')}</label>

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            ?hidden="${this._exportOption}"
            disabled
          />
          <label ?hidden="${this._exportOption}">${i18next.t('label.own_transport')}</label>
        </fieldset>
      </form>

      <div class="so-form-container" ?hidden="${!this._exportOption || (this._exportOption && !this._ownTransport)}">
        <form name="shippingOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.export_order')}</legend>
            <label>${i18next.t('label.container_no')}</label>
            <input name="containerNo" readonly />

            <label>${i18next.t('label.container_arrival_date')}</label>
            <input name="containerArrivalDate" type="date" readonly />

            <label>${i18next.t('label.container_leaving_date')}</label>
            <input name="containerLeavingDate" type="date" readonly />

            <label>${i18next.t('label.ship_name')}</label>
            <input name="shipName" readonly />
          </fieldset>
        </form>
      </div>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_product_list')}</h2>
          <data-grist
            id="inventory-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.inventoryGristConfig}
            .data=${this.inventoryData}
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
    this._exportOption = false
    this._ownTransport = true
    this.inventoryData = { records: [] }
    this.vasData = { records: [] }
  }

  get context() {
    return {
      title: i18next.t('title.release_order_detail'),
      actions: this._actions,
    }
  }

  get releaseOrderForm() {
    return this.shadowRoot.querySelector('form[name=releaseOrder]')
  }

  get shippingOrderForm() {
    return this.shadowRoot.querySelector('form[name=shippingOrder]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._releaseOrderNo = changes.resourceId
      await this._fetchReleaseOrder()
      this._updateContext()
    }
  }

  async pageInitialized() {
    await this._getUserBizplace()

    this.inventoryGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      list: { fields: ['name', 'batchId', 'product', 'location', 'releaseQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 100,
        },
        {
          type: 'string',
          name: 'productName',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 150,
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150,
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.available_qty'),
          record: { align: 'center' },
          width: 100,
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { align: 'center', options: { min: 0 } },
          width: 100,
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.available_weight'),
          record: { align: 'center' },
          width: 100,
        },
        {
          type: 'float',
          name: 'releaseWeight',
          header: i18next.t('field.release_weight'),
          record: { align: 'center', options: { min: 0 } },
          width: 100,
        },
        {
          type: 'float',
          name: 'roundedWeight',
          header: i18next.t('field.rounded_weight'),
          record: { align: 'center', options: { min: 0 } },
          width: 100,
        },
      ],
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
          },
        },
      },
      list: { fields: ['ready', 'vas', 'inventory', 'product', 'remark'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { align: 'center' },
          width: 250,
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 100,
        },
        {
          type: 'string',
          name: 'productName',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 150,
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150,
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'center' },
          width: 350,
        },
      ],
    }
  }

  async _fetchReleaseOrder() {
    if (!this._releaseOrderNo) return
    const response = await client.query({
      query: gql`
        query {
          releaseGoodDetail(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo,
          })}) {
            id
            name
            truckNo
            status
            refNo
            ownTransport
            exportOption
            releaseDate
            collectionOrderNo
            bizplace {
              id
              name
              description
            }
            inventoryInfos {
              name
              batchId
              productName
              packingType
              qty
              weight
              releaseQty
              releaseWeight
            }
            shippingOrderInfo {
              containerNo
              containerLeavingDate
              containerArrivalDate
              shipName
            }
            orderVass {
              batchId
              productName
              packingType
              vas {
                name
                description
                operationGuide
                operationGuideType
              }
              operationGuide
              status
              description
              remark
            }
          }
        }
      `,
    })

    if (!response.errors) {
      const releaseOrder = response.data.releaseGoodDetail
      const shippingOrder = releaseOrder.shippingOrderInfo
      const orderInventories = releaseOrder.inventoryInfos.map((inventoryInfo) => {
        return {
          ...inventoryInfo,
          roundedWeight: inventoryInfo.releaseQty * (inventoryInfo.weight / inventoryInfo.qty) || '',
        }
      })

      const orderVass = releaseOrder.orderVass

      this.partnerBizplaceId = releaseOrder.bizplace.id
      this._exportOption = response.data.releaseGoodDetail.exportOption
      if (this._exportOption) {
        this._ownTransport = true
      } else if (!this._exportOption) {
        this._ownTransport = response.data.releaseGoodDetail.ownTransport
      }
      this._status = releaseOrder.status

      this._fillupRGForm(response.data.releaseGoodDetail)
      if (this._exportOption) this._fillupSOForm(shippingOrder)

      this.inventoryData = { records: orderInventories }
      this.vasData = { records: orderVass }
    }
  }

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.PENDING.value) {
      this._actions = [
        {
          title: i18next.t('button.delete'),
          action: this._deleteReleaseOrder.bind(this),
        },
        {
          title: i18next.t('button.confirm'),
          action: this._confirmReleaseOrder.bind(this),
        },
      ]
    }

    if (
      this._status !== ORDER_STATUS.PENDING.value &&
      this.partnerBizplaceId === this.customerBizplaceId &&
      this._status !== ORDER_STATUS.PENDING_RECEIVE.value &&
      this._status !== ORDER_STATUS.PENDING_CANCEL.value &&
      this._status !== ORDER_STATUS.CANCELLED.value
    ) {
      this._actions = [
        {
          title: i18next.t('button.cancel_order'),
          action: this._submitCancellationReleaseOrder.bind(this),
        },
      ]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context,
    })
  }

  _fillupRGForm(data) {
    this._fillupForm(this.releaseOrderForm, data)
  }

  _fillupSOForm(data) {
    this._fillupForm(this.shippingOrderForm, data)
  }

  _fillupForm(form, data) {
    form.reset()
    for (let key in data) {
      Array.from(form.querySelectorAll('input')).forEach((field) => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          if (data[key] instanceof Object) {
            const objectData = data[key]
            field.value = `${objectData.name} ${objectData.description ? `(${objectData.description})` : ''}`
          } else {
            field.value = data[key]
          }
        }
      })
    }
  }

  async _deleteReleaseOrder() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.you_wont_be_able_to_revert_this'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') },
      })

      if (!result.value) return

      await this._executeRevertTransactions()
      const response = await client.query({
        query: gql`
            mutation {
              deleteReleaseGood(${gqlBuilder.buildArgs({
                name: this._releaseOrderNo,
              })})
            }
          `,
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.release_order_has_been_deleted') })
        navigate(`release_orders`)
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _submitCancellationReleaseOrder() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.you_wont_be_able_to_revert_this'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') },
      })

      if (!result.value) return

      const response = await client.query({
        query: gql`
            mutation {
              pendingCancellationReleaseOrder(${gqlBuilder.buildArgs({
                name: this._releaseOrderNo,
              })})
            }
          `,
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.release_order_submit_for_cancellation') })
        navigate(`release_orders`)
      }
    } catch (e) {
      throw e
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

  async _confirmReleaseOrder() {
    const result = await CustomAlert({
      title: i18next.t('title.are_you_sure'),
      text: i18next.t('text.confirm_release_good'),
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') },
    })

    if (!result.value) {
      return
    }

    try {
      const response = await client.query({
        query: gql`
            mutation {
              confirmReleaseGood(${gqlBuilder.buildArgs({
                name: this._releaseOrderNo,
              })}) {
                name
              }
            }
          `,
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.release_order_confirmed') })
        navigate('release_orders')
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _getUserBizplace() {
    const response = await client.query({
      query: gql`
        query {
          userBizplaces(${gqlBuilder.buildArgs({
            email: '',
          })}) {
            id
            name
            description
            userBizplaceId
            mainBizplace
          }
        }
      `,
    })

    if (!response.errors) {
      this.customerBizplaceId = response.data.userBizplaces
        .map((userBiz) => userBiz.userBizplaceId)
        .slice(0, 1)
        .shift()
    }
  }

  _showToast({ type, message }) {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          type,
          message,
        },
      })
    )
  }
}

window.customElements.define('release-order-detail', ReleaseOrderDetail)
