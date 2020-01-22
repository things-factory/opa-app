import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, gqlBuilder, isMobileDevice, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { WORKSHEET_STATUS } from '../inbound/constants/worksheet'
import { openPopup } from '@things-factory/layout-base'
import './return-pallet-check-popup'

class LoadingProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _releaseGoodNo: String,
      pickedProductConfig: Object,
      pickedProductData: Object,
      deliveryOrderConfig: Object,
      deliveryOrderData: Object,
      loadedProductConfig: Object,
      loadedProductData: Object,
      _selectedTaskStatus: String,
      _selectedTruck: String,
      _vehicleList: Object
    }
  }

  static get styles() {
    return [
      SingleColumnFormStyles,
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          overflow: auto;
          flex: 1;
        }
        .left-column {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .right-column {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
        }
        data-grist {
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
        fieldset[hidden] {
          display: none;
        }
        @media (max-width: 460px) {
          :host {
            display: block;
          }
          .grist {
            min-height: 500px;
          }
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.loading')
    }
  }

  get releaseGoodNoInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=releaseGoodNo]').shadowRoot.querySelector('input')
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get ownCollectionInput() {
    return this.shadowRoot.querySelector('input[name=ownCollection]')
  }

  get truckInput() {
    return this.shadowRoot.querySelector('input[name=truckNo]')
  }

  get pickedProductGrist() {
    return this.shadowRoot.querySelector('data-grist#picked-product-grist')
  }

  get deliveryOrderGrist() {
    return this.shadowRoot.querySelector('data-grist#delivery-order-grist')
  }

  get scannable() {
    return this._selectedTaskStatus && this._selectedTaskStatus === WORKSHEET_STATUS.EXECUTING.value
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.release_good_no')}</label>
          <barcode-scanable-input
            name="releaseGoodNo"
            custom-input
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.releaseGoodNoInput.value) {
                  this._clearView()
                  await this._fetchLoadingWorksheet(this.releaseGoodNoInput.value)
                  await this._fetchDeliveryOrders(this.releaseGoodNoInput.value)
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.release_order')}: ${this._releaseGoodNo}`}</legend>

          <label>${i18next.t('label.customer')}</label>
          <input name="bizplaceName" readonly />

          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label>${i18next.t('label.started_at')}</label>
          <input name="startedAt" type="datetime-local" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.loading')}</h2>
          <data-grist
            id="picked-product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.pickedProductConfig}
            .data=${this.pickedProductData}
            @record-change="${this._onProductChangeHandler.bind(this)}"
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.delivery_orders')}</h2>
          <data-grist
            id="delivery-order-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.deliveryOrderConfig}
            .data=${this.deliveryOrderData}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('label.assign_truck')}</legend>
              <input id="ownCollection" type="checkbox" name="ownCollection" />
              <label for="ownCollection">${i18next.t('label.own_collection')}</label>

              <label>${i18next.t('label.lorry_no')}</label>
              <input name="truckNo" />
            </fieldset>
          </form>
          ${this._selectedDeliveryOrder
            ? html`
                <h2><mwc-icon>list_alt</mwc-icon>${this._selectedDeliveryOrder.name} - ${i18next.t('title.loaded')}</h2>
                <data-grist
                  id="loaded-product-grist"
                  .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
                  .config=${this.loadedProductConfig}
                  .data=${this.loadedProductData}
                ></data-grist>
              `
            : ''}
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.pickedProductData = { records: [] }
    this.deliveryOrderData = { records: [] }
    this.loadedProductData = { records: [] }
    this._releaseGoodNo = ''
    this._selectedTaskStatus = null
  }

  updated(changedProps) {
    if (changedProps.has('_releaseGoodNo')) {
      this._updateContext()
    }
  }

  _updateContext() {
    let actions = []
    if (this._releaseGoodNo) {
      actions = [{ title: i18next.t('button.complete'), action: this._completeHandler.bind(this) }]
    }

    if (this._selectedTaskStatus === 'EXECUTING') {
      actions = [
        ...actions,
        {
          title: i18next.t('button.load'),
          action: this._loading.bind(this)
        }
      ]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.loading'),
        actions
      }
    })
  }

  async pageInitialized() {
    this.pickedProductConfig = {
      rows: {
        appendable: false,
        selectable: { multiple: true },
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (data.records.length && record) {
              if (this._selectedOrderInventory && this._selectedOrderInventory.name === record.name) {
                return
              }
              this._selectedTaskStatus = null
              this._selectedTaskStatus = record.status
              this._updateContext()
            }
          }
        }
      },
      pagination: { infinite: true },
      list: { fields: ['palletId', 'product', 'batchId', 'releaseQty', 'loadedQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'center' },
          width: 140
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 140
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 140
        },
        {
          type: 'string',
          name: 'releaseWeight',
          header: i18next.t('field.release_weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.weight_unit'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.picked_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'loadedQty',
          header: i18next.t('field.loaded_qty'),
          record: { align: 'center', editable: true },
          width: 100
        }
      ]
    }

    this.deliveryOrderConfig = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (data.records.length && record) {
              if (this._selectedDeliveryOrder && this._selectedDeliveryOrder.id === record.id) {
                return
              }
              this._selectedDeliveryOrder = record
              this._fetchLoadedProducts()
            }
          }
        }
      },
      list: { fields: ['name', 'regNumber'] },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { align: 'left' },
          width: 200
        },
        {
          type: 'string',
          name: 'truck',
          header: i18next.t('field.truck_no'),
          record: { align: 'center' },
          width: 140
        }
      ]
    }

    this.loadedProductConfig = {
      rows: { appendable: false, selectable: { multiple: true } },
      list: { fields: ['palletId', 'batchId', 'releaseQty'] },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          width: 140
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          width: 140
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 140
        },
        {
          type: 'number',
          name: 'releaseQty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'number',
          name: 'releaseWeight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.weight_unit'),
          record: { align: 'center' },
          weight: 80
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnReleaseGoodField()
    }
  }

  _focusOnReleaseGoodField() {
    setTimeout(() => this.releaseGoodNoInput.focus(), 100)
  }

  async _fetchLoadingWorksheet(releaseGoodNo) {
    const response = await client.query({
      query: gql`
        query {
          loadingWorksheet(${gqlBuilder.buildArgs({
            releaseGoodNo
          })}) {
            worksheetInfo {
              bizplaceName
              refNo
              startedAt
            }
            worksheetDetailInfos {
              name
              palletId
              batchId
              status
              product {
                name
                description
              }
              qty
              releaseQty
              releaseWeight
              inventory {
                unit
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._releaseGoodNo = releaseGoodNo
      this._fillUpForm(this.infoForm, response.data.loadingWorksheet.worksheetInfo)
      this.pickedProductData = {
        records: response.data.loadingWorksheet.worksheetDetailInfos.map(record => {
          return {
            ...record,
            loadedQty: record.releaseQty,
            ...record.inventory
          }
        })
      }
    } else {
      throw new Error(response.errors[0])
    }
  }

  _fillUpForm(form, data) {
    form.reset()
    for (let key in data) {
      Array.from(form.querySelectorAll('input')).forEach(field => {
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

  async _loading() {
    try {
      this._validateLoading()
      const loadedWorksheetDetails = this.pickedProductGrist.selected.map(record => {
        return { name: record.name, loadedQty: record.loadedQty }
      })
      const truckNo = this.truckInput.value.toUpperCase().replace(/\s+/g, '')

      const response = await client.query({
        query: gql`
            mutation {
            loading(${gqlBuilder.buildArgs({
              loadedWorksheetDetails,
              releaseGoodNo: this._releaseGoodNo,
              orderInfo: {
                truckNo,
                ownCollection: this.ownCollectionInput.checked
              }
            })})
          }
          `
      })

      if (!response.errors) {
        this._clearView()
        await this._fetchLoadingWorksheet(this._releaseGoodNo)
        await this._fetchDeliveryOrders(this._releaseGoodNo)
        this._selectedTaskStatus = null
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _fetchDeliveryOrders(releaseGoodNo) {
    const response = await client.query({
      query: gql`
        query {
          deliveryOrderByReleaseGood(${gqlBuilder.buildArgs({
            releaseGoodNo
          })}) {
            items {
              id
              name
              truck
              targetInventories {
                name
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.deliveryOrderData = {
        records: response.data.deliveryOrderByReleaseGood.items.map(item => {
          return {
            id: item.id,
            name: item.name,
            truck: item.truck
          }
        })
      }
      this._updateContext()
    } else {
      throw new Error(response.errors[0])
    }
  }

  async _fetchLoadedProducts() {
    if (!this._selectedDeliveryOrder || !this._selectedDeliveryOrder.id) return

    const response = await client.query({
      query: gql`
        query {
          orderInventories(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'deliveryOrder',
                operator: 'eq',
                value: this._selectedDeliveryOrder.id
              }
            ]
          })}) {
            items {
              releaseQty
              releaseWeight
              inventory {
                palletId
                batchId
                unit
                product {
                  name
                  description
                }
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.loadedProductData = {
        records: response.data.orderInventories.items.map(orderInventory => {
          return {
            ...orderInventory,
            ...orderInventory.inventory
          }
        })
      }
    }
  }

  _validateLoading() {
    // 1. validate whethere there's selected product or not
    if (!this.pickedProductGrist.selected || !this.pickedProductGrist.selected.length) {
      throw new Error(i18next.t('text.there_is_no_selected_items'))
    }
  }

  async _completeHandler() {
    try {
      this._validateComplete()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.complete_loading'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      if (this.pickedProductData && this.pickedProductData.records && this.pickedProductData.records.length) {
        this._validateRemainPallets(this.pickedProductData)
        return
      }

      this._complete()
    } catch (e) {
      this._showToast(e)
    }
  }

  _onProductChangeHandler(event) {
    const beforeChange = event.detail.before
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    if (changedColumn === 'loadedQty') {
      try {
        this._validateReleaseQty(changeRecord.loadedQty, beforeChange.releaseQty)
      } catch (e) {
        this._showToast(e)
        delete event.detail.after.loadedQty
      }
    }
  }

  _validateReleaseQty(loadedQty, pickedQty) {
    if (loadedQty > pickedQty || loadedQty <= 0) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    } else {
      return
    }
  }

  _validateRemainPallets(data) {
    openPopup(
      html`
        <return-pallet-check-popup
          .data="${data}"
          @complete="${() => {
            this._complete()
          }}"
        ></return-pallet-check-popup>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.check_return_pallet')
      }
    )
  }

  async _complete() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            completeLoading(${gqlBuilder.buildArgs({
              releaseGoodNo: this._releaseGoodNo
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) {
        await CustomAlert({
          title: i18next.t('title.completed'),
          text: i18next.t('text.loading_completed'),
          confirmButton: { text: i18next.t('button.confirm') }
        })

        this._releaseGoodNo = null
        this.releaseGoodNoInput.value = ''
        this._clearView()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _validateComplete() {
    if (!this._releaseGoodNo) throw new Error(i18next.t('text.there_is_no_release_order_no'))
  }

  _clearView() {
    this.pickedProductData = { records: [] }
    this.deliveryOrderData = { records: [] }
    this.loadedProductData = { records: [] }
    this.infoForm.reset()
    this.inputForm.reset()
    this._selectedTruck = null
    this._selectedTaskStatus = null
    this._selectedDeliveryOrder = null
    this._updateContext()
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

window.customElements.define('loading-product', LoadingProduct)
