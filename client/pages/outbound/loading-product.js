import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import {
  client,
  CustomAlert,
  gqlBuilder,
  isMobileDevice,
  navigate,
  PageView,
  store,
  UPDATE_CONTEXT
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { WORKSHEET_STATUS } from '../inbound/constants/worksheet'

class LoadingProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _releaseGoodNo: String,
      pickedProductConfig: Object,
      pickedProductData: Object,
      loadedProductConfig: Object,
      loadedProductData: Object,
      _selectedTaskStatus: String,
      _selectedDriver: String,
      _selectedTruck: String,
      _driverList: Object,
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
          overflow: hidden;
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

  get pickedProductGrist() {
    return this.shadowRoot.querySelector('data-grist#picked-product-grist')
  }

  get loadedProductGrist() {
    return this.shadowRoot.querySelector('data-grist#loaded-product-grist')
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
                if (this.releaseGoodNoInput.value) this._fetchInventories(this.releaseGoodNoInput.value)
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

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.loaded')}</h2>
          <data-grist
            id="loaded-product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.loadedProductConfig}
            .data=${this.loadedProductData}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form" @keypress="${this._loading.bind(this)}">
            <fieldset>
              <legend>${i18next.t('label.assign_truck_driver')}</legend>

              <label>${i18next.t('label.driver_name')}</label>
              <select @change=${e => (this._selectedDriver = e.target.value)} name="transportDriver">
                <option value="">-- ${i18next.t('text.please_select_a_driver')} --</option>

                ${Object.keys(this._driverList.data.transportDrivers.items || {}).map(key => {
                  let driver = this._driverList.data.transportDrivers.items[key]
                  return html`
                    <option value="${driver.id}">${driver.name} - ${driver.driverCode}</option>
                  `
                })}
              </select>

              <label>${i18next.t('label.lorry_no')}</label>
              <select @change=${e => (this._selectedTruck = e.target.value)} name="transportVehicle">
                <option value="">-- ${i18next.t('text.please_select_a_truck')} --</option>

                ${Object.keys(this._vehicleList.data.transportVehicles.items || {}).map(key => {
                  let vehicle = this._vehicleList.data.transportVehicles.items[key]
                  return html`
                    <option value="${vehicle.id}">${vehicle.name}</option>
                  `
                })}
              </select>
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.pickedProductData = { records: [] }
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
      actions = [{ title: i18next.t('button.complete'), action: this._complete.bind(this) }]
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
    this._driverList = { ...(await this.fetchDriverList()) }
    this._vehicleList = { ...(await this.fetchVehicleList()) }

    this.pickedProductConfig = {
      rows: {
        appendable: false,
        selectable: { multiple: true },
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (data.records.length && record) {
              if (this._selectedOrderInventory && this._selectedOrderInventory.name === record) {
                return
              }
              this._selectedTaskStatus = null
              this._selectedTaskStatus = record.status
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

    this.loadedProductConfig = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.palletId && this._selectedTruck) {
              this._selectedInventory = record
              this._selectedTruck = record.truckNo
            }
          }
        }
      },
      list: { fields: ['palletId', 'truckNo'] },
      pagination: {
        infinite: true
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
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
          type: 'string',
          name: 'truckNo',
          header: i18next.t('field.truck_no'),
          record: { align: 'left' },
          width: 140
        },
        {
          type: 'string',
          name: 'driver',
          header: i18next.t('field.driver'),
          record: { align: 'left' },
          width: 140
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

  async _fetchInventories(releaseGoodNo) {
    this._clearView()
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
              product {
                name
                description
              }
              qty
              releaseQty
              status
              description
              targetName
              packingType
              location {
                name
                description
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
            loadedQty: record.releaseQty
          }
        })
      }
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

  async _loading(e) {
    if (e.keyCode === 13) {
      try {
        this._validateLoading()
        const worksheetDetails = this.pickedProductGrist.selected.map(record => {
          record.name, record.loadedQty
        })
        let args = {
          worksheetDetails,
          releaseGoodNo: this._releaseGoodNo,
          transportDriver: { id: this._selectedDriver },
          transportVehicle: { id: this._selectedTruck }
        }

        const response = await client.query({
          query: gql`
              mutation {
                loading(${gqlBuilder.buildArgs(args)})
              }
            `
        })

        if (!response.errors) {
          this._fetchInventories(this._releaseGoodNo)
          this._fetchLoadedInventories(this._releaseGoodNo, this._selectedDriver, this._selectedVehicle)
          this._selectedTaskStatus = null
        }
      } catch (e) {
        this._showToast(e)
      }
    }
  }

  _validateLoading() {
    // 1. validate for input for driver and truck
    if (!this._selectedDriver || !this._selectedTruck)
      throw new Error(i18next.t('text.driver_and_vehicle_is_not_selected'))
  }

  async _fetchLoadedInventories(releaseGoodNo, transportDriver, transportVehicle) {
    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          loadedInventories(${gqlBuilder.buildArgs({
            releaseGoodNo,
            transportDriver,
            transportVehicle
          })}) {
            deliveryInfo {
              palletId
              batchId
              product {
                id
                name
                description
              }
              driver
              truckNo
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._selectedInventory = null
      this.loadedProductData = {
        records: response.data.loadedInventories.items
      }
    }
  }

  async fetchDriverList() {
    return await client.query({
      query: gql`
        query {
          transportDrivers (${gqlBuilder.buildArgs({
            filters: [],
            pagination: { page: 1, limit: 9999 }
          })}){
            items{
              id
              name
              description
              driverCode
              bizplace{
                id
                name
              }
            }
          }
        }`
    })
  }

  async fetchVehicleList() {
    return await client.query({
      query: gql`
        query {
          transportVehicles (${gqlBuilder.buildArgs({
            filters: [],
            pagination: { page: 1, limit: 9999 }
          })}){
            items{
              id
              name
              description
              bizplace{
                id
                name
              }
            }
          }
        }`
    })
  }

  async _complete() {
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
        this._clearView()
      }
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

  _validateComplete() {
    if (!this._releaseGoodNo) throw new Error(i18next.t('text.there_is_no_release_order_no'))
  }

  _clearView() {
    this.pickedProductData = { records: [] }
    this.loadedProductData = { records: [] }
    this.infoForm.reset()
    this.inputForm.reset()
    this._releaseGoodNo = ''
    this._selectedTaskStatus = null
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
