import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { ORDER_PRODUCT_STATUS } from '../../constants'

export class ExtraProductPopup extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
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
      ganNo: String,
      bizplace: Object,
      config: Object,
      data: Object
    }
  }

  render() {
    return html`
      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>
        <data-grist
          .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
          .config="${this.config}"
          .data="${this.data}"
          @record-change="${this._onProductChangeHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button
          @click="${() => {
            history.back()
          }}"
        >
          ${i18next.t('button.cancel')}
        </button>
        <button @click="${this._addExtraProducts.bind(this)}">${i18next.t('button.add')}</button>
      </div>
    `
  }

  constructor() {
    super()
    this.data = { records: [] }
  }

  async firstUpdated() {
    this.config = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      list: { fields: ['batch_no', 'product', 'packingType', 'totalStdUnitValue'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const newData = data.records.filter((_, idx) => idx !== rowIndex)
              this.data = { ...this.data, records: newData }
              this.grist.dirtyData.records = newData
            }
          }
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { editable: true, align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'productsByBizplace',
              basicArgs: { filters: [{ name: 'bizplace', value: this.bizplace.id, operator: 'eq' }] },
              nameField: 'name',
              descriptionField: 'description',
              list: { fields: ['name', 'description', 'bizplace'] }
            }
          },
          width: 350
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: true,
            align: 'center',
            codeName: 'PACKING_TYPES'
          },
          width: 150
        },
        {
          type: 'float',
          name: 'stdUnitValue',
          header: i18next.t('field.std_unit_value'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 80
        },
        {
          type: 'code',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { editable: true, align: 'center', codeName: 'WEIGHT_UNITS' },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 80
        },
        {
          type: 'float',
          name: 'totalStdUnitValue',
          header: i18next.t('field.total_std_unit_value'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 80
        }
      ]
    }
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  _onProductChangeHandler(event) {
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    if (changedColumn === 'stdUnitValue' || changedColumn === 'unit' || changedColumn === 'packQty') {
      changeRecord.totalStdUnitValue = this._calcTotalStdUnitValue(
        changeRecord.stdUnitValue,
        changeRecord.unit,
        changeRecord.packQty
      )
    }
  }

  _calcTotalStdUnitValue(stdUnitValue, unit, packQty) {
    if (stdUnitValue && unit && packQty) {
      return `${(stdUnitValue * packQty).toFixed(2)} ${unit}`
    } else {
      return null
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
            addArrivalNoticeProducts(${gqlBuilder.buildArgs({
              ganNo: this.ganNo,
              orderProducts: this._getOrderProducts()
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

  _getOrderProducts() {
    return this.grist.dirtyData.records.map(record => {
      return {
        batchId: record.batchId,
        palletQty: record.palletQty,
        product: { id: record.product.id },
        packingType: record.packingType,
        status: ORDER_PRODUCT_STATUS.READY_TO_APPROVED.value,
        stdUnitValue: record.stdUnitValue,
        unit: record.unit,
        packQty: record.packQty,
        totalStdUnitValue: record.totalStdUnitValue
      }
    })
  }

  _validateProducts() {
    // no records
    if (!this.grist.dirtyData.records || !this.grist.dirtyData.records.length)
      throw new Error(i18next.t('text.no_products'))

    // required field (batchId, packingType, stdUnitValue, unit, packQty, palletQty)
    if (
      this.grist.dirtyData.records.filter(
        record =>
          !record.batchId ||
          !record.packingType ||
          !record.stdUnitValue ||
          !record.unit ||
          !record.packQty ||
          !record.palletQty
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

window.customElements.define('extra-product-popup', ExtraProductPopup)
