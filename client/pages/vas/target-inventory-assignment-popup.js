import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { BATCH_NO_TYPE, PRODUCT_TYPE, BATCH_AND_PRODUCT_TYPE, ETC_TYPE, ORDER_TYPES } from '../order/constants'

class TargetInventoryAssignmentPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      orderType: String,
      tasks: Array,
      targetType: String,
      targetBatchId: String,
      targetProduct: Object,
      packingType: String,
      otherType: String,
      qty: Number,
      taskGrsitConfig: Object,
      taskData: Object,
      inventoryGristConfig: Object,
      inventoryData: Object,
      selectedQty: Number
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
        .grist-container {
          overflow: hidden;
          display: flex;
          flex: 1;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .right-column {
          flex: 2;
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
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.vas_info')}</legend>

          <label>${i18next.t('label.target_type')}</label>
          <input id="target-type" value="${this.targetType}" readonly />

          ${this.targetType === BATCH_NO_TYPE || this.targetType === BATCH_AND_PRODUCT_TYPE
            ? html`
                <label>${i18next.t('label.batch_no')}</label>
                <input id="batch-id" value="${this.targetBatchId}" readonly />
              `
            : ''}
          ${this.targetType === PRODUCT_TYPE || this.targetType === BATCH_AND_PRODUCT_TYPE
            ? html`
                <label>${i18next.t('label.product')}</label>
                <input id="batch-id" value="${this.targetProduct.name}" readonly />
              `
            : ''}
          ${this.targetType === ETC_TYPE
            ? html`
                <label>${i18next.t('label.etc')}</label>
                <input id="batch-id" value="${this.otherType}" readonly />
              `
            : ''}

          <label>${i18next.t('label.packing_type')}</label>
          <input id="packing-type" value="${this.packingType}" readonly />

          <label>${i18next.t('label.qty')}</label>
          <input id="qty" value="${this.selectedQty} / ${this.qty}" readonly />
        </fieldset>
      </form>

      <div class="grist-container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.tasks')}</h2>
          <data-grist
            id="task-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.taskGrsitConfig}
            .data="${this.taskData}"
          ></data-grist>
        </div>

        <div class="grist right-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.inventories')}</h2>

          <data-grist
            id="inventory-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.inventoryGristConfig}
            .data="${this.inventoryData}"
            @field-change="${this.onFieldChangeHandler.bind(this)}"
          ></data-grist>
        </div>
      </div>

      <div class="button-container">
        <button @click="${this._selectAutomatically.bind(this)}">${i18next.t('button.auto_select')}</button>
        <button @click="${this.assignInventories.bind(this)}">${i18next.t('button.assign')}</button>
      </div>
    `
  }

  constructor() {
    super()
    this.selectedQty = 0
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  async firstUpdated() {
    if (this.tasks && this.tasks.length) {
      this.taskData = {
        records: this.tasks.map(task => {
          return { ...task.targetVas, id: task.id }
        })
      }
      await this._fetchCandidates()
    }

    this.taskGrsitConfig = {
      rows: {
        appendable: false
      },
      list: { fields: ['vas', 'remark'] },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          width: 250
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          width: 250
        }
      ]
    }

    this.inventoryGristConfig = this.getGristConfig(this.orderType)
  }

  getGristConfig(orderType) {
    if (orderType === ORDER_TYPES.RELEASE_OF_GOODS.value) {
      return {
        list: { fields: ['batchId', 'palletId', 'product', 'packingType', 'location', 'qty'] },
        pagination: { infinite: true },
        rows: {
          appendable: false,
          classifier: record => {
            return { emphasized: Boolean(record.selected) }
          }
        },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'boolean',
            name: 'selected',
            header: i18next.t('field.selected'),
            width: 60
          },
          {
            type: 'string',
            name: 'batchId',
            header: i18next.t('field.batch_no'),
            record: { align: 'center' },
            width: 130
          },
          {
            type: 'string',
            name: 'palletId',
            header: i18next.t('field.pallet_id'),
            record: { align: 'center' },
            width: 130
          },
          {
            type: 'object',
            name: 'product',
            header: i18next.t('field.product'),
            record: { align: 'center' },
            width: 250
          },
          {
            type: 'string',
            name: 'packingType',
            header: i18next.t('field.packing_type'),
            record: { align: 'center' },
            width: 130
          },
          {
            type: 'integer',
            name: 'qty',
            header: i18next.t('field.available_qty'),
            record: { align: 'center' },
            width: 60
          },
          {
            type: 'integer',
            name: 'selectedQty',
            header: i18next.t('field.selected_qty'),
            record: { align: 'center', editable: true },
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
    } else {
      return {
        list: { fields: ['batchId', 'palletId', 'product', 'packingType', 'location', 'qty'] },
        pagination: { infinite: true },
        rows: {
          appendable: false,
          classifier: record => {
            return { emphasized: Boolean(record.selected) }
          }
        },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'boolean',
            name: 'selected',
            header: i18next.t('field.selected'),
            width: 60
          },
          {
            type: 'string',
            name: 'batchId',
            header: i18next.t('field.batch_no'),
            record: { align: 'center' },
            width: 130
          },
          {
            type: 'string',
            name: 'palletId',
            header: i18next.t('field.pallet_id'),
            record: { align: 'center' },
            width: 130
          },
          {
            type: 'object',
            name: 'product',
            header: i18next.t('field.product'),
            record: { align: 'center' },
            width: 250
          },
          {
            type: 'string',
            name: 'packingType',
            header: i18next.t('field.packing_type'),
            record: { align: 'center' },
            width: 130
          },
          {
            type: 'object',
            name: 'location',
            header: i18next.t('field.location'),
            record: { align: 'center' },
            width: 150
          },
          {
            type: 'integer',
            name: 'qty',
            header: i18next.t('field.available_qty'),
            record: { align: 'center' },
            width: 60
          },
          {
            type: 'integer',
            name: 'selectedQty',
            header: i18next.t('field.selected_qty'),
            record: { align: 'center', editable: true },
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
    }
  }

  async _fetchCandidates() {
    const response = await client.query({
      query: gql`
        query {
          vasCandidates(${gqlBuilder.buildArgs({
            worksheetDetailId: this.tasks[0].id
          })}) {
            id
            palletId
            batchId
            packingType
            qty
            weight
            product {
              id
              name
              description
            }
            location {
              name
            }
            createdAt
          }
        }
      `
    })

    if (!response.errors) {
      this.inventoryData = {
        ...this.inventoryData,
        records: response.data.vasCandidates
      }
    }
  }

  onFieldChangeHandler(evt) {
    if (evt.detail.column.name !== 'selectedQty') return

    const record = evt.detail.record
    const selectedQty = evt.detail.after
    const rowIdx = evt.detail.row

    try {
      this._checkQtyValidity(record.qty, selectedQty, this.qty)
      this.inventoryData = {
        ...this.inventoryGrist.dirtyData,
        records: this.inventoryGrist.dirtyData.records.map((record, idx) => {
          if (idx === rowIdx) {
            return { ...record, selected: Boolean(selectedQty > 0) }
          } else {
            return record
          }
        })
      }

      this.selectedQty = this.inventoryData.records.reduce((selectedQty, record) => {
        selectedQty += record.selectedQty || 0
        return selectedQty
      }, 0)
    } catch (e) {
      this.inventoryData = {
        ...this.inventoryGrist.dirtyData,
        records: this.inventoryGrist.dirtyData.records.map((record, idx) => {
          if (idx === rowIdx) {
            return { ...record, selectedQty: evt.detail.before }
          } else {
            return record
          }
        })
      }
      this._showToast(e)
    }
  }

  _checkQtyValidity(availableQty, selectedQty, totalQty) {
    // 1. selectedQty can't exceed availableQty
    if (availableQty < selectedQty) throw new Error(i18next.t('text.qty_exceed_limit'))

    // 2. selectedQty can't be negative value
    if (selectedQty < 0) throw new Error(i18next.t('text.qty_should_be_positive'))

    // 3. sum of selected qty can't exceed total qty
    const totalSelectedQty = this.inventoryGrist.dirtyData.records.reduce((totalSelectedQty, record) => {
      totalSelectedQty += record.selectedQty || 0
      return totalSelectedQty
    }, 0)
    if (totalQty < totalSelectedQty) throw new Error(i18next.t('text.qty_exceed_limit'))
  }

  _selectAutomatically() {
    this.selectedQty = 0

    this.inventoryData = {
      ...this.inventoryData,
      records: this.inventoryGrist.dirtyData.records.map(record => {
        if (this.selectedQty < this.qty) {
          if (record.qty + this.selectedQty <= this.qty) {
            this.selectedQty += record.qty

            return {
              ...record,
              selectedQty: record.qty,
              selected: true
            }
          } else {
            const requiredQty = this.qty - this.selectedQty
            this.selectedQty += requiredQty

            return {
              ...record,
              selectedQty: requiredQty,
              selected: true
            }
          }
        } else {
          return {
            ...record,
            selected: 0,
            selecte: false
          }
        }
      })
    }
  }

  async assignInventories() {
    try {
      this.checkInventoryValidity()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.assign_inventories'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            assignVasInventories(${gqlBuilder.buildArgs({
              worksheetDetailIds: this.tasks.map(task => task.id),
              inventories: this.getInventories()
            })})
          }
        `
      })

      if (!response.errors) {
        this.dispatchCompletedEvent()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  getInventories() {
    return this.inventoryGrist.dirtyData.records
      .filter(record => record.selected)
      .map(record => {
        return {
          id: record.id,
          qty: record.selectedQty
        }
      })
  }

  dispatchCompletedEvent() {
    this.dispatchEvent(new CustomEvent('completed'))
    history.back()
  }

  checkInventoryValidity() {
    if (this.selectedQty < this.qty) throw new Error(i18next.t('text.selected_qty_is_less_than_expected'))
    if (this.selectedQty > this.qty) throw new Error(i18next.t('text.selected_qty_is_more_than_expected'))
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

window.customElements.define('target-inventory-assignment-popup', TargetInventoryAssignmentPopup)
