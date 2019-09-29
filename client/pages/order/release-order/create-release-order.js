import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { openPopup } from '@things-factory/layout-base'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS, ORDER_PRODUCT_STATUS, ORDER_TYPES } from '../constants/order'
import './inventory-product-selector'

class CreateReleaseOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _ownTransport: Boolean,
      _shippingOption: Boolean,
      inventoryGristConfig: Object,
      currentOrderType: String,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
      _orderStatus: String,
      _releaseOrderNo: String
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

  constructor() {
    super()
    this._ownTransport = true
    this._shippingOption = true
    this.inventoryData = {}
    this.vasData = {}
  }

  get context() {
    return {
      title: i18next.t('title.create_release_order'),
      actions: [
        {
          title: i18next.t('button.submit'),
          action: this._generateReleaseOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.release_order')}</legend>
            <label>${i18next.t('label.release_date')}</label>
            <input name="releaseDateTime" type="datetime-local" min="${this._getStdDatetime()}" />

            <label ?hidden="${!this._ownTransport}">${i18next.t('label.co_no')}</label>
            <input name="collectionOrderNo" ?hidden="${!this._ownTransport}"/>

            <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
            <input name="truckNo" ?hidden="${!this._ownTransport}"/>

            <input name="shippingOption" type="checkbox" ?checked="${this._shippingOption}"
            @change=${e => {
              this._shippingOption = e.currentTarget.checked
            }} />
            <label>${i18next.t('label.shipping_option')}</label>

            <label ?hidden="${!this._shippingOption}">${i18next.t('label.container_no')}</label>
            <input shipping name="containerNo" ?hidden="${!this._shippingOption}" />

            <label>${i18next.t('label.load_type')}</label>
            <select name="loadType">
            ${LOAD_TYPES.map(
              loadType => html`
                <option value="${loadType.value}">${i18next.t(`label.${loadType.name}`)}</option>
              `
            )}
            </select>

            <label ?hidden="${!this._shippingOption}">${i18next.t('label.container_arrival_date')}</label>
            <input shipping name="containerArrivalDate" type="datetime-local" min="${this._getStdDatetime()}"  
            ?hidden="${!this._shippingOption}" />

            <label ?hidden="${!this._shippingOption}">${i18next.t('label.container_leaving_date')}</label>
            <input shipping name="containerLeavingDate" type="datetime-local" min="${this._getStdDatetime()}" 
            ?hidden="${!this._shippingOption}" />

            <label ?hidden="${!this._shippingOption}">${i18next.t('label.ship_name')}</label>
            <input shipping name="shipName" ?hidden="${!this._shippingOption}" />

            <input name="ownTransport" type="checkbox" ?checked="${this._ownTransport}"
            @change=${e => {
              this._ownTransport = e.currentTarget.checked
            }} />
            <label>${i18next.t('label.own_transport')}</label>
            <label ?hidden="${this._ownTransport}">${i18next.t('label.delivery_date')}</label>
            <input delivery name="deliveryDateTime" type="datetime-local" min="${this._getStdDatetime()}" ?hidden="${
      this._ownTransport
    }"/>

            <label>${i18next.t('label.release_from')}</label>
            <input name="from"/>

            <label>${i18next.t('label.release_to')}</label>
            <input name="to"/>

            <label ?hidden="${this._ownTransport}">${i18next.t('label.tel_no')}</label>
            <input delivery name="telNo" ?hidden="${this._ownTransport}"/>
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_product_list')}</h2>

        <data-grist
          id="inventory-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.inventoryGristConfig}
          .data=${this.inventoryData}
          @record-change="${this._onProductChangeHandler.bind(this)}"
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
    `
  }

  updated(changedProps) {
    if (changedProps.has('_releaseOrderNo') && this._releaseOrderNo) {
      this.fetchReleaseOrder()
      this._updateBatchList()
    } else if (changedProps.has('_releaseOrderNo') && !this._releaseOrderNo) {
      this._clearPage()
      this._updateBatchList()
    }

    this._contextHandler()
  }

  pageInitialized() {
    this.inventoryGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.inventoryData = {
                ...this.inventoryData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }

              this._updateBatchList()
            }
          }
        },
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
          header: i18next.t('field.release_inventory_list'),
          record: { editable: true, align: 'center' },
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._openInventoryProduct()
            }
          },
          width: 250
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { editable: true, align: 'center' },
          width: 150
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.available_qty'),
          record: { editable: true, align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 100
        }
      ]
    }

    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.vasData = {
                ...this.vasData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
            }
          }
        },
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
          record: { editable: true, align: 'center', options: [i18next.t('label.all')] },
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

  _openInventoryProduct() {
    openPopup(
      html`
        <inventory-product-selector
          @selected="${e => {
            this.inventoryData = {
              ...this.inventoryData,
              records: e.detail
            }
          }}"
        ></inventory-product-selector>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.inventory_product_selection')
      }
    )
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async fetchReleaseOrder() {
    const response = await client.query({
      query: gql`
        query {
          releaseGoodDetail(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo
          })}) {
            id
            name
            from
            to
            loadType
            truckNo
            status
            ownTransport
            shippingOption
            releaseDateTime
            inventoryInfos {
              name
              batchId
              inventoryName
              product {
                name
                description
              }
              packingType
              qty
              releaseQty
            }
            releaseGoodInfo {
              containerNo
              containerLeavingDate
              containerArrivalDate
              shipName
              deliveryDateTime
              telNo
            }
            orderVass {
              vas {
                id
                name
                description
              }
              description
              batchId
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._shippingOption = response.data.releaseGoodDetail.shippingOption
      this._ownTransport = response.data.releaseGoodDetail.ownTransport
      this._status = response.data.releaseGoodDetail.status
      this._fillupForm(response.data.releaseGoodDetail)
      this._fillupForm(response.data.releaseGoodDetail.releaseGoodInfo)
      this.inventoryData = {
        records: response.data.releaseGoodDetail.inventoryInfos
      }

      this.vasData = {
        ...this.vasData,
        records: response.data.releaseGoodDetail.orderVass
      }
    }
  }

  _fillupForm(data) {
    for (let key in data) {
      Array.from(this.form.querySelectorAll('input, textarea, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  _onProductChangeHandler(event) {
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    if (changedColumn === 'releaseQty' || changeColumn === 'qty') {
      try {
        this._validateReleaseQty(changeRecord.releaseQty, changeRecord.qty)
      } catch (e) {
        this._showToast(e)
        delete event.detail.after.releaseQty
      }
    }

    this._updateBatchList()
  }

  _validateReleaseQty(releaseQty, qty) {
    if (releaseQty > qty) {
      throw new Error(i18next.t('text.available_quantity_insufficient'))
    } else if (releaseQty <= 0) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    } else {
      return
    }
  }

  _updateBatchList() {
    // TODO: 시점 문제...
    setTimeout(() => {
      this.inventoryGrist.commit()
      this.inventoryData = this.inventoryGrist.data
      const batchIds = (this.inventoryGrist.data.records || []).map(record => record.batchId)

      this.vasGrist.commit()
      this.vasData = {
        ...this.vasGrist.data,
        records: this.vasGrist.data.records.map(record => {
          return {
            ...record,
            batchId: batchIds.includes(record.batchId) ? record.batchId : null
          }
        })
      }

      this.vasGristConfig = {
        ...this.vasGristConfig,
        columns: this.vasGristConfig.columns.map(column => {
          if (column.name === 'batchId') column.record.options = [i18next.t('label.all'), ...batchIds]

          return column
        })
      }
    }, 300)
  }

  _getStdDatetime() {
    let date = new Date()
    date.setDate(date.getDate() + 1)
    return `${date.toISOString().substr(0, 11)}00:00:00`
  }

  async _generateReleaseOrder() {
    try {
      this._validateForm()
      this._validateInventories()
      this._validateVas()

      const response = await client.query({
        query: gql`
          mutation {
            generateReleaseGood(${gqlBuilder.buildArgs({
              releaseGood: this._getReleaseOrder(),
              shippingOrder: this._getShippingOrder(),
              deliveryOrder: this._getDeliveryOrder()
            })}) {
              id
              name
            }
          }
        `
      })

      if (!response.errors) {
        navigate(`release_order_detail/${response.data.generateReleaseGood.name}`)
        this._showToast({ message: i18next.t('release_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateForm() {
    const elements = Array.from(this.form.querySelectorAll('input, select'))

    if (!elements.filter(e => !e.hasAttribute('hidden')).every(e => e.checkValidity()))
      throw new Error(i18next.t('text.invalid_form'))
  }

  _validateInventories() {
    this.inventoryGrist.commit()
    // no records
    if (!this.inventoryGrist.data.records || !this.inventoryGrist.data.records.length)
      throw new Error(i18next.t('text.no_products'))

    // required field (batchId, packingType, weight, unit, packQty)
    if (
      this.inventoryGrist.data.records.filter(record => !record.releaseQty || !record.batchId || !record.packingType)
        .length
    )
      throw new Error(i18next.t('text.empty_value_in_list'))

    // duplication of batch id
    const batchIds = this.inventoryGrist.data.records.map(inventory => inventory.batchId)
    if (batchIds.filter((batchId, idx, batchIds) => batchIds.indexOf(batchId) !== idx).length)
      throw new Error(i18next.t('text.batch_id_is_duplicated'))
  }

  _validateVas() {
    this.vasGrist.commit()
    if (this.vasGrist.data.records && this.vasGrist.data.records.length) {
      // required field (vas && remark)
      if (this.vasGrist.data.records.filter(record => !record.vas || !record.remark).length)
        throw new Error(i18next.t('text.empty_value_in_list'))

      // duplication of vas for same batch
      const vasBatches = this.vasGrist.data.records.map(vas => `${vas.vas.id}-${vas.batchId}`)
      if (vasBatches.filter((vasBatch, idx, vasBatches) => vasBatches.indexOf(vasBatch) !== idx).length)
        throw new Error(i18next.t('text.duplicated_vas_on_same_batch'))
    }
  }

  _updateBatchList() {
    // TODO: 시점 문제...
    setTimeout(() => {
      this.inventoryGrist.commit()
      this.inventoryData = this.inventoryGrist.data
      const batchIds = (this.inventoryGrist.data.records || []).map(record => record.batchId)

      this.vasGrist.commit()
      this.vasData = {
        ...this.vasGrist.data,
        records: this.vasGrist.data.records.map(record => {
          return {
            ...record,
            batchId: batchIds.includes(record.batchId) ? record.batchId : null
          }
        })
      }

      this.vasGristConfig = {
        ...this.vasGristConfig,
        columns: this.vasGristConfig.columns.map(column => {
          if (column.name === 'batchId') column.record.options = ['', i18next.t('label.all'), ...batchIds]

          return column
        })
      }
    }, 300)
  }

  _contextHandler() {
    if (this._releaseOrderNo) {
      store.dispatch({
        type: UPDATE_CONTEXT,
        context: {
          ...this.context,
          actions: [
            {
              title: i18next.t('button.update'),
              action: () => {
                try {
                  this._validateForm()
                  this._validateInventories()
                  this._validateVas()

                  this._editReleaseOrder(this._getReleaseOrder(), this._getShippingOrder(), this._getDeliveryOrder())
                } catch (e) {
                  this._showToast(e)
                }
              }
            }
          ]
        }
      })
    } else {
      store.dispatch({
        type: UPDATE_CONTEXT,
        context: {
          ...this.context
        }
      })
    }
  }

  async _editReleaseOrder(releaseGood, shippingOrder, deliveryOrder) {
    const response = await client.query({
      query: gql`
        mutation {
          editReleaseGood(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo,
            releaseGood,
            shippingOrder,
            deliveryOrder
          })}) {
            name 
          }
        }
      `
    })

    if (!response.errors) {
      navigate(`release_order_detail/${response.data.editReleaseGood.name}`)
      this._showToast({ message: i18next.t('release_order_updated') })
    }
  }

  _getReleaseOrder() {
    let releaseGood = { status: ORDER_STATUS.PENDING.value }
    Array.from(this.form.querySelectorAll('input, select')).forEach(field => {
      if (
        !field.hasAttribute('hidden') &&
        !field.hasAttribute('delivery') &&
        !field.hasAttribute('shipping') &&
        field.value
      ) {
        releaseGood[field.name] = field.type === 'checkbox' ? field.checked : field.value
      }
    })

    const orderInventories = this.inventoryGrist.data.records.map((record, idx) => {
      const seq = idx + 1

      return {
        name: record.name,
        releaseQty: record.releaseQty,
        seq,
        inventory: {
          id: '',
          name: record.inventoryName
        },
        type: ORDER_TYPES.RELEASE_OF_GOODS.value,
        status: ORDER_PRODUCT_STATUS.PENDING.value
      }
    })

    const orderVass = this.vasGrist.data.records.map(record => {
      delete record.id
      delete record.__typename
      delete record.vas.__typename

      return { ...record, name }
    })

    return {
      ...releaseGood,
      orderInventories,
      orderVass
    }
  }

  _getShippingOrder() {
    if (this._shippingOption) {
      let shippingOrder = { status: ORDER_STATUS.PENDING.value }
      Array.from(this.form.querySelectorAll('input, select')).forEach(field => {
        if (field.hasAttribute('shipping') && !field.hasAttribute('hidden') && field.value) {
          shippingOrder[field.name] = field.type === 'checkbox' ? field.checked : field.value
        }
      })
      return { ...shippingOrder }
    } else {
      return null
    }
  }

  _getDeliveryOrder() {
    if (!this._ownTransport) {
      let deliveryOrder = { status: ORDER_STATUS.PENDING.value }
      Array.from(this.form.querySelectorAll('input, select')).forEach(field => {
        if (field.hasAttribute('delivery') && !field.hasAttribute('hidden') && field.value) {
          deliveryOrder[field.name] = field.type === 'checkbox' ? field.checked : field.value
        }
      })

      return { ...deliveryOrder }
    } else {
      return null
    }
  }

  _clearPage() {
    this.form.reset()
    this.inventoryGrist.data = Object.assign({ records: [] })
    this.vasGrist.data = Object.assign({ records: [] })
  }

  stateChanged(state) {
    if (this.active) {
      this._releaseOrderNo = state && state.route && state.route.resourceId
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

window.customElements.define('create-release-order', CreateReleaseOrder)
