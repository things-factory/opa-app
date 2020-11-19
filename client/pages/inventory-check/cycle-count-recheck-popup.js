import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class CycleCountRecheckPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      cycleCountNo: String,
      inventories: Array,
      customerId: String,
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
          <legend>${i18next.t('title.cycle_count')}</legend>
          <label>${i18next.t('field.execution_date')}</label>
          <input name="executionDate" type="date" min="${this._getStdDate()}" required />
        </fieldset>
      </form>

      <div class="grist">
        <data-grist
          .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
          .config="${this.config}"
          .data="${this.data}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click="${this.createCycleCountRecheck.bind(this)}">${i18next.t('button.create')}</button>
        <button @click="${() => history.back()}">${i18next.t('button.cancel')}</button>
      </div>
    `
  }

  get form() {
    return this.renderRoot.querySelector('form#input-form')
  }

  get executionDateInput() {
    return this.renderRoot.querySelector('input[name=executionDate]')
  }

  get grist() {
    return this.renderRoot.querySelector('data-grist')
  }

  constructor() {
    super()
    this.data = { records: [] }
  }

  async firstUpdated() {
    this.config = {
      rows: { appendable: false },
      list: {
        fields: [
          'palletId',
          'product',
          'batchId',
          'inspectedBatchNo',
          'packingType',
          'inspectedLocation',
          'inspectedQty',
          'inspectedUomValue',
          'uom',
          'status'
        ]
      },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 350
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'inspectedBatchNo',
          header: i18next.t('field.inspected_batch_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.system_location'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'object',
          name: 'inspectedLocation',
          header: i18next.t('field.inspected_location'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.system_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'inspectedQty',
          header: i18next.t('field.inspected_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'float',
          name: 'uomValue',
          header: i18next.t('field.system_uom_value'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'float',
          name: 'inspectedUomValue',
          header: i18next.t('field.inspected_uom_value'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'uom',
          header: i18next.t('field.uom'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          width: 100
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('cycleCountNo')) {
      this.fetchNotTallyInventories()
    }
  }

  async fetchNotTallyInventories() {
    const response = await client.query({
      query: gql`
        query {
          notTallyTargetInventories(${gqlBuilder.buildArgs({
            cycleCountNo: this.cycleCountNo
          })}) {
            id
            inventory {
              palletId
              uom
              product {
                name
                description
              }
              packingType
            }
            originBatchNo
            inspectedBatchNo
            originLocation {
              name
              description
            }
            inspectedLocation {
              name
              description
            }
            originQty
            inspectedQty
            originUomValue
            inspectedUomValue
            status
          }
        }
      `
    })

    if (!response.errors) {
      this.data = {
        records: response.data.notTallyTargetInventories.map(targetInv => {
          return {
            id: targetInv.id,
            batchId: targetInv.originBatchNo,
            inspectedBatchNo: targetInv.inspectedBatchNo,
            palletId: targetInv.inventory.palletId,
            product: targetInv.inventory.product,
            packingType: targetInv.inventory.packingType,
            location: targetInv.originLocation,
            inspectedLocation: targetInv.inspectedLocation,
            qty: targetInv.originQty,
            inspectedQty: targetInv.inspectedQty,
            uomValue: targetInv.originUomValue,
            uom: targetInv.inventory && targetInv.inventory.uom,
            inspectedUomValue: targetInv.inspectedUomValue,
            status: targetInv.status
          }
        })
      }
    }
  }

  async createCycleCountRecheck() {
    try {
      this.checkValidity()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_cycle_count_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const orderInventoryIds = this.grist.selected.map(record => record.id)
      const response = await client.query({
        query: gql`
          mutation {
            generateCycleCountWorksheet(${gqlBuilder.buildArgs({
              executionDate: this.executionDateInput.value,
              customerId: this.customerId,
              orderInventoryIds
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) {
        this.dispatchEvent(new CustomEvent('completed'))
        history.back()
      }
    } catch (e) {
      this.showToast(e)
    }
  }

  checkValidity() {
    // Execution date
    if (!this.form.checkValidity()) {
      throw new Error(i18next.t('text.invalid_x', { state: { x: i18next.t('field.execution_date') } }))
    }

    // Is there selected inventories
    if (!this.grist.selected?.length) {
      throw new Error(i18next.t('text.there_is_no_selected_items'))
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  showToast({ type, message }) {
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

window.customElements.define('cycle-count-recheck-popup', CycleCountRecheckPopup)
