import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { fetchLocationSortingRule } from '../../fetch-location-sorting-rule'
import { LOCATION_SORTING_RULE, ORDER_TYPES, PICKING_STRATEGY } from '../constants'

class InventoryAssignPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      worksheetNo: String,
      batchId: String,
      productId: String,
      productName: String,
      bizplaceId: String,
      packingType: String,
      releaseQty: Number,
      releaseUomValue: Number,
      config: Object,
      _data: Object,
      data: Object,
      pickQty: Number,
      pickUomValue: Number,
      uom: String
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
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

  render() {
    return html`
      <form id="input-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.picking_strategy')}</legend>
          ${PICKING_STRATEGY.map(
            (strategy, idx) => html`
              <input
                id="picking-strategy-${idx}"
                type="radio"
                name="pickingStrategy"
                value="${strategy.value}"
                ?checked="${idx === 0}"
                @change="${this.fetchInventoriesByStrategy.bind(this)}"
              />
              <label for="picking-strategy-${idx}">${i18next.t(strategy.name)}</label>
            `
          )}
        </fieldset>

        <fieldset>
          <legend>${i18next.t('title.inventory_selection')}</legend>
          <label>${i18next.t('label.release_qty')}</label>
          <input readonly name="releaseQty" value="${`${this.pickQty} / ${this.releaseQty}`}" />

          <label>${i18next.t('label.release_uom_value')}</label>
          <input
            readonly
            name="releaseUomValue"
            value="${`${Math.round(this.pickUomValue * 100) / 100} / ${this.releaseUomValue + ' ' + this.uom}`}"
          />
        </fieldset>
      </form>

      <div class="grist">
        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data="${this.data}"
          @field-change="${this._onInventoryFieldChanged.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click="${this.submitPickedItems.bind(this)}">${i18next.t('button.submit')}</button>
      </div>
    `
  }

  get selectedStrategy() {
    return Array.from(this.shadowRoot.querySelectorAll('input[name=pickingStrategy]')).find(input => input.checked)
      .value
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  updated(changedProps) {
    if (changedProps.has('_data')) {
      this._calculateData(this._data)
    }
  }

  async firstUpdated() {
    this.locationSortingRules = await fetchLocationSortingRule(LOCATION_SORTING_RULE.INVENTORY_ASSIGNMENT.value)

    this.config = {
      list: { fields: ['palletId', 'product', 'location', 'qty'] },
      pagination: { infinite: true },
      rows: {
        classifier: record => {
          return {
            emphasized: record.picked
          }
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'picked',
          header: i18next.t('field.selected'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          width: 130
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 250
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.comment'),
          record: { align: 'center', editable: true },
          width: 300
        },
        {
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'row',
          header: i18next.t('field.row'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'column',
          header: i18next.t('field.column'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'shelf',
          header: i18next.t('field.shelf'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'pickQty',
          header: i18next.t('field.pick_qty'),
          record: { align: 'center', editable: true },
          width: 60
        },
        {
          type: 'int',
          name: 'qty',
          header: i18next.t('field.available_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'float',
          name: 'pickUomValue',
          header: i18next.t('field.pick_uom_value'),
          record: { align: 'center', editable: true },
          width: 60
        },
        {
          type: 'string',
          name: 'availableUomValue',
          header: i18next.t('field.available_uom_value'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'left' },
          width: 120
        },
        {
          type: 'datetime',
          name: 'createdAt',
          record: { align: 'center', editable: false },
          header: i18next.t('field.stored_at'),
          sortable: true,
          width: 180
        }
      ]
    }

    this.fetchInventoriesByStrategy()
  }

  async fetchInventoriesByStrategy() {
    const response = await client.query({
      query: gql`
        query {
          inventoriesByStrategy(${gqlBuilder.buildArgs({
            batchId: this.batchId,
            bizplaceId: this.bizplaceId,
            productName: this.productName,
            packingType: this.packingType,
            pickingStrategy: this.selectedStrategy,
            locationSortingRules: this.locationSortingRules
          })}) {
            items {
              id
              palletId
              product {
                name
                description
              }
              location {
                name
                description 
                zone
                row
                column
                shelf
              }
              qty
              uomValue
              uom
              remark
              createdAt
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      this._data = {
        records: response.data.inventoriesByStrategy.items.map(item => {
          return {
            ...item,
            ...item.location,
            availableUomValue: item.uomValue + ' ' + item.uom
          }
        }),
        total: response.data.inventoriesByStrategy.total
      }
    }
  }

  _calculateData(_data) {
    this.pickQty = 0
    this.pickUomValue = 0

    this.data = {
      ..._data,
      records: _data.records.map(item => {
        let picked = false
        let pickQty = 0
        let pickUomValue = 0

        if (this.pickQty < this.releaseQty) {
          picked = true
          const leftQty = this.releaseQty - this.pickQty
          const leftUomValue = this.releaseUomValue - this.pickUomValue
          pickQty = leftQty > item.qty ? item.qty : leftQty
          pickUomValue = leftUomValue > item.uomValue ? item.uomValue : leftUomValue

          // rounding off the pickUomValue will update the *Pick UomValue* column on grist
          pickUomValue = Math.round(pickUomValue * 100) / 100
          this.pickQty += pickQty
          this.pickUomValue += pickUomValue
          this.uom = item.uom
        }

        // need to round off so that it will bypass the validation upon submission
        this.pickUomValue = Math.round(this.pickUomValue * 100) / 100

        // need to round off so that it will bypass the validation upon submission
        this.pickUomValue = Math.round(this.pickUomValue * 100) / 100

        return {
          ...item,
          ...item.location,
          picked,
          pickQty,
          pickUomValue
        }
      })
    }
  }

  async _onInventoryFieldChanged(e) {
    const columnName = e.detail.column.name
    if (columnName === 'pickQty' || columnName === 'pickUomValue') {
      let totalPickQty = 0
      let totalPickUomValue = 0

      if (columnName === 'pickQty') {
        this.data = {
          records: this.grist.dirtyData.records.map(data => {
            let pickQty = data.pickQty
            let pickUomValue = (data.uomValue / data.qty) * data.pickQty
            pickUomValue = Math.round(pickUomValue * 100) / 100

            if (pickQty > data.qty || Number.isNaN(pickQty)) {
              pickQty = data.qty
              pickUomValue = data.uomValue
            } else if (pickQty < 0) {
              pickQty = 0
              pickUomValue = 0
            }

            totalPickQty += pickQty
            totalPickUomValue += pickUomValue

            return {
              ...data,
              pickQty,
              pickUomValue,
              picked: Boolean(data.pickQty)
            }
          })
        }
      } else if (columnName === 'pickUomValue') {
        this.data = {
          records: this.grist.dirtyData.records.map(data => {
            let pickQty = Math.round((data.qty * data.pickUomValue) / data.uomValue)
            let pickUomValue = data.pickUomValue

            if (pickUomValue > data.uomValue || Number.isNaN(pickUomValue)) {
              pickQty = data.qty
              pickUomValue = data.uomValue
            } else if (pickUomValue < 0) {
              pickQty = 0
              pickUomValue = 0
            }

            totalPickQty += pickQty
            totalPickUomValue += pickUomValue

            return {
              ...data,
              pickQty: Math.round((pickQty * data.uomValue) / data.uomValue),
              pickUomValue,
              picked: Boolean(data.pickUomValue)
            }
          })
        }
      }

      await this.grist.updateComplete
      this.pickQty = totalPickQty
      this.pickUomValue = Math.round(totalPickUomValue * 100) / 100
    }
  }

  async submitPickedItems() {
    try {
      this._checkColumnValidity()
      const response = await client.query({
        query: gql`
          mutation {
            generateReleaseGoodWorksheetDetails(${gqlBuilder.buildArgs({
              worksheetNo: this.worksheetNo,
              batchId: this.batchId,
              productId: this.productId,
              packingType: this.packingType,
              worksheetDetails: this._composeWorksheetDetails()
            })})
          }
        `
      })

      if (!response.errors) {
        this.dispatchEvent(new CustomEvent('completed'))
        history.back()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _checkColumnValidity() {
    if (this.pickQty > this.releaseQty)
      throw new Error(i18next.t('text.selected_item_qty_is_more_than_order_release_qty'))
    if (this.pickQty < this.releaseQty)
      throw new Error(i18next.t('text.selected_item_qty_is_less_than_order_release_qty'))
    if (this.pickUomValue > this.releaseUomValue) throw new Error(i18next.t('text.picked_uom_value_over_than_release'))
    if (this.pickUomValue < this.releaseUomValue) throw new Error(i18next.t('text.picked_uom_value_less_than_release'))
  }

  _composeWorksheetDetails() {
    return this.grist.dirtyData.records
      .filter(record => record.pickQty && record.pickUomValue)
      .map(record => {
        return {
          description: record.description,
          targetInventory: {
            inventory: { id: record.id },
            releaseQty: record.pickQty,
            releaseUomValue: record.pickUomValue,
            type: ORDER_TYPES.RELEASE_OF_GOODS.value
          }
        }
      })
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

window.customElements.define('inventory-assign-popup', InventoryAssignPopup)
