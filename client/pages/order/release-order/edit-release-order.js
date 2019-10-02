import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { ORDER_PRODUCT_STATUS, ORDER_TYPES } from '../constants/order'
import { CustomAlert } from '../../../utils/custom-alert'
import './inventory-product-selector'

class EditReleaseOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _ownTransport: Boolean,
      _exportOption: Boolean,
      _loadTypes: Array,
      inventoryGristConfig: Object,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
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

  get context() {
    return {
      title: i18next.t('title.create_release_order'),
      actions: [
        {
          title: i18next.t('button.confirm'),
          type: 'transaction',
          action: this._editReleaseOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
        <form name="releaseOrder" class="multi-column-form">
          <fieldset>
          <legend>${i18next.t('title.release_order_no')}: ${this._releaseOrderNo}</legend>
            <label>${i18next.t('label.release_date')}</label>
            <input name="releaseDate" type="date" min="${this._getStdDate()}" />

            <label ?hidden="${!this._ownTransport}">${i18next.t('label.co_no')}</label>
            <input name="collectionOrderNo" ?hidden="${!this._ownTransport}"/>

            <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
            <input name="truckNo" ?hidden="${!this._ownTransport}"/>

            <input
            id="exportOption"
            type="checkbox"
            name="exportOption"
            ?checked="${this._exportOption}"
            @change="${e => {
              this._exportOption = e.currentTarget.checked
              if (this._exportOption) {
                this._ownTransportInput.checked = true
                this._ownTransport = true
              }
            }}"
            />
            <label for="exportOption">${i18next.t('label.export')}</label>

            <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            @change="${e => (this._ownTransport = e.currentTarget.checked)}"
            ?hidden="${this._exportOption}"
            />
            <label for="ownTransport" ?hidden="${this._exportOption}">${i18next.t('label.own_transport')}</label>
          </fieldset>
        </form>
      </div>

      <div class="so-form-container" ?hidden="${!this._exportOption || (this._exportOption && !this._ownTransport)}">
        <form name="shippingOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.export_order')}</legend>
            <label>${i18next.t('label.container_no')}</label>
            <input name="containerNo" ?required="${this._exportOption}"/>

            <label>${i18next.t('label.container_arrival_date')}</label>
            <input 
              name="containerArrivalDate" 
              type="date"  
              @change="${e => {
                this._conLeavingDateInput.setAttribute('min', e.currentTarget.value)
              }}" 
              min="${this._getStdDate()}" 
              ?required="${this._exportOption}"
            />

            <label>${i18next.t('label.container_leaving_date')}</label>
            <input name="containerLeavingDate" type="date" min="${this._getStdDate()}" ?required="${
      this._exportOption
    }"/>

            <label>${i18next.t('label.ship_name')}</label>
            <input name="shipName" ?required="${this._exportOption}"/>

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

      <div class="do-form-container" ?hidden="${this._exportOption || (!this._exportOption && this._ownTransport)}">
        <form name="deliveryOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.delivery_order')}</legend>

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="deliveryDate" type="date" min="${this._getStdDate()}" ?required="${!this._ownTransport}" />

            <label>${i18next.t('label.destination')}</label>
            <input name="to" ?required="${!this._ownTransport}" />

            <label>${i18next.t('label.load_type')}</label>
            <select name="loadType" ?required="${!this._ownTransport}">
              <option value=""></option>
              ${this._loadTypes.map(
                loadType => html`
                  <option value="${loadType.name}">${i18next.t(`label.${loadType.description}`)}</option>
                `
              )}
            </select>

            <label>${i18next.t('label.tel_no')}</label>
            <input delivery name="telNo" ?required="${!this._ownTransport}"/>

            <!--label>${i18next.t('label.document')}</label>
            <input name="attiachment" type="file" ?required="${!this._ownTransport}" /-->
          </fieldset>
        </form>
      </div>
    `
  }

  constructor() {
    super()
    this._exportOption = false
    this._ownTransport = true
    this.inventoryData = { records: [] }
    this.vasData = { records: [] }
    this._loadTypes = []
  }

  get releaseOrderForm() {
    return this.shadowRoot.querySelector('form[name=releaseOrder]')
  }

  get deliveryOrderForm() {
    return this.shadowRoot.querySelector('form[name=deliveryOrder]')
  }

  get _conLeavingDateInput() {
    return this.shadowRoot.querySelector('input[name=containerLeavingDate]')
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

  async firstUpdated() {
    this._loadTypes = await getCodeByName('LOAD_TYPES')
  }

  pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._releaseOrderNo = changes.resourceId
      this._fetchReleaseOrder()
    }
  }

  async _fetchReleaseOrder() {
    this._status = ''
    const response = await client.query({
      query: gql`
        query {
          releaseGoodDetail(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo
          })}) {
            id
            name
            truckNo
            status
            ownTransport
            exportOption
            releaseDate
            collectionOrderNo
            inventoryInfos {
              name
              batchId
              packingType
              qty
              releaseQty
              product {
                name
                description
              }
              location {
                name
              }              
            }
            shippingOrder {
              containerNo
              containerLeavingDate
              containerArrivalDate
              shipName
            }
            deliveryOrder {
              to
              loadType
              deliveryDate
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
      const releaseOrder = response.data.releaseGoodDetail
      const deliveryOrder = releaseOrder.deliveryOrder
      const shippingOrder = releaseOrder.shippingOrder
      const orderInventories = releaseOrder.inventoryInfos
      const orderVass = releaseOrder.orderVass

      this._exportOption = response.data.releaseGoodDetail.exportOption
      if (this._exportOption) {
        this._ownTransport = true
      } else if (!this._exportOption) {
        this._ownTransport = response.data.releaseGoodDetail.ownTransport
      }
      this._status = releaseOrder.status

      this._fillupRGForm(response.data.releaseGoodDetail)
      if (this._exportOption) this._fillupSOForm(shippingOrder)
      if (!this._ownTransport) this._fillupDOForm(deliveryOrder)

      this.inventoryData = { records: orderInventories }
      this._updateBatchList(['', 'all', ...orderInventories.map(oi => oi.batchId)], orderVass)
    }
  }

  _fillupRGForm(data) {
    this._fillupForm(this.releaseOrderForm, data)
  }

  _fillupDOForm(data) {
    this._fillupForm(this.deliveryOrderForm, data)
  }

  _fillupSOForm(data) {
    this._fillupForm(this.shippingOrderForm, data)
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
              const newData = data.records.filter((_, idx) => idx !== rowIndex)
              this.inventoryData = { ...this.inventoryData, records: newData }
              this.inventoryGrist.dirtyData.records = newData
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
              const newData = data.records.filter((_, idx) => idx !== rowIndex)
              this.vasData = { ...this.vasData, records: newData }
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

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString().split('T')[0]
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

  async _editReleaseOrder(cb) {
    try {
      this._validateForm()
      this._validateInventories()
      this._validateVas()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.save_release_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })
      if (!result.value) {
        cb()
        return
      }

      let args = {
        name: this._releaseOrderNo,
        releaseGood: { ...this._getReleaseOrder(), ownTransport: this._exportOption ? true : this._ownTransport }
      }
      if (this._exportOption && this._ownTransport) args.shippingOrder = this._getShippingOrder()
      if (!this._exportOption && !this._ownTransport) args.deliveryOrder = this._getDeliveryOrder()

      const response = await client.query({
        query: gql`
            mutation {
              editReleaseGood(${gqlBuilder.buildArgs(args)}) {
                id
                name
              }
            }
          `
      })

      if (!response.errors) {
        navigate(`release_order_detail/${response.data.editReleaseGood.name}`)
        this._showToast({ message: i18next.t('release_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    } finally {
      cb()
    }
  }

  _validateForm() {
    if (!this.releaseOrderForm.checkValidity()) throw new Error('text.release_order_form_invalid')

    //    - condition: export is ticked and own transport
    if (this._exportOption) {
      if (!this.shippingOrderForm.checkValidity()) throw new Error('text.shipping_order_form_invalid')
    }

    // release order and delivery order
    //    - condition: not imported and not own transport
    if (!this._exportOption && !this._ownTransport) {
      if (!this.deliveryOrderForm.checkValidity()) throw new Error('text.delivery_order_form_invalid')
    }
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

  _updateBatchList(batchIds, vasData) {
    if (!batchIds) {
      batchIds = ['', 'all', ...(this.inventoryGrist.dirtyData.records || []).map(record => record.batchId)]
    }

    this.vasGristConfig = {
      ...this.vasGristConfig,
      columns: this.vasGristConfig.columns.map(column => {
        if (column.name === 'batchId') column.record.options = batchIds
        return column
      })
    }

    if (!vasData) {
      vasData = this.vasGrist.dirtyData.records
    }

    this.vasData = {
      records: vasData.map(record => {
        return {
          ...record,
          batchId: batchIds.includes(record.batchId) ? record.batchId : null
        }
      })
    }
  }

  _getReleaseOrder() {
    let releaseGood = this._serializeForm(this.releaseOrderForm)

    releaseGood.orderInventories = this.inventoryGrist.data.records.map((record, idx) => {
      const seq = idx + 1

      return {
        releaseQty: record.releaseQty,
        seq,
        inventory: {
          id: '',
          name: record.name
        }
      }
    })

    releaseGood.orderVass = this.vasGrist.data.records.map(record => {
      delete record.id
      delete record.__typename
      delete record.vas.__typename

      return { ...record, name }
    })

    return releaseGood
  }

  _serializeForm(form) {
    let obj = {}
    Array.from(form.querySelectorAll('input, select')).forEach(field => {
      if (!field.hasAttribute('hidden') && field.value) {
        obj[field.name] = field.type === 'checkbox' ? field.checked : field.value
      }
    })

    return obj
  }

  _getDeliveryOrder() {
    return this._serializeForm(this.deliveryOrderForm)
  }

  _getShippingOrder() {
    return this._serializeForm(this.shippingOrderForm)
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

window.customElements.define('edit-release-order', EditReleaseOrder)
