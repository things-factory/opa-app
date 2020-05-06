import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../components/vas-relabel'
import { BATCH_NO_TYPE, PRODUCT_TYPE, BATCH_AND_PRODUCT_TYPE } from '../constants'
import './vas-create-popup'

class CreateVasOrder extends localize(i18next)(PageView) {
  static get styles() {
    return [
      css`
        :host {
          display: flex;
          overflow-x: auto;
        }
        .container {
          flex: 1;
          display: flex;
          overflow-y: auto;
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

  static get properties() {
    return {
      inventoryGristConfig: Object,
      inventoryData: Object,
      vasGristConfig: Object,
      vasData: Object,
      _template: Object
    }
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  render() {
    return html`
      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.target_products')}</h2>

          <data-grist
            id="inventory-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.inventoryGristConfig}
            .data=${this.inventoryData}
            @field-change="${this._updateInventoryList.bind(this)}"
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
    this.inventoryData = { records: [] }
    this.vasData = { records: [] }
  }

  get context() {
    return {
      title: i18next.t('title.create_vas_order'),
      actions: [{ title: i18next.t('button.create'), action: this._generateVasOrder.bind(this) }]
    }
  }

  pageInitialized() {
    this.inventoryGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
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
          type: 'float',
          name: 'remainWeight',
          header: i18next.t('field.available_weight'),
          record: { align: 'center' },
          width: 140
        }
      ]
    }

    this.vasGristConfig = {
      list: { fields: ['ready', 'targetType', 'targetDisplay', 'packingType'] },
      pagination: { infinite: true },
      rows: {
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            this._selectedVasRecord = record
            this._selectedVasRecordIdx = rowIndex
            if (column.name) {
              this.openVasCreatePopup(record)
            }
          }
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.vasData = { ...this.vasData, records: data.records.filter((_, idx) => idx !== rowIndex) }
            }
          }
        },
        {
          type: 'boolean',
          name: 'ready',
          header: i18next.t('field.ready'),
          width: 40
        },
        {
          type: 'string',
          name: 'targetType',
          header: i18next.t('field.target_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'targetDisplay',
          header: i18next.t('field.target'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'vasCount',
          header: i18next.t('field.vas_count'),
          record: { align: 'center' },
          width: 100
        }
      ]
    }
  }

  _updateInventoryList() {
    const _selectedInv = (this.inventoryGrist.dirtyData.records || []).map(record => {
      return {
        batchId: record.inventory.batchId,
        packingType: record.inventory.packingType,
        productId: record.inventory.productId
      }
    })

    this.inventoryGristConfig = {
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

    this.inventoryData = {
      ...this.inventoryGrist.dirtyData,
      records: this.inventoryGrist.dirtyData.records.map(record => {
        return {
          ...record,
          ...record.inventory,
          product: {
            id: record.inventory.productId,
            name: record.inventory.productName
          }
        }
      })
    }

    this._updateVasTargets()
  }

  _updateVasTargets(isFieldChanged) {
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length) return

    if (
      !this.inventoryGrist.dirtyData ||
      !this.inventoryGrist.dirtyData.records ||
      !this.inventoryGrist.dirtyData.records.length
    ) {
      this.vasData = { ...this.vasData, records: [] }
      return
    }

    const standardProductList = isFieldChanged ? this.inventoryGrist.dirtyData.records : this.inventoryData.records
    const batchPackPairs = standardProductList
      .filter(record => record.batchId && record.packingType)
      .map(record => `${record.batchId}-${record.packingType}`)

    const productPackPairs = standardProductList
      .filter(record => record.product && record.product.id)
      .map(record => `${record.product.id}-${record.packingType}`)

    const batchProductPackPairs = standardProductList
      .filter(record => record.batchId && record.product && record.product.id && record.packingType)
      .map(record => `${record.batchId}-${record.product.id}-${record.packingType}`)

    this.vasData = {
      ...this.vasData,
      records: this.vasGrist.dirtyData.records.map(record => {
        if (
          record.targetType === BATCH_NO_TYPE &&
          batchPackPairs.indexOf(`${record.target}-${record.packingType}`) < 0
        ) {
          return {
            ...record,
            ready: false,
            target: null,
            targetDisplay: null,
            packingType: null,
            qty: 1
          }
        } else if (
          record.targetType === PRODUCT_TYPE &&
          productPackPairs.indexOf(`${record.target}-${record.packingType}`) < 0
        ) {
          return {
            ...record,
            ready: false,
            target: null,
            targetDisplay: null,
            packingType: null,
            qty: 1
          }
        } else if (
          record.targetType === BATCH_AND_PRODUCT_TYPE &&
          batchProductPackPairs.indexOf(`${record.target.batchId}-${record.target.productId}-${record.packingType}`) < 0
        ) {
          return {
            ...record,
            ready: false,
            target: null,
            targetDisplay: null,
            packingType: null,
            qty: 1
          }
        } else {
          return record
        }
      })
    }
  }

  async _generateVasOrder() {
    try {
      this._validate()
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_vas_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      await this._executeRelatedTrxs()

      const response = await client.query({
        query: gql`
            mutation {
              generateVasOrder(${gqlBuilder.buildArgs({
                vasOrder: this._getVasOrder()
              })}) {
                id
                name
              }
            }
          `
      })

      if (!response.errors) {
        this.inventoryData = { records: [] }
        this.vasData = { records: [] }
        this._template = null
        this._selectedVasRecord = null
        this._selectedVasRecordIdx = null
        navigate(`vas_order_detail/${response.data.generateVasOrder.name}`)
        this._showToast({ message: i18next.t('vas_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validate() {
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length)
      new Error(i18next.t('text.invalid_data_in_list'))
    if (!this.vasData.records.every(record => record.ready)) throw new Error(i18next.t('text.there_is_not_ready_vas'))
  }

  async _executeRelatedTrxs() {
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length) return

    try {
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
    } catch (e) {
      throw e
    }
  }

  _getVasOrder() {
    return { orderVass: this._getOrderVass() }
  }

  _getOrderVass() {
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length) {
      return []
    }

    const records = this.vasGrist.dirtyData.records

    return records
      .map((record, idx) => {
        const orderVass = record.orderVass
        return orderVass.map(orderVas => {
          let result = {
            set: idx + 1,
            vas: { id: orderVas.vas.id },
            remark: orderVas.remark,
            targetType: record.targetType
          }

          if (orderVas.operationGuide && orderVas.operationGuide.data) {
            result.operationGuide = JSON.stringify(orderVas.operationGuide)
          }

          if (record.targetType === BATCH_NO_TYPE) {
            result.targetBatchId = record.target
            result.packingType = record.packingType
            result.qty = record.qty
          } else if (record.targetType === PRODUCT_TYPE) {
            result.targetProduct = { id: record.target }
            result.packingType = record.packingType
            result.qty = record.qty
          } else if (record.targetType === BATCH_AND_PRODUCT_TYPE) {
            result.targetBatchId = record.target.batchId
            result.targetProduct = { id: record.target.productId }
            result.packingType = record.packingType
            result.qty = record.qty
          } else {
            result.otherTarget = record.target
          }

          return result
        })
      })
      .flat()
  }

  openVasCreatePopup(record) {
    try {
      this.checkInventoryValidity()

      openPopup(
        html`
          <vas-create-popup
            .targetList="${this.inventoryGrist.dirtyData.records.map(record => {
              return { ...record, packQty: record.remainQty }
            })}"
            .record="${record}"
            @completed="${e => {
              if (this.vasGrist.dirtyData.records.length === this._selectedVasRecordIdx) {
                this.vasData = {
                  ...this.vasData,
                  records: [...this.vasGrist.dirtyData.records, e.detail]
                }
              } else {
                this.vasData = {
                  ...this.vasData,
                  records: this.vasGrist.dirtyData.records.map((record, idx) => {
                    if (idx === this._selectedVasRecordIdx) {
                      record = e.detail
                    }

                    return record
                  })
                }
              }
            }}"
          ></vas-create-popup>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.vas_order')
        }
      )
    } catch (e) {
      this._showToast(e)
    }
  }

  checkInventoryValidity() {
    if (!this.inventoryGrist.dirtyData.records || !this.inventoryGrist.dirtyData.records.length) {
      throw new Error(i18next.t('text.there_is_no_inventory'))
    }

    if (this.inventoryGrist.dirtyData.records.some(record => !record.inventory && !record.inventory.id))
      throw new Error(i18next.t('text.invalid_inventory'))

    return true
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

window.customElements.define('create-vas-order', CreateVasOrder)
