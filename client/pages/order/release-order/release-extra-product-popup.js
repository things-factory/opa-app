import { client, CustomAlert, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { i18next, localize } from '@things-factory/i18n-base'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import '@things-factory/grist-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import {
  LOCATION_SORTING_RULE,
  INVENTORY_STATUS,
  PICKING_STANDARD,
  ORDER_TYPES,
  ORDER_INVENTORY_STATUS
} from '../../constants'
import { fetchLocationSortingRule } from '../../../fetch-location-sorting-rule'

export class ReleaseExtraProductPopup extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      MultiColumnFormStyles,
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }
        .picking-std-container {
          margin-top: 0px;
        }
        .container {
          flex: 1;
          display: flex;
          overflow-y: auto;
          min-height: 50vh;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
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
        .button-container {
          padding: var(--button-container-padding);
          margin: var(--button-container-margin);
          text-align: var(--button-container-align);
          background-color: var(--button-container-background);
          height: var(--button-container-height);
        }
        .button-container button {
          background-color: var(--button-container-button-background-color);
          border-radius: var(--button-container-button-border-radius);
          height: var(--button-container-button-height);
          border: var(--button-container-button-border);
          margin: var(--button-container-button-margin);

          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container button:hover,
        .button-container button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  static get properties() {
    return {
      releaseGoodNo: String,
      bizplace: Object,
      config: Object,

      _selectedInventories: Array,
      _pickingStd: String,
      inventoryGristConfig: Object,
      inventoryData: Object
    }
  }

  render() {
    return html`
      <form class="picking-std-container multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.inventory_selection_strategy')}</legend>
          <input
            id="pick-by-prod"
            name="picking-std"
            type="radio"
            value="${PICKING_STANDARD.SELECT_BY_PRODUCT.value}"
            @change="${e => {
              this._pickingStd = e.currentTarget.value
            }}"
            .checked="${this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value}"
            checked
          />
          <label for="pick-by-prod">${i18next.t(PICKING_STANDARD.SELECT_BY_PRODUCT.name)}</label>

          <input
            id="pick-by-pallet"
            name="picking-std"
            type="radio"
            value="${PICKING_STANDARD.SELECT_BY_PALLET.value}"
            @change="${e => {
              this._pickingStd = e.currentTarget.value
            }}"
            .checked="${this._pickingStd === PICKING_STANDARD.SELECT_BY_PALLET.value}"
          />
          <label for="pick-by-pallet">${i18next.t(PICKING_STANDARD.SELECT_BY_PALLET.name)}</label>
        </fieldset>
      </form>

      <div class="container">
        <div class="grist">
          <h2>
            <mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_product_list')}${` [${i18next.t(
              PICKING_STANDARD[this._pickingStd].name
            )}]`}
          </h2>
          <data-grist
            id="inventory-grist"
            .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
            .config="${this.inventoryGristConfig}"
            .data="${this.inventoryData}"
            @record-change="${this._onProductChangeHandler.bind(this)}"
            @field-change="${this._onInventoryFieldChanged.bind(this)}"
          ></data-grist>
        </div>
      </div>

      <div class="button-container">
        <button
          @click="${() => {
            history.back()
          }}"
        >
          ${i18next.t('button.cancel')}
        </button>
        <button @click="${this._addExtraProducts.bind(this)}">
          ${i18next.t('button.add')}
        </button>
      </div>
    `
  }

  constructor() {
    super()
    this.initProperties()
    this._pickingStd = PICKING_STANDARD.SELECT_BY_PRODUCT.value
  }

  initProperties() {
    this.inventoryData = { ...this.inventoryData, records: [] }
  }

  async updated(changeProps) {
    if (changeProps.has('_pickingStd')) {
      await this.switchPickingType()
    }
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  async switchPickingType() {
    this.resetPage()
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
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
                queryName: 'inventoryProductGroup',
                basicArgs: { filters: [] },
                nameField: 'batchId',
                descriptionField: 'productName',
                select: [
                  { name: 'productId', hidden: true },
                  { name: 'batchId', header: i18next.t('field.batch_no'), record: { align: 'left' } },
                  { name: 'productName', header: i18next.t('field.product'), record: { align: 'left' }, width: 280 },
                  { name: 'packingType', header: i18next.t('field.packing_type'), record: { align: 'center' } },
                  {
                    name: 'remainQty',
                    header: i18next.t('field.remain_qty'),
                    record: { align: 'center' },
                    ignoreCondition: true
                  },
                  {
                    name: 'remainWeight',
                    header: i18next.t('field.remain_weight'),
                    record: { align: 'center' },
                    ignoreCondition: true
                  }
                ],
                list: { fields: ['batchId', 'productName', 'packingType', 'remainQty', 'remainWeight'] }
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
            name: 'remainQty',
            header: i18next.t('field.available_qty'),
            record: { align: 'center' },
            width: 140
          },
          {
            type: 'integer',
            name: 'releaseQty',
            header: i18next.t('field.release_qty'),

            record: { editable: true, align: 'center', options: { min: 0 } },
            width: 140
          },
          {
            type: 'float',
            name: 'remainWeight',
            header: i18next.t('field.available_weight'),
            record: { align: 'center' },
            width: 140
          },
          {
            type: 'float',
            name: 'releaseWeight',
            header: i18next.t('field.release_weight'),
            record: { editable: true, align: 'center', options: { min: 0 } },
            width: 140
          }
        ]
      }
    } else {
      const locationSortingRules = await fetchLocationSortingRule(LOCATION_SORTING_RULE.CREATE_RELEASE_ORDER.value)
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
                const newData = data.records.filter((_, idx) => idx !== rowIndex)
                this.inventoryData = { ...this.inventoryData, records: newData }
                this.inventoryGrist.dirtyData.records = newData
                this._updateInventoryList()
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
                queryName: 'inventoriesByPallet',
                basicArgs: {
                  filters: [{ name: 'status', operator: 'eq', value: INVENTORY_STATUS.STORED.value }],
                  locationSortingRules
                },
                nameField: 'batchId',
                descriptionField: 'palletId',
                select: [
                  { name: 'id', hidden: true },
                  { name: 'name', hidden: true },
                  { name: 'palletId', header: i18next.t('field.pallet_id'), record: { align: 'center' } },
                  { name: 'product', type: 'object', queryName: 'products' },
                  { name: 'batchId', header: i18next.t('field.batch_no'), record: { align: 'center' } },
                  {
                    name: 'location',
                    type: 'object',
                    queryName: 'locations',
                    field: 'name',
                    record: { align: 'center' }
                  },
                  { name: 'packingType', header: i18next.t('field.packing_type'), record: { align: 'center' } },
                  { name: 'remainQty', type: 'float', record: { align: 'center' } },
                  {
                    name: 'remainWeight',
                    type: 'float',
                    header: i18next.t('field.total_weight'),
                    record: { align: 'center' }
                  }
                ],
                list: { fields: ['palletId', 'product', 'batchId', 'location', 'remainWeight'] }
              }
            },
            width: 250
          },
          {
            type: 'object',
            name: 'product',
            header: i18next.t('field.product'),
            record: { align: 'left' },
            width: 150
          },
          {
            type: 'object',
            name: 'location',
            header: i18next.t('field.location'),
            record: { align: 'center' },
            width: 150
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
            name: 'remainQty',
            header: i18next.t('field.available_qty'),
            record: { align: 'center' },
            width: 100
          },
          {
            type: 'integer',
            name: 'releaseQty',
            header: i18next.t('field.release_qty'),
            record: { editable: true, align: 'center', options: { min: 0 } },
            width: 100
          },
          {
            type: 'float',
            name: 'remainWeight',
            header: i18next.t('field.available_weight'),
            record: { align: 'center' },
            width: 100
          },
          {
            type: 'float',
            name: 'releaseWeight',
            header: i18next.t('field.release_weight'),
            record: { editable: true, align: 'center', options: { min: 0 } },
            width: 100
          }
        ]
      }
    }
  }

  resetPage() {
    this.initProperties()
    this._clearGristConditions()
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

  _updateInventoryList() {
    if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
      const _selectedInv = (this.inventoryGrist.dirtyData.records || []).map(record => {
        return {
          batchId: record.inventory.batchId,
          packingType: record.inventory.packingType,
          productId: record.inventory.productId
        }
      })

      const config = {
        ...this.inventoryGristConfig,
        columns: this.inventoryGristConfig.columns.map(column => {
          if (column.name === 'inventory') {
            column.record.options.basicArgs = {
              ...column.record.options.basicArgs,
              filters: [...column.record.options.basicArgs.filters.filter(filter => filter.name !== 'batch_product')]
            }

            if (_selectedInv.length)
              column.record.options.basicArgs.filters = [
                ...column.record.options.basicArgs.filters,
                {
                  name: 'batch_product',
                  value: _selectedInv,
                  operator: 'notin'
                }
              ]
          }

          return column
        })
      }
      this.inventoryGristConfig = { ...this.inventoryGristConfig }
    } else {
      const _selectedInventories = (this.inventoryGrist.dirtyData.records || []).map(record => record.inventory.id)

      const config = {
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
                  name: 'id',
                  value: _selectedInventories,
                  operator: 'notin'
                }
              ]
          }

          return column
        })
      }

      this.inventoryGristConfig = { ...config }
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  _onInventoryFieldChanged(e) {
    let columnName = e.detail.column.name
    let roundedWeight = e.detail.record.roundedWeight || 0
    let releaseQty = 0

    if (columnName == 'releaseWeight' || columnName == 'releaseQty') {
      let packageWeight = e.detail.record.remainWeight / e.detail.record.remainQty
      if (
        e.detail.record.remainWeight &&
        e.detail.record.remainQty &&
        e.detail.record.remainWeight > 0 &&
        e.detail.record.remainQty > 0
      ) {
        if (columnName === 'releaseQty') {
          releaseQty = e.detail.after || 0
        } else {
          releaseQty = Math.round(e.detail.after / packageWeight)
        }

        roundedWeight = releaseQty * packageWeight
        roundedWeight = parseFloat(roundedWeight.toFixed(2))
      }
    }

    this.inventoryData = {
      ...this.inventoryGrist.dirtyData,
      records: this.inventoryGrist.dirtyData.records.map((record, idx) => {
        if ((columnName == 'releaseWeight' || columnName == 'releaseQty') && idx === e.detail.row) {
          if (columnName == 'releaseWeight') record.releaseQty = releaseQty
          record.releaseWeight = roundedWeight
        }

        let returnObj = {
          ...record,
          ...record.inventory
        }

        if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
          returnObj.product = {
            id: record.inventory.productId,
            name: record.inventory.productName
          }
        }

        return returnObj
      })
    }
  }

  _onProductChangeHandler(event) {
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    try {
      if (changedColumn === 'releaseQty') {
        this._validateReleaseQty(changeRecord.releaseQty, changeRecord.remainQty)
      } else if (changedColumn === 'releaseWeight') {
        this._validateReleaseWeight(changeRecord.releaseWeight, changeRecord.remainWeight)
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

  _validateReleaseQty(releaseQty, remainQty) {
    if (remainQty === undefined) throw new Error(i18next.t('text.there_is_no_selected_items'))
    if (releaseQty > remainQty) {
      throw new Error(i18next.t('text.available_quantity_insufficient'))
    } else if (releaseQty <= 0) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    }
  }

  _validateReleaseWeight(releaseWeight, remainWeight) {
    if (remainWeight === undefined) throw new Error(i18next.t('text.there_is_no_selected_items'))
    if (releaseWeight > remainWeight) {
      throw new Error(i18next.t('text.available_weight_insufficient'))
    } else if (releaseWeight <= 0) {
      throw new Error(i18next.t('text.invalid_weight_input'))
    }
  }

  async _addExtraProducts() {
    try {
      this._validateProducts()
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.add_extra_product'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      const response = await client.query({
        query: gql`
          mutation {
            addReleaseGoodProducts(${gqlBuilder.buildArgs({
              ...this._getReleaseData()
            })})
          }
        `
      })

      if (!response.errors) {
        await CustomAlert({
          title: i18next.t('title.extra_products'),
          text: i18next.t('text.extra_products_were_added'),
          confirmButton: { text: i18next.t('button.confirm') }
        })

        this.dispatchEvent(new CustomEvent('completed'))
        history.back()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getReleaseData() {
    let data = {
      name: this.releaseGoodNo,
      orderInventories: this.inventoryGrist.data.records.map(record => {
        let newRecord = {
          releaseQty: record.releaseQty,
          releaseWeight: record.releaseWeight,
          batchId: record.inventory.batchId,
          packingType: record.inventory.packingType,
          type: ORDER_TYPES.RELEASE_OF_GOODS.value,
          status: ORDER_INVENTORY_STATUS.PENDING.value
        }

        if (record.isCrossDocking) newRecord.crossDocking = true

        if (this._pickingStd === PICKING_STANDARD.SELECT_BY_PRODUCT.value) {
          newRecord.product = { id: record.inventory.productId, name: record.inventory.productName }
        } else {
          newRecord.product = { id: record.inventory.product.id, name: record.inventory.product.name }
          newRecord.inventory = { id: record.id }
        }

        return newRecord
      })
    }

    return data
  }

  _validateProducts() {
    // no records
    if (!this.inventoryGrist.dirtyData.records || !this.inventoryGrist.dirtyData.records.length)
      throw new Error(i18next.t('text.no_products'))
    // required field (batchId, packingType, weight, unit, packQty, palletQty)
    if (
      this.inventoryGrist.dirtyData.records.filter(
        record => !record.batchId || !record.packingType || !record.releaseWeight || !record.releaseQty
      ).length
    )
      throw new Error(i18next.t('text.empty_value_in_list'))
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

window.customElements.define('release-extra-product-popup', ReleaseExtraProductPopup)
