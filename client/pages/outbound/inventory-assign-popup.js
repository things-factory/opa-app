import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { ORDER_TYPES } from '../order/constants'
import { PICKING_STRATEGY } from './constants'

class InventoryAssignPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      worksheetNo: String,
      batchId: String,
      productName: String,
      packingType: String,
      releaseQty: Number,
      releaseWeight: Number,
      config: Object,
      _data: Object,
      data: Object,
      pickQty: Number,
      pickWeight: Number
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
          display: flex;
        }
        .button-container > mwc-button {
          margin: auto 0 0 auto;
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

          <label>${i18next.t('label.release_weight')}</label>
          <input readonly name="releaseWeight" value="${`${this.pickWeight} / ${this.releaseWeight}`}" />
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
        <mwc-button @click="${this.submitPickedItems.bind(this)}">${i18next.t('button.submit')}</mwc-button>
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
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.available_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'float',
          name: 'pickWeight',
          header: i18next.t('field.pick_weight'),
          record: { align: 'center', editable: true },
          width: 60
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.available_weight'),
          record: { align: 'center' },
          width: 60
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
            worksheetNo: this.worksheetNo,
            batchId: this.batchId,
            productName: this.productName,
            packingType: this.packingType,
            pickingStrategy: this.selectedStrategy
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
              weight
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
            ...item.location
          }
        }),
        total: response.data.inventoriesByStrategy.total
      }
    }
  }

  _calculateData(_data) {
    this.pickQty = 0
    this.pickWeight = 0

    this.data = {
      ..._data,
      records: _data.records.map(item => {
        let picked = false
        let pickQty = 0
        let pickWeight = 0

        if (this.pickQty < this.releaseQty) {
          picked = true
          const leftQty = this.releaseQty - this.pickQty
          const leftWeight = this.releaseWeight - this.pickWeight
          pickQty = leftQty > item.qty ? item.qty : leftQty
          pickWeight = leftWeight > item.weight ? item.weight : leftWeight

          this.pickQty += pickQty
          this.pickWeight += pickWeight
        }

        return {
          ...item,
          ...item.location,
          picked,
          pickQty,
          pickWeight
        }
      })
    }
  }

  async _onInventoryFieldChanged(e) {
    const columnName = e.detail.column.name
    if (columnName === 'pickQty' || columnName === 'pickWeight') {
      let totalPickQty = 0
      let totalPickWeight = 0

      if (columnName === 'pickQty') {
        this.data = {
          records: this.grist.dirtyData.records.map(data => {
            const pickQty = data.pickQty
            const pickWeight = Math.round((data.weight / data.qty) * data.pickQty)

            totalPickQty += pickQty
            totalPickWeight += pickWeight

            return {
              ...data,
              pickQty,
              pickWeight,
              picked: Boolean(data.pickQty)
            }
          })
        }
      } else if (columnName === 'pickWeight') {
        this.data = {
          records: this.grist.dirtyData.records.map(data => {
            const pickQty = Math.round((data.qty * data.pickWeight) / data.weight)
            const pickWeight = data.pickWeight

            totalPickQty += pickQty
            totalPickWeight += pickWeight

            return {
              ...data,
              pickQty: Math.round((data.qty * data.pickWeight) / data.weight),
              pickWeight: data.pickWeight,
              picked: Boolean(data.pickWeight)
            }
          })
        }
      }

      await this.grist.updateComplete
      this.pickQty = totalPickQty
      this.pickWeight = totalPickWeight
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
              productName: this.productName,
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
    if (this.pickWeight > this.releaseWeight) throw new Error(i18next.t('text.picked_weight_over_than_release'))
    if (this.pickWeight < this.releaseWeight) throw new Error(i18next.t('text.picked_weight_less_than_release'))
  }

  _composeWorksheetDetails() {
    return this.grist.dirtyData.records
      .filter(record => record.pickQty && record.pickWeight)
      .map(record => {
        return {
          description: record.description,
          targetInventory: {
            inventory: { id: record.id },
            releaseQty: record.pickQty,
            releaseWeight: record.pickWeight,
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