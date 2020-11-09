import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, navigate, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { fetchSettingRule } from '../../../fetch-setting-value'
import { ORDER_INVENTORY_STATUS, ORDER_TYPES } from '../../constants'

class CreateReturnOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      _returnNo: String,
      refNo: String,
      etaDate: Date,
      _checkTransport: Boolean,
      _ownTransport: Boolean,
      _warehouseTransport: Boolean,
      _enableTransportationServiceSetting: Boolean,
      _disableTransport: Boolean,
      inventoryGristConfig: Object,
      inventoryData: Object,
      vasGristConfig: Object,
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
        .container {
          flex: 1;
          display: flex;
          overflow-y: auto;
          min-height: 50vh;
        }
        .picking-std-container {
          margin-top: 0px;
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
      title: i18next.t('title.create_return_order'),
      actions: [{ title: i18next.t('button.submit'), action: this._generateReturnOrder.bind(this) }]
    }
  }

  render() {
    return html`
      <form name="returnOrder" class="multi-column-form" autocomplete="off">
        <fieldset>
          <legend>${i18next.t('title.return_order')}</legend>

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            ?disabled="${this._disableTransport}"
            @change="${e => {
              this._ownTransport = e.currentTarget.checked
              if (this._ownTransport) {
                this._warehouseTransportInput.checked = false
                this._warehouseTransport = false
              } else {
                this._warehouseTransportInput.checked = true
                this._warehouseTransport = true
              }
              this._validateTransport()
            }}"
          />
          <label for="ownTransport">${i18next.t('label.own_transport')}</label>

          <input
            id="warehouseTransport"
            type="checkbox"
            name="warehouseTransport"
            ?disabled="${this._disableTransport}"
            ?checked="${this._warehouseTransport}"
            @change="${e => {
              this._warehouseTransport = e.currentTarget.checked
              if (this._warehouseTransport) {
                this._ownTransportInput.checked = false
                this._ownTransport = false
              } else {
                this._ownTransportInput.checked = true
                this._ownTransport = true
              }
              this._validateTransport()
            }}"
          />
          <label for="warehouseTransport">${i18next.t('label.warehouse_transport')}</label>
        </fieldset>

        <fieldset>
          <legend ?hidden="${!this._checkTransport}"></legend>
          <label ?hidden="${!this._checkTransport}">${i18next.t('label.ref_no')}</label>
          <input name="refNo" ?hidden="${!this._checkTransport}" />

          <label ?hidden="${!this._checkTransport}">${i18next.t('label.eta_date')}</label>
          <input name="etaDate" type="date" ?hidden="${!this._checkTransport}" required />

          <label ?hidden="${!this._checkTransport}">${i18next.t('label.upload_documents')}</label>
          <file-uploader
            name="attachments"
            id="uploadDocument"
            label="${i18next.t('label.select_file')}"
            accept="*"
            multiple="true"
            ?hidden="${!this._checkTransport}"
            custom-input
          ></file-uploader>

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.do_no')}</label>
          <input name="deliveryOrderNo" ?hidden="${!this._ownTransport}" />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
          <input ?hidden="${!this._ownTransport}" name="truckNo" />
        </fieldset>
      </form>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.return_product_list')}</h2>

          <data-grist
            id="inventory-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.inventoryGristConfig}
            .data=${this.inventoryData}
            @record-change="${this._onProductChangeHandler.bind(this)}"
            @field-change="${this._onInventoryFieldChanged.bind(this)}"
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

          <data-grist
            id="vas-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.vasGristConfig}
            .data="${this.vasData}"
          ></data-grist>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.initProperties()
  }

  get returnOrderForm() {
    return this.shadowRoot.querySelector('form[name=returnOrder]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get _warehouseTransportInput() {
    return this.shadowRoot.querySelector('input[name=warehouseTransport]')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async pageInitialized() {
    this._enableTransportationServiceSetting = await fetchSettingRule('enable-transportation-service')
    this._validateTransport()

    this.inventoryGristConfig = {
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true }
      },
      list: { fields: ['inventory', 'product', 'location', 'releaseQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              try {
                const newData = data.records.filter((_, idx) => idx !== rowIndex)
                this.inventoryData = { ...this.inventoryData, records: newData }
                this.inventoryGrist.dirtyData.records = newData
                this._updateInventoryList()
              } catch (e) {
                this._showToast(e)
              }
            }
          }
        },
        {
          type: 'object',
          name: 'inventory',
          header: i18next.t('field.inventory_list'),
          record: {
            editable: true,
            align: 'left',
            options: {
              queryName: 'inventoriesByOrder',
              basicArgs: {
                filters: [
                  { name: 'status', operator: 'eq', value: ORDER_INVENTORY_STATUS.TERMINATED.value },
                  { name: 'type', operator: 'eq', value: ORDER_TYPES.RELEASE_OF_GOODS.value }
                ]
              },
              nameField: 'batchId',
              descriptionField: 'productName',
              select: [
                { name: 'id', hidden: true },
                { name: 'name', hidden: true },
                { name: 'productId', hidden: true },
                {
                  name: 'releaseGoodName',
                  header: i18next.t('field.ro'),
                  record: { align: 'center' }
                },
                {
                  name: 'batchId',
                  header: i18next.t('field.batch_no'),
                  record: { align: 'left' },
                  ignoreCondition: true
                },
                {
                  name: 'productName',
                  header: i18next.t('field.product_name'),
                  record: { align: 'left' },
                  width: 280,
                  ignoreCondition: true
                },
                {
                  name: 'packingType',
                  header: i18next.t('field.packing_type'),
                  record: { align: 'center' },
                  ignoreCondition: true
                },
                {
                  name: 'releaseQty',
                  header: i18next.t('field.return_qty'),
                  record: { align: 'center' },
                  ignoreCondition: true
                },
                {
                  name: 'releaseWeight',
                  header: i18next.t('field.return_weight'),
                  record: { align: 'center' },
                  ignoreCondition: true
                }
              ],
              list: {
                fields: ['releaseGoodName', 'batchId', 'productName', 'packingType', 'releaseQty', 'releaseWeight']
              }
            }
          },
          width: 300
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
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 140
        },
        {
          type: 'integer',
          name: 'returnQty',
          header: i18next.t('field.return_qty'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 140
        },
        {
          type: 'float',
          name: 'releaseWeight',
          header: i18next.t('field.release_weight'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 140
        },
        {
          type: 'float',
          name: 'returnWeight',
          header: i18next.t('field.return_weight'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 140
        }
      ]
    }
  }

  initProperties() {
    this.refNo = ''
    this._ownTransport = false
    this._warehouseTransport = false
    this._enableTransportationServiceSetting = false
    this._enableTransportForCustomClearanceSetting = false
    this._disableTransport = false

    this.inventoryData = { ...this.inventoryData, records: [] }
    this.vasData = { ...this.vasData, records: [] }
  }

  resetPage() {
    this._selectedVasRecord = null
    this._selectedVasRecordIdx = null
    this.initProperties()
    this._clearGristConditions()
    this._validateTransport()
  }

  _clearGristConditions() {
    if (this.inventoryGristConfig?.columns?.length) {
      this.inventoryGristConfig = {
        ...this.inventoryGristConfig,
        columns: this.inventoryGristConfig.columns.map(column => {
          if (column.name === 'inventory') {
            column.record.options.basicArgs = {
              filters: column.record.options.basicArgs.filters.filter(
                filter => filter.name !== 'batch_product' && filter.name !== 'id'
              )
            }
          }

          return column
        })
      }
    }
  }

  async _updateInventoryList() {
    const _selectedInventories = (this.inventoryGrist.dirtyData.records || []).map(record => record.inventory.id)
    this.inventoryGristConfig = {
      ...this.inventoryGristConfig,
      columns: this.inventoryGristConfig.columns.map(column => {
        if (column.name === 'inventory') {
          column.record.options.basicArgs = {
            ...column.record.options.basicArgs,
            filters: [...column.record.options.basicArgs.filters.filter(filter => filter.name !== 'id')]
          }

          if (_selectedInventories.length)
            column.record.options.basicArgs.filters = [
              ...column.record.options.basicArgs.filters,
              {
                name: 'inventoryId',
                value: _selectedInventories,
                operator: 'notin'
              }
            ]
        }

        return column
      })
    }
  }

  //Fields Changed Handler
  _onInventoryFieldChanged(e) {
    let columnName = e.detail.column.name
    let roundedWeight = e.detail.record.roundedWeight || 0
    let returnQty = 0

    if (columnName == 'returnWeight' || columnName == 'returnQty') {
      let packageWeight = e.detail.record.releaseWeight / e.detail.record.releaseQty
      if (
        e.detail.record.releaseWeight &&
        e.detail.record.releaseQty &&
        e.detail.record.releaseWeight > 0 &&
        e.detail.record.releaseQty > 0
      ) {
        if (columnName === 'returnQty') {
          returnQty = e.detail.after || 0
        } else {
          returnQty = Math.round(e.detail.after / packageWeight)
        }

        roundedWeight = returnQty * packageWeight
        roundedWeight = parseFloat(roundedWeight.toFixed(2))
      }
    }

    this.inventoryData = {
      ...this.inventoryGrist.dirtyData,
      records: this.inventoryGrist.dirtyData.records.map((record, idx) => {
        if ((columnName == 'returnWeight' || columnName == 'returnQty') && idx === e.detail.row) {
          if (columnName == 'returnWeight') record.returnQty = returnQty
          record.returnWeight = roundedWeight
        }

        let returnObj = {
          ...record,
          ...record.inventory
        }

        return returnObj
      })
    }
  }

  _onProductChangeHandler(event) {
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    try {
      if (changedColumn === 'returnQty') {
        this._validateReleaseQty(changeRecord.returnQty, changeRecord.releaseQty)
      } else if (changedColumn === 'returnWeight') {
        this._validateReleaseWeight(changeRecord.returnWeight, changeRecord.releaseWeight)
      }
      this._updateInventoryList()
    } catch (e) {
      const beforeValue = event.detail.before && event.detail.before[event.detail.column.name]
      if (beforeValue) {
        event.detail.after[event.detail.column.name] = beforeValue
      } else {
        delete event.detail.after[event.detail.column.name]
      }
      this._showToast(e)
    }
  }

  //Validation
  _validateReleaseQty(returnQty, releaseQty) {
    if (releaseQty === undefined) throw new Error(i18next.t('text.there_is_no_selected_items'))
    if (returnQty > releaseQty) {
      throw new Error(i18next.t('text.available_quantity_insufficient'))
    } else if (releaseQty <= 0) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    }
  }

  _validateReleaseWeight(returnWeight, releaseWeight) {
    if (releaseWeight === undefined) throw new Error(i18next.t('text.there_is_no_selected_items'))
    if (returnWeight > releaseWeight) {
      throw new Error(i18next.t('text.available_weight_insufficient'))
    } else if (returnWeight <= 0) {
      throw new Error(i18next.t('text.invalid_weight_input'))
    }
  }

  _validateTransport() {
    //Check if warehouse provide transport
    if (!this._enableTransportationServiceSetting) {
      this._disableTransport = true
      this._ownTransportInput.checked = true
      this._ownTransport = true
    }

    if (this._ownTransport || this._warehouseTransport) {
      this._checkTransport = true
    }
  }

  _validateForm() {
    if (!this.returnOrderForm.checkValidity()) {
      throw new Error(i18next.t('text.return_order_form_invalid'))
    }

    if (this._ownTransport && this._warehouseTransport) {
      throw new Error(i18next.t('text.you_can_only_select_one_transport_type'))
    } else if (!this._ownTransport && !this._warehouseTransport) {
      throw new Error(i18next.t('text.please_select_transport_type'))
    }
  }

  _validateInventories() {
    const inventories = this.inventoryGrist?.dirtyData?.records
    if (!inventories?.length) throw new Error(i18next.t('text.no_products'))
    // required field (batchId, packingType, weight, unit, packQty)
    if (!inventories.every(record => record.returnQty && record.batchId && record.packingType)) {
      throw new Error(i18next.t('text.empty_value_in_list'))
    }

    if (inventories.some(record => record.returnQty > record.releaseQty)) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    }

    // duplication of pallet id
    // const palletIds = inventories.map(inv => inv.palletId)
    // if (palletIds.some((palletId, idx, palletIds) => palletIds.indexOf(palletId) !== idx)) {
    //   throw new Error(i18next.t('text.pallet_id_is_duplicated'))
    // }
  }

  _validateVas() {
    if (!this.vasGrist.dirtyData.records.every(record => record.ready)) throw new Error('there_is_not_ready_vas')
  }

  //Generate Order
  async _generateReturnOrder() {
    try {
      this._validateForm()
      this._validateInventories()
      this._validateVas()

      let result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_return_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      await this._executeRelatedTrxs()
      let returnOrder = this._serializeForm(this.returnOrderForm)
      delete returnOrder.warehouseTransport
      returnOrder.orderInventories = this._getOrderInventories()
      returnOrder.orderVass = this._getOrderVass()
      returnOrder.ownTransport = this._ownTransport
      let args = { returnOrder }

      const attachments = this._document?.files ? this._document.files : undefined
      const response = await client.query({
        query: gql`
              mutation ($attachments: Upload) {
                generateReturnOrder(${gqlBuilder.buildArgs(args)}, file:$attachments) {
                  id
                  name
                }
              }
            `,
        variables: {
          attachments
        },
        context: {
          hasUpload: true
        }
      })

      if (!response.errors) {
        this.resetPage()
        navigate(`return_order_detail/${response.data.generateReturnOrder.name}`)
        this._showToast({ message: i18next.t('text.return_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _executeRelatedTrxs() {
    if (!this.vasGrist?.dirtyData?.records?.length) return

    this.vasData = {
      ...this.vasData,
      records: await (async () => {
        const records = this.vasGrist.dirtyData.records
        for (let record of records) {
          const orderVass = record.orderVass
          for (let orderVas of orderVass) {
            if (orderVas.operationGuide && orderVas.operationGuide.transactions) {
              const trxs = orderVas.operationGuide.transactions
              for (let trx of trxs) {
                orderVas.operationGuide = await trx(orderVas.operationGuide)
              }
            }
          }
        }
      })()
    }
  }

  _getOrderInventories() {
    return this.inventoryGrist.data.records.map(record => {
      let newRecord = {
        returnQty: record.returnQty,
        returnWeight: record.returnWeight,
        batchId: record.inventory.batchId,
        packingType: record.inventory.packingType,
        type: ORDER_TYPES.RETURN_ORDER.value,
        status: ORDER_INVENTORY_STATUS.PENDING.value
      }

      newRecord.product = { id: record.inventory.productId, name: record.inventory.productName }
      newRecord.inventory = { id: record.id }

      return newRecord
    })
  }

  _getOrderVass() {
    if (!this.vasGrist?.dirtyData?.records?.length) return []

    const records = this.vasGrist.dirtyData.records

    return records
      .map((record, idx) => {
        const orderVass = record.orderVass
        return orderVass.map(orderVas => {
          let result = {
            set: idx + 1,
            vas: { id: orderVas.vas.id },
            remark: orderVas.remark,
            targetType: record.targetType,
            qty: record.qty,
            packingType: record.packingType
          }

          if (orderVas.operationGuide && orderVas.operationGuide.data) {
            result.operationGuide = JSON.stringify(orderVas.operationGuide)
          }

          if (record.targetType === VAS_BATCH_NO_TYPE) {
            result.targetBatchId = record.target
          } else if (record.targetType === VAS_PRODUCT_TYPE) {
            result.targetProduct = { id: record.target }
          } else if (record.targetType === VAS_BATCH_AND_PRODUCT_TYPE) {
            result.targetBatchId = record.target.batchId
            result.targetProduct = { id: record.target.productId }
            result.weight = record.weight
          } else {
            result.otherTarget = record.target
            delete result.qty
            delete result.packingType
          }

          return result
        })
      })
      .flat()
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

window.customElements.define('create-return-order', CreateReturnOrder)
