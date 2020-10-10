import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { fetchLocationSortingRule } from '../../fetch-location-sorting-rule'
import { LOCATION_SORTING_RULE, ORDER_INVENTORY_STATUS, WORKSHEET_STATUS } from '../constants'

const VIEW_TYPE = {
  LOCATION_SELECTED: 'LOCATION_SELECTED',
  INVENTORY_SELECTED: 'INVENTORY_SELECTED',
  MISSING_PALLET_SELECTED: 'MISSING_PALLET_SELECTED'
}

class InspectingProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      cycleCountNo: String,
      locationConfig: Object,
      locationData: Object,
      inventoryConfig: Object,
      inventoryData: Object,
      selectedLocation: Object,
      selectedInventory: Object,
      viewType: String,
      missingInventoryConfig: Object,
      missingInventoryData: Object,
      formattedLocations: Array,
      warehouses: Array,
      zones: Array,
      rows: Array,
      columns: Array
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
          overflow: auto;
        }

        .left-column {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
        }

        .right-column {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
        }
        .right-column > div#input-form-container {
          flex: 1;
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
      `
    ]
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.inventory_check_no')}</label>
          <barcode-scanable-input
            name="cycleCountNo"
            custom-input
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.cycleCountNoInput.value) {
                  this.clearView()
                  this.updateContext()
                  this.cycleCountNo = this.cycleCountNoInput.value
                  this.fetchCycleCountWorksheet()
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>
            ${`${i18next.t('title.inventory_inspection')} ${`: ${this.cycleCountNo ? this.cycleCountNo : ''}`}`}
          </legend>

          <label>${i18next.t('label.customer')}</label>
          <input name="bizplace" readonly />

          <label>${i18next.t('label.started_at')}</label>
          <input name="startedAt" type="datetime-local" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <form id="condition-form" class="multi-column-form" @change="${this.fillUpGrist.bind(this)}">
            <fieldset>
              <label>${i18next.t('field.warehouse')}</label>
              <select name="warehouse" .disabled="${!this.formattedLocations?.length}">
                <option></option>
                ${this.warehouses.map(warehouse => html` <option>${warehouse}</option> `)}
              </select>

              <label>${i18next.t('field.zone')}</label>
              <select name="zone" .disabled="${!this.formattedLocations?.length}">
                <option></option>
                ${this.zones.map(zone => html`<option>${zone}</option>`)}
              </select>

              <label>${i18next.t('field.row')}</label>
              <select name="row" .disabled="${!this.formattedLocations?.length}">
                <option selected></option>
                ${this.rows.map(row => html`<option ?selected="${row === this.selectedRow}">${row}</option>`)}
              </select>

              <label>${i18next.t('field.column')}</label>
              <select name="column" .disabled="${!this.formattedLocations?.length}">
                <option selected></option>
                ${this.columns.map(
                  column => html`<option ?selected="${column === this.selectedColumn}">${column}</option>`
                )}
              </select>
            </fieldset>
          </form>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.location')}</h2>
          <data-grist
            id="location-grist"
            .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
            .config="${this.locationConfig}"
            .data="${this.locationData}"
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.inventories')}</h2>
          <data-grist
            id="inventory-grist"
            .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
            .config="${this.inventoryConfig}"
            .data="${this.inventoryData}"
          ></data-grist>
        </div>

        <div class="right-column">
          ${this.selectedLocation
            ? html`
                <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.missing_pallets')}</h2>
                <data-grist
                  id="missing-inventory-grist"
                  .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
                  .config="${this.missingInventoryConfig}"
                  .data="${this.missingInventoryData}"
                ></data-grist>
              `
            : ''}

          <div id="input-form-container">
            <form
              id="input-form"
              class="single-column-form"
              @keypress="${e => {
                if (e.keyCode === 13) {
                  if (!this.selectedInventory) {
                    this.addExtraPallet()
                  } else if (!this.selectedInventory.completed) {
                    this.submitInventoryCheck()
                  }
                }
              }}"
            >
              <fieldset>
                <legend>
                  ${i18next.t('field.inventory')}:
                  ${this.selectedInventory?.productName ? this.selectedInventory.productName : ''}
                  (${this.selectedInventory?.productDescription ? this.selectedInventory.productDescription : ''})
                </legend>

                <label>${i18next.t('field.pallet_id')}</label>
                ${this.viewType === VIEW_TYPE.LOCATION_SELECTED
                  ? html` <barcode-scanable-input name="palletId" custom-input></barcode-scanable-input> `
                  : html` <input name="palletId" readonly .value="${this.selectedInventory?.palletId || ''}" /> `}

                <label>${i18next.t('label.inspected_batch_no')}</label>
                <input
                  name="inspectedBatchNo"
                  .value="${this.selectedInventory?.batchId
                    ? this.selectedInventory?.inspectedBatchNo
                      ? this.selectedInventory.inspectedBatchNo
                      : this.selectedInventory.batchId
                    : ''}"
                />

                <label>${i18next.t('label.inspected_qty')}</label>
                <input
                  name="inspectedQty"
                  type="number"
                  .value="${this.selectedInventory?.qty
                    ? this.selectedInventory?.inspectedQty
                      ? this.selectedInventory.inspectedQty
                      : this.selectedInventory.qty
                    : ''}"
                />

                <label>${i18next.t('label.inspected_weight')}</label>
                <input
                  name="inspectedWeight"
                  type="number"
                  step=".01"
                  .value="${this.selectedInventory?.weight
                    ? this.selectedInventory?.inspectedWeight
                      ? this.selectedInventory.inspectedWeight
                      : this.selectedInventory.weight
                    : ''}"
                />

                ${this.viewType === VIEW_TYPE.LOCATION_SELECTED
                  ? html`
                      <label>${i18next.t('label.location')}</label>
                      <input name="location" .value="${this.selectedLocation?.name || ''}" />
                    `
                  : ''}
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.locationData = { records: [] }
    this.inventoryData = { records: [] }
    this.formattedLocations = []
    this.warehouses = []
    this.zones = []
    this.rows = []
    this.columns = []
  }

  get context() {
    return {
      title: i18next.t('title.inventory_inspection')
    }
  }

  get infoForm() {
    return this.renderRoot.querySelector('form#info-form')
  }

  get inputForm() {
    return this.renderRoot.querySelector('form#input-form')
  }

  get conditionForm() {
    return this.renderRoot.querySelector('form#condition-form')
  }

  get warehouseSelector() {
    return this.conditionForm.querySelector('select[name=warehouse]')
  }

  get zoneSelector() {
    return this.conditionForm.querySelector('select[name=zone]')
  }

  get rowSelector() {
    return this.conditionForm.querySelector('select[name=row]')
  }

  get columnSelector() {
    return this.conditionForm.querySelector('select[name=column]')
  }

  get cycleCountNoInput() {
    return this.renderRoot.querySelector('barcode-scanable-input[name=cycleCountNo]').renderRoot.querySelector('input')
  }

  get palletIdInput() {
    if (this.viewType === VIEW_TYPE.LOCATION_SELECTED) {
      return this.renderRoot.querySelector('barcode-scanable-input[name=palletId]').renderRoot.querySelector('input')
    } else {
      return this.renderRoot.querySelector('input[name=palletId]')
    }
  }

  get inspectedBatchNoInput() {
    return this.renderRoot.querySelector('input[name=inspectedBatchNo]')
  }

  get inspectedQtyInput() {
    return this.renderRoot.querySelector('input[name=inspectedQty]')
  }

  get inspectedQtyInput() {
    return this.renderRoot.querySelector('input[name=inspectedQty]')
  }

  get inspectedWeightInput() {
    return this.renderRoot.querySelector('input[name=inspectedWeight]')
  }

  get inspectedWeightInput() {
    return this.renderRoot.querySelector('input[name=inspectedWeight]')
  }

  selectOnInput(input) {
    setTimeout(() => input.select(), 100)
  }

  async pageInitialized() {
    this.locationSortingRules = await fetchLocationSortingRule(LOCATION_SORTING_RULE.INSPECTING_PRODUCT.value)

    this.locationConfig = {
      pagination: { infinite: true },
      rows: {
        appendable: false,
        handlers: {
          click: async (columns, data, column, record, rowIndex) => {
            if (!this.selectedLocation?.id !== record.id) {
              this.selectedInventory = null
              this.selectedLocation = record
              this.inventoryData = { records: this.selectedLocation.inventories }
              this.viewType = VIEW_TYPE.LOCATION_SELECTED
              this.updateContext(this.viewType)
              await this.updateComplete
              this.selectOnInput(this.palletIdInput)
            }
          }
        }
      },
      list: { fields: ['completed', 'name', 'palletQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'boolean', name: 'completed', header: i18next.t('button.completed'), width: 80 },
        { type: 'string', name: 'name', header: i18next.t('field.name'), record: { align: 'center' }, width: 150 },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { align: 'center' },
          width: 80
        }
      ]
    }

    this.inventoryConfig = {
      pagination: { infinite: true },
      rows: {
        appendable: false,
        handlers: {
          click: async (columns, data, column, record, rowIndex) => {
            if (!this.selectedInventory?.id !== record.id) {
              this.selectedInventory = record
              this.viewType = VIEW_TYPE.INVENTORY_SELECTED
              this.updateContext(this.viewType)
              await this.updateComplete
              this.selectOnInput(this.inspectedBatchNoInput)
            }
          }
        }
      },
      list: {
        fields: [
          'completed',
          'palletId',
          'batchId',
          'inspectedBatchNo',
          'qty',
          'inspectedQty',
          'weight',
          'inspectedWeight',
          'inspectedLocation'
        ]
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'boolean', name: 'completed', header: i18next.t('button.completed'), width: 80 },
        { type: 'string', name: 'palletId', header: i18next.t('label.pallet_id'), width: 160 },
        {
          type: 'string',
          name: 'orderInventoryStatus',
          header: i18next.t('label.status'),
          record: { align: 'center' },
          width: 100
        },
        { type: 'string', name: 'batchId', header: i18next.t('label.batch_id'), width: 120 },
        {
          type: 'string',
          name: 'inspectedBatchNo',
          header: i18next.t('label.inspected_batch_no'),
          width: 100,
          record: { align: 'center' }
        },
        { type: 'integer', name: 'qty', header: i18next.t('label.qty'), width: 80, record: { align: 'center' } },
        {
          type: 'integer',
          name: 'inspectedQty',
          header: i18next.t('label.inspected_qty'),
          width: 100,
          record: { align: 'center' }
        },
        { type: 'float', name: 'weight', header: i18next.t('label.weight'), width: 80, record: { align: 'center' } },
        {
          type: 'float',
          name: 'inspectedWeight',
          header: i18next.t('label.inspected_weight'),
          width: 100,
          record: { align: 'center' }
        },
        {
          type: 'object',
          name: 'inspectedLocation',
          header: i18next.t('label.inspected_location'),
          width: 100,
          record: { align: 'center' }
        }
      ]
    }

    const missingInventoryColumns = ['sequence', 'palletId', 'batchId', 'qty', 'weight']
    this.missingInventoryConfig = {
      pagination: { infinite: true },
      rows: {
        appendable: false,
        handlers: {
          click: async (columns, data, column, record, rowIndex) => {
            if (!this.selectedInventory?.id !== record.id) {
              this.selectedInventory = record
              this.viewType = VIEW_TYPE.MISSING_PALLET_SELECTED
              this.selectOnInput(this.inspectedBatchNoInput)
              this.updateContext(this.viewType)
            }
          }
        }
      },
      list: { fields: missingInventoryColumns },
      columns: this.inventoryConfig.columns.filter(
        col => missingInventoryColumns.indexOf(col.name ? col.name : col.gutterName) >= 0
      )
    }
  }

  pageUpdated() {
    if (this.active) {
      this.selectOnInput(this.cycleCountNoInput)
    }
  }

  async fetchCycleCountWorksheet() {
    const response = await client.query({
      query: gql`
        query {
          cycleCountWorksheet(${gqlBuilder.buildArgs({
            inventoryCheckNo: this.cycleCountNo,
            locationSortingRules: this.locationSortingRules
          })}) {
            worksheetInfo {
              startedAt
              bizplace {
                id
                name
                description
              }
            }
            worksheetDetailInfos {
              name
              palletId
              batchId
              qty
              weight
              status
              inspectedBatchNo
              inspectedQty
              inspectedWeight
              inspectedLocation {
                id
                name
                warehouse {
                  name
                }
                zone
                column
                row
              }
              product {
                name
                description
              }
              description
              location {
                id
                name
                warehouse {
                  name
                }
                zone
                column
                row
              }
              relatedOrderInv {
                status
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      const worksheetInfo = response.data.cycleCountWorksheet.worksheetInfo
      const worksheetDetailInfos = response.data.cycleCountWorksheet.worksheetDetailInfos
      this.fillUpForm(this.infoForm, worksheetInfo)
      this.formattedLocations = this.formatLocations(worksheetDetailInfos)
      this.missingInventoryData = { records: this.formatMissingInventories(worksheetDetailInfos) }
      this.fillUpGrist()
      this.updateContext()
    }
  }

  formatLocations(worksheetDetailInfos) {
    const locations = worksheetDetailInfos.reduce((locations, wsdInfo) => {
      if (wsdInfo.relatedOrderInv.status !== 'MISSING') {
        const idx = locations.findIndex(loc => {
          if (wsdInfo.inspectedLocation) {
            return loc.name === wsdInfo.inspectedLocation.name
          }
          return loc.name === wsdInfo.location.name
        })
        if (idx >= 0) {
          locations[idx].palletQty++
          locations[idx].inventories.push(this.formatInventory(wsdInfo))
        } else {
          locations.push({
            id: wsdInfo.inspectedLocation?.id || wsdInfo.location.id,
            name: wsdInfo.inspectedLocation?.name || wsdInfo.location.name,
            palletQty: 1,
            inventories: [this.formatInventory(wsdInfo)],
            warehouse: wsdInfo.inspectedLocation?.warehouse || wsdInfo.location.warehouse,
            zone: wsdInfo.inspectedLocation?.zone || wsdInfo.location.zone,
            column: wsdInfo.inspectedLocation?.column || wsdInfo.location.column,
            row: wsdInfo.inspectedLocation?.row || wsdInfo.location.row
          })
        }
      }

      return locations
    }, [])

    worksheetDetailInfos
      .filter(wsdInfo => !wsdInfo.location && wsdInfo.relatedOrderInv.status === ORDER_INVENTORY_STATUS.ADDED)
      .forEach(wsdInfo => {
        const idx = locations.findIndex(loc => loc.id === wsdInfo)
        locations[idx].inventories.push(this.formatInventory(wsdInfo))
      })

    locations.forEach(location => {
      if (location.inventories.every(inv => inv.completed)) {
        location.completed = true
      } else {
        location.completed = false
      }
      location.inventories.sort((a, b) => a.completed - b.completed)
    })

    return locations
  }

  formatInventory(wsdInfo) {
    return {
      worksheetDetailName: wsdInfo.name,
      productName: wsdInfo.product && wsdInfo.product.name,
      productDescription: wsdInfo.product && wsdInfo.product.description,
      completed: wsdInfo.status !== WORKSHEET_STATUS.EXECUTING.value,
      palletId: wsdInfo.palletId,
      batchId: wsdInfo.batchId,
      inspectedBatchNo: wsdInfo.inspectedBatchNo || '',
      qty: wsdInfo.qty,
      inspectedQty: wsdInfo.inspectedQty || 0,
      weight: wsdInfo.weight,
      inspectedWeight: wsdInfo.inspectedWeight || 0,
      inspectedLocation: wsdInfo.inspectedLocation || 0,
      orderInventoryStatus: wsdInfo.relatedOrderInv.status
    }
  }

  formatMissingInventories(wsdInfos) {
    return wsdInfos
      .filter(wsdInfo => wsdInfo.relatedOrderInv.status === ORDER_INVENTORY_STATUS.MISSING.value)
      .map(wsdInfo => this.formatInventory(wsdInfo))
  }

  fillUpGrist() {
    this.locationData = { records: [] }
    this.inventoryData = { records: [] }

    const selectedWarehouseName = this.warehouseSelector.value
    const selectedZone = this.zoneSelector.value
    this.selectedRow = this.rowSelector.value
    this.selectedColumn = this.columnSelector.value

    this.warehouses = Array.from(new Set(this.formattedLocations.map(loc => loc.warehouse.name).sort()))

    if (selectedWarehouseName) {
      this.zones = Array.from(
        new Set(
          this.formattedLocations
            .filter(loc => loc.warehouse.name === selectedWarehouseName)
            .map(loc => loc.zone)
            .sort()
        )
      )
    } else {
      this.zones = []
    }

    let rows = []
    let columns = []

    if (selectedWarehouseName && selectedZone) {
      rows = Array.from(
        new Set(
          this.formattedLocations
            .filter(loc => loc.warehouse.name === selectedWarehouseName && loc.zone === selectedZone)
            .map(loc => loc.row)
            .sort()
        )
      )

      columns = Array.from(
        new Set(
          this.formattedLocations
            .filter(loc => loc.warehouse.name === selectedWarehouseName && loc.zone === selectedZone)
            .map(loc => loc.column)
            .sort()
        )
      )
    }

    if (this.selectedRow) {
      columns = Array.from(
        new Set(
          this.formattedLocations
            .filter(
              loc =>
                loc.warehouse.name === selectedWarehouseName &&
                loc.zone === selectedZone &&
                loc.row === this.selectedRow
            )
            .map(loc => loc.column)
            .sort()
        )
      )
    }

    if (this.selectedColumn) {
      rows = Array.from(
        new Set(
          this.formattedLocations
            .filter(
              loc =>
                loc.warehouse.name === selectedWarehouseName &&
                loc.zone === selectedZone &&
                loc.column === this.selectedColumn
            )
            .map(loc => loc.row)
            .sort()
        )
      )
    }

    let records = []
    if (selectedWarehouseName && selectedZone && (this.selectedRow || this.selectedColumn)) {
      records = this.formattedLocations
        .filter(({ warehouse, zone, row, column }) => {
          if (warehouse.name === selectedWarehouseName && zone === selectedZone) {
            if (this.selectedRow && this.selectedColumn)
              return row === this.selectedRow && column === this.selectedColumn
            if (this.selectedRow) return row === this.selectedRow
            if (this.selectedColumn) return column === this.selectedColumn
          } else {
            return false
          }
        })
        .sort(record => (record.completed ? 1 : -1))
    }

    this.rows = rows
    this.columns = columns
    this.locationData = { records }
  }

  updateContext(type) {
    let actions = []
    switch (type) {
      case VIEW_TYPE.LOCATION_SELECTED:
        if (this.selectedLocation) {
          actions.push({
            title: i18next.t('button.add_x', { state: { x: i18next.t('label.pallet') } }),
            action: this.addExtraPallet.bind(this)
          })
        }
        break

      case VIEW_TYPE.INVENTORY_SELECTED:
        if (this.selectedInventory) {
          if (
            this.selectedInventory.completed &&
            this.selectedInventory.orderInventoryStatus !== ORDER_INVENTORY_STATUS.TERMINATED.value
          ) {
            actions.push({ title: i18next.t('button.undo'), action: this.undoInventoryCheck.bind(this) })
          } else {
            actions.push({
              title: i18next.t('button.check_missing_x', { state: { x: i18next.t('label.pallet') } }),
              action: this.checkMissingPallet.bind(this)
            })
            actions.push({ title: i18next.t('button.check'), action: this.submitInventoryCheck.bind(this) })
          }
        }
        break

      case VIEW_TYPE.MISSING_PALLET_SELECTED:
        if (this.selectedInventory) {
          actions.push({ title: i18next.t('button.undo'), action: this.undoInventoryCheck.bind(this) })
          actions.push({ title: i18next.t('button.relocate'), action: this.relocatePallet.bind(this) })
        }
        break
    }

    if (this.formattedLocations?.length && this.formattedLocations.every(loc => loc.completed)) {
      actions.push({
        title: i18next.t('button.complete'),
        action: this.completeCycleCount.bind(this)
      })
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.inventory_inspection'),
        actions
      }
    })
  }

  async addExtraPallet() {
    try {
      this.checkInputFormValidity()

      const palletId = this.palletIdInput.value

      let location
      let inventory

      for (let i = 0; i < this.formattedLocations.length; i++) {
        location = this.formattedLocations[i]

        for (let j = 0; j < location.inventories.length; j++) {
          if (palletId === location.inventories[j].palletId) {
            inventory = location.inventories[j]
            break
          }
        }

        if (inventory) break
      }

      if (inventory && location.id !== this.selectedLocation.id) {
        const result = await CustomAlert({
          title: i18next.t('title.same_pallet_is_found'),
          text: i18next.t('text.same_pallet_is_found_in_location', { state: { location: location.name } }),
          confirmButton: { text: i18next.t('button.relocate') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) {
          return
        }

        let { inspectedBatchNo, inspectedQty, inspectedWeight } = Object.fromEntries(
          new FormData(this.inputForm).entries()
        )

        inventory.inspectedBatchNo = inspectedBatchNo
        inventory.inspectedQty = Number(inspectedQty)
        inventory.inspectedWeight = Number(inspectedWeight)

        this.selectedInventory = inventory
        await this.relocatePallet()
        return
      } else if (inventory) {
        this.selectOnInput(this.palletIdInput)
        throw new Error(i18next.t('title.same_pallet_is_found'))
      }

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('button.add_x', { state: { x: i18next.t('label.pallet') } }),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      let { inspectedBatchNo, inspectedQty, inspectedWeight } = Object.fromEntries(
        new FormData(this.inputForm).entries()
      )
      inspectedQty = Number(inspectedQty)
      inspectedWeight = Number(inspectedWeight)

      const response = await client.query({
        query: gql`
          mutation {
            addExtraPallet(${gqlBuilder.buildArgs({
              cycleCountNo: this.cycleCountNo,
              palletId,
              inspectedBatchNo,
              inspectedQty,
              inspectedWeight,
              locationId: this.selectedLocation.id
            })})
          }
        `
      })

      if (!response.errors) {
        await this.fetchCycleCountWorksheet()
        this.renewInventoryGrist()
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  async checkMissingPallet() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('button.check_missing_x', { state: { x: i18next.t('field.pallet') } }),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            checkMissingPallet(${gqlBuilder.buildArgs({
              worksheetDetailName: this.selectedInventory.worksheetDetailName
            })})
          }
        `
      })

      if (!response.errors) {
        await this.fetchCycleCountWorksheet()
        this.renewInventoryGrist()
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  async relocatePallet() {
    try {
      this.checkInputFormValidity()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('button.relocate'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      let { inspectedBatchNo, inspectedQty, inspectedWeight } = Object.fromEntries(
        new FormData(this.inputForm).entries()
      )
      inspectedQty = Number(inspectedQty)
      inspectedWeight = Number(inspectedWeight)

      const response = await client.query({
        query: gql`
          mutation {
            relocatePallet(${gqlBuilder.buildArgs({
              worksheetDetailName: this.selectedInventory.worksheetDetailName,
              inspectedBatchNo,
              inspectedQty,
              inspectedWeight,
              inspectedLocationId: this.selectedLocation.id
            })})
          }
        `
      })

      if (!response.errors) {
        await this.fetchCycleCountWorksheet()
        this.renewInventoryGrist()
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  async submitInventoryCheck() {
    try {
      this.checkInputFormValidity()

      let { inspectedBatchNo, inspectedQty, inspectedWeight } = Object.fromEntries(
        new FormData(this.inputForm).entries()
      )
      inspectedQty = Number(inspectedQty)
      inspectedWeight = Number(inspectedWeight)

      const response = await client.query({
        query: gql`
          mutation {
            inspecting(${gqlBuilder.buildArgs({
              worksheetDetailName: this.selectedInventory.worksheetDetailName,
              inspectedBatchNo,
              inspectedQty,
              inspectedWeight
            })})
          }
        `
      })

      if (!response.errors) {
        await this.fetchCycleCountWorksheet()
        this.renewInventoryGrist()
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  async undoInventoryCheck() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            undoInspection(${gqlBuilder.buildArgs({
              worksheetDetailName: this.selectedInventory.worksheetDetailName
            })})
          }
        `
      })

      if (!response.errors) {
        await this.fetchCycleCountWorksheet()
        this.renewInventoryGrist()
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  async completeCycleCount() {
    const result = await CustomAlert({
      title: i18next.t('title.are_you_sure'),
      text: i18next.t('text.complete_inspection'),
      confirmButton: { text: i18next.t('button.complete') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (!result.value) return

    CustomAlert({
      title: i18next.t('text.please_wait'),
      text: i18next.t('text.completing_inspection'),
      allowOutsideClick: false,
      allowEscapeKey: false
    })

    try {
      const response = await client.query({
        query: gql`
          mutation {
            completeInspection(${gqlBuilder.buildArgs({
              inventoryCheckNo: this.cycleCountNo
            })})
          }
        `
      })

      if (!response.errors) {
        this.infoForm.reset()
        this.clearView()
        this.updateContext()
        await CustomAlert({
          title: i18next.t('title.completed'),
          text: i18next.t('text.inspection_is_completed'),
          confirmButton: { text: i18next.t('button.confirm') }
        })
      } else {
        CustomAlert({
          title: i18next.t('title.error'),
          text: i18next.t('text.x_error', { state: { x: i18next.t('text.inspection') } }),
          confirmButton: { text: i18next.t('button.confirm') }
        })
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  renewInventoryGrist() {
    this.selectedLocation = this.formattedLocations.find(loc => loc.id === this.selectedLocation.id)
    this.inventoryData = { records: this.selectedLocation?.inventories || [] }
    this.selectedInventory = null
    this.updateContext()
  }

  checkInputFormValidity() {
    let { inspectedBatchNo, inspectedQty, inspectedWeight } = Object.fromEntries(new FormData(this.inputForm).entries())
    inspectedQty = Number(inspectedQty)
    inspectedWeight = Number(inspectedWeight)

    const palletId = this.palletIdInput.value
    if (!palletId) {
      this.selectOnInput(this.palletIdInput)
      throw new Error(i18next.t('text.invalid_x', { state: { x: i18next.t('label.pallet_id') } }))
    }

    if (!inspectedBatchNo) {
      this.selectOnInput(this.inspectedBatchNoInput)
      throw new Error(i18next.t('text.invalid_x', { state: { x: i18next.t('field.inspected_batch_no') } }))
    }

    if (!inspectedQty) {
      this.selectOnInput(this.inspectedQtyInput)
      throw new Error(i18next.t('text.invalid_x', { state: { x: i18next.t('field.inspected_qty') } }))
    }

    if (inspectedQty <= 0) {
      this.selectOnInput(this.inspectedQtyInput)
      throw new Error(i18next.t('text.x_should_be_positive', { state: { x: i18next.t('field.inspected_qty') } }))
    }

    if (!inspectedWeight) {
      this.selectOnInput(this.inspectedWeightInput)
      throw new Error(i18next.t('text.invalid_x', { state: { x: i18next.t('field.inspected_weight') } }))
    }

    if (inspectedWeight <= 0) {
      this.selectOnInput(this.inspectedWeightInput)
      throw new Error(i18next.t('text.x_should_be_positive', { state: { x: i18next.t('field.inspected_weight') } }))
    }
  }

  clearView() {
    this.locationData = { records: [] }
    this.inventoryData = { records: [] }
    this.selectedLocation = null
    this.selectedInventory = null
    this.formattedLocations = []
    this.inputForm.reset()
    this.conditionForm?.reset()
  }

  fillUpForm(form, data) {
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

  showToast({ type, message }) {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: { type, message }
      })
    )
  }
}

window.customElements.define('inspecting-product', InspectingProduct)
