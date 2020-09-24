import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { fetchLocationSortingRule } from '../../fetch-location-sorting-rule'
import { LOCATION_SORTING_RULE, WORKSHEET_STATUS } from '../constants'

const VIEW_TYPE = {
  LOCATION_SELECTED: 'LOCATION_SELECTED',
  INVENTORY_SELECTED: 'INVENTORY_SELECTED'
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
      viewType: String
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
                  this.fetchCycleCountWorksheet(this.cycleCountNoInput.value)
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.inventory_inspection')} ${`: ${this.cycleCountNo}`}`}</legend>

          <label>${i18next.t('label.started_at')}</label>
          <input name="startedAt" type="datetime-local" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
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
          ${this.viewType === VIEW_TYPE.LOCATION_SELECTED
            ? html`
                <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.missed_pallets')}</h2>
                <data-grist
                  id="missed-inventory-grist"
                  .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
                  .config="${this.inventoryConfig}"
                  .data="${this.missedInventoryData}"
                ></data-grist>
              `
            : html`
                <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.extra_pallets')}</h2>
                <data-grist
                  id="inventory-grist"
                  .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
                  .config="${this.inventoryConfig}"
                  .data="${this.extraPalletData}"
                ></data-grist>
              `}

          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('field.inventory')}</legend>

              <label>${i18next.t('field.pallet_id')}</label>
              <input name="pallet-id" readonly .value="${this.selectedInventory?.palletId || ''}" />

              <label>${i18next.t('label.inspected_batch_no')}</label>
              <input name="batch-id" .value="${this.selectedInventory?.batchId || ''}" />

              <label>${i18next.t('label.inspected_qty')}</label>
              <input name="inspected-qty" type="number" .value="${this.selectedInventory?.qty || ''}" />

              <label>${i18next.t('label.inspected_weight')}</label>
              <input
                name="inspected-weight"
                type="number"
                step=".01"
                .value="${this.selectedInventory?.weight || ''}"
              />
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.locationData = { records: [] }
    this.inventoryData = { records: [] }
  }

  get context() {
    return {
      title: i18next.t('title.inventory_inspection')
    }
  }

  get infoForm() {
    return this.renderRoot.querySelector('form#info-form')
  }

  get cycleCountNoInput() {
    return this.renderRoot.querySelector('barcode-scanable-input[name=cycleCountNo]').renderRoot.querySelector('input')
  }

  focusOnCycleCountNoInput() {
    this.focusOnInput(this.cycleCountNoInput)
  }

  focusOnInput(input) {
    setTimeout(() => input.focus(), 100)
  }

  async pageInitialized() {
    this.locationSortingRules = await fetchLocationSortingRule(LOCATION_SORTING_RULE.INSPECTING_PRODUCT.value)

    this.locationConfig = {
      pagination: { infinite: true },
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (!this.selectedLocation?.id !== record.id) {
              this.selectedInventory = null
              this.selectedLocation = record
              this.inventoryData = { records: this.selectedLocation.inventories }
              this.viewType = VIEW_TYPE.LOCATION_SELECTED
              this.updateContext(this.viewType)
            }
          }
        }
      },
      list: { fields: ['name', 'palletQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
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
          click: (columns, data, column, record, rowIndex) => {
            if (!this.selectedInventory?.id !== record.id) {
              this.selectedInventory = record
              this.viewType = VIEW_TYPE.INVENTORY_SELECTED
              this.updateContext(VIEW_TYPE.INVENTORY_SELECTED)
            }
          }
        }
      },
      list: { fields: ['completed', 'palletId', 'batchId', 'qty', 'weight'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'boolean', name: 'completed', header: i18next.t('button.completed'), width: 80 },
        { type: 'string', name: 'palletId', header: i18next.t('label.pallet_id'), width: 160 },
        { type: 'string', name: 'batchId', header: i18next.t('label.batch_id'), width: 120 },
        { type: 'integer', name: 'qty', header: i18next.t('label.qty'), width: 100, record: { align: 'center' } },
        {
          type: 'integer',
          name: 'inspectedQty',
          header: i18next.t('label.inspected_qty'),
          width: 100,
          record: { align: 'center' }
        },
        { type: 'float', name: 'weight', header: i18next.t('label.weight'), width: 100, record: { align: 'center' } },
        {
          type: 'float',
          name: 'inspectedWeight',
          header: i18next.t('label.inspected_weight'),
          width: 100,
          record: { align: 'center' }
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this.focusOnCycleCountNoInput()
    }
  }

  async fetchCycleCountWorksheet(cycleCountNo) {
    this.clearView()
    const response = await client.query({
      query: gql`
        query {
          cycleCountWorksheet(${gqlBuilder.buildArgs({
            inventoryCheckNo: cycleCountNo,
            locationSortingRules: this.locationSortingRules
          })}) {
            worksheetInfo {
              startedAt
            }
            worksheetDetailInfos {
              name
              palletId
              batchId
              qty
              weight
              inspectedQty
              inspectedWeight
              description
              location {
                id
                name
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
      this.locationData = { records: this.formatLocations(worksheetDetailInfos) }
    }
  }

  formatLocations(worksheetDetailInfos) {
    this.formattedLocations = worksheetDetailInfos.reduce((locations, wsdInfo) => {
      const idx = locations.findIndex(loc => loc.id === wsdInfo.location.id)
      if (idx >= 0) {
        locations[idx].palletQty++
        locations[idx].inventories.push({
          palletId: wsdInfo.palletId,
          batchId: wsdInfo.batchId,
          qty: wsdInfo.qty,
          inspectedQty: wsdInfo.inspectedQty || 0,
          weight: wsdInfo.weight,
          inspectedWeight: wsdInfo.inspectedWeight || 0
        })
      } else {
        locations.push({
          id: wsdInfo.location.id,
          name: wsdInfo.location.name,
          palletQty: 1,
          inventories: [
            {
              palletId: wsdInfo.palletId,
              batchId: wsdInfo.batchId,
              qty: wsdInfo.qty,
              inspectedQty: wsdInfo.inspectedQty || 0,
              weight: wsdInfo.weight,
              inspectedWeight: wsdInfo.inspectedWeight || 0
            }
          ]
        })
      }

      return locations
    }, [])

    return this.formattedLocations
  }

  updateContext(type) {
    let actions = []
    switch (type) {
      case VIEW_TYPE.LOCATION_SELECTED:
        actions = [
          {
            title: i18next.t('button.add_x', { state: { x: i18next.t('label.pallet') } }),
            action: this.addExtraPallet
          }
        ]
        break

      case VIEW_TYPE.INVENTORY_SELECTED:
        actions = [
          {
            title: i18next.t('button.check_missed_x', {
              state: { x: i18next.t('label.pallet') }
            }),
            action: this.checkMissedPallet
          },
          { title: i18next.t('button.submit'), action: this.submitInventoryCheck }
        ]
        break
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.inventory_inspection'),
        actions
      }
    })
  }

  addExtraPallet() {
    console.log('add extra pallet')
  }

  async checkMissedPallet() {
    console.log('check missed pallet')
  }

  async submitInventoryCheck() {
    console.log('submit inventory check')
  }

  clearView() {
    this.locationData = { records: [] }
    this.inventoryData = { records: [] }
    this.selectedLocation = null
    this.selectedInventory = null
    this.formattedLocations = []
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
}

window.customElements.define('inspecting-product', InspectingProduct)
