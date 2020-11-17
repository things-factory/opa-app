import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { ORDER_TYPES, PICKING_STRATEGY } from '../constants'

class InventoryAutoAssignPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      worksheetNo: String,
      selectedItems: Array,
      config: Object,
      data: Object
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
              />
              <label for="picking-strategy-${idx}">${i18next.t(strategy.name)}</label>
            `
          )}
        </fieldset>
      </form>

      <div class="grist">
        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data="${this.data}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click="${this.autoAssign.bind(this)}">${i18next.t('button.auto_assign')}</button>
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

  async firstUpdated() {
    this.config = {
      list: { fields: [] },
      pagination: { infinite: true },
      rows: { appendable: false, selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'boolean',
          name: 'completed',
          header: i18next.t('field.done'),
          width: 40
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'float',
          name: 'releaseStdUnitValue',
          header: i18next.t('field.release_std_unit_value'),
          record: { align: 'center' },
          width: 60
        }
      ]
    }
  }

  async autoAssign() {
    try {
      this.validateCheckedItems()
      const selectedItems = this.grist.selected
      const filterBizplace = this.data.records.map(record => record.bizplaceId)
      let bizplaceId = [...new Set(filterBizplace)]

      if (selectedItems.some(record => record.completed)) {
        const result = await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.there_is_completed_item_already'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) {
          return
        }
      }

      CustomAlert({
        title: i18next.t('title.inventory_auto_assign'),
        text: i18next.t('text.please_wait'),
        allowOutsideClick: false,
        allowEscapeKey: false
      })

      await Promise.all(
        selectedItems.map(async selectedItem => {
          const inventories = await this.fetchInventoriesByStrategy(selectedItem, this.selectedStrategy, bizplaceId[0])
          const worksheetDetails = this._composeWorksheetDetails(selectedItem, inventories)
          await this.submitPickedItems(this.worksheetNo, selectedItem, worksheetDetails)
        })
      )

      await CustomAlert({
        title: i18next.t('title.completed'),
        text: i18next.t('text.inventory_auto_assign_completed'),
        confirmButton: { text: i18next.t('button.confirm') }
      })

      this.dispatchEvent(new CustomEvent('completed'))
      history.back()
    } catch (e) {
      this._showToast(e)
    }
  }

  async fetchInventoriesByStrategy({ batchId, product, packingType }, pickingStrategy, bizplaceId) {
    const productName = product.name
    const response = await client.query({
      query: gql`
        query {
          inventoriesByStrategy(${gqlBuilder.buildArgs({
            bizplaceId,
            batchId,
            productName,
            packingType,
            pickingStrategy
          })}) {
            items {
              id
              qty
              stdUnitValue
            }
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.inventoriesByStrategy.items
    }
  }

  _composeWorksheetDetails(record, inventories) {
    let leftReleaseQty = record.releaseQty
    let leftReleaseStdUnitValue = record.releaseStdUnitValue
    let compReleaseQty = 0
    let compReleaseStdUnitValue = 0

    let worksheetDetails = []
    let idx = 0
    while (compReleaseQty < record.releaseQty) {
      const inv = inventories[idx]

      if (inv.qty > leftReleaseQty) {
        compReleaseQty += leftReleaseQty
        compReleaseStdUnitValue += leftReleaseStdUnitValue

        worksheetDetails.push({
          targetInventory: {
            inventory: { id: inv.id },
            releaseQty: leftReleaseQty,
            releaseStdUnitValue: leftReleaseStdUnitValue,
            type: ORDER_TYPES.RELEASE_OF_GOODS.value
          }
        })
      } else {
        compReleaseQty += inv.qty
        compReleaseStdUnitValue += inv.stdUnitValue
        leftReleaseQty -= inv.qty
        leftReleaseStdUnitValue -= inv.stdUnitValue

        worksheetDetails.push({
          targetInventory: {
            inventory: { id: inv.id },
            releaseQty: inv.qty,
            releaseStdUnitValue: inv.stdUnitValue,
            type: ORDER_TYPES.RELEASE_OF_GOODS.value
          }
        })
      }

      idx++
    }

    return worksheetDetails
  }

  async submitPickedItems(worksheetNo, { batchId, product, packingType }, worksheetDetails) {
    try {
      await client.query({
        query: gql`
          mutation {
            generateReleaseGoodWorksheetDetails(${gqlBuilder.buildArgs({
              worksheetNo,
              batchId,
              productId: product.id,
              packingType,
              worksheetDetails
            })})
          }
        `
      })
    } catch (e) {
      this._showToast(e)
    }
  }

  validateCheckedItems() {
    if (!this.grist.selected || !this.grist.selected.length)
      throw new Error(i18next.t('text.there_is_no_selected_items'))
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

window.customElements.define('inventory-auto-assign-popup', InventoryAutoAssignPopup)
