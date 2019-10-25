import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'
import '../../components/vas-relabel'

class CreateVasOrder extends localize(i18next)(PageView) {
  static get styles() {
    return [
      css`
        :host {
          display: flex;
          overflow-x: auto;
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
      config: Object,
      data: Object,
      _template: Object
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>
        <data-grist
          .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
          .config="${this.config}"
          .data="${this.data}"
          @field-change="${this._onFieldChange.bind(this)}"
        ></data-grist>
      </div>

      <div class="guide-container">
        ${this._template}
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.create_vas_order'),
      actions: this._actions
    }
  }

  get createButton() {
    return { title: i18next.t('button.create'), action: this._generateVasOrder.bind(this) }
  }

  get adjustButton() {
    return {
      title: i18next.t('button.adjust'),
      action: () => {
        this.data = {
          ...this.data,
          records: this.dataGrist.dirtyData.records.map((record, idx) => {
            if (idx === this._selectedRecordIdx) {
              try {
                record.operationGuide = this._template.adjust()
                record.ready = this._isReadyToCreate(record)
              } catch (e) {
                this._showToast(e)
              }
            }
            return record
          })
        }
      }
    }
  }

  constructor() {
    super()
    this.data = { records: [] }
    this._actions = [this.createButton]
  }

  pageInitialized() {
    this.config = {
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true },
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (
              record &&
              record.vas &&
              record.vas.operationGuideType === 'template' &&
              record.vas.operationGuide &&
              record.inventory
            ) {
              this._template = document.createElement(record.vas.operationGuide)
              this._template.record = record
              this._template.operationGuide = record.operationGuide
            } else {
              this._template = null
            }
            this._selectedRecord = record
            this._selectedRecordIdx = rowIndex
            this._updateContext()
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
              this.data = { ...this.data, records: data.records.filter((_, idx) => idx !== rowIndex) }
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
          type: 'object',
          name: 'inventory',
          header: i18next.t('field.inventory_list'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'inventories',
              nameField: 'batchId',
              descriptionField: 'palletId',
              select: [
                { name: 'id', hidden: true },
                { name: 'name', hidden: true },
                { name: 'palletId', header: i18next.t('field.pallet_id'), record: { align: 'center' } },
                { name: 'product', type: 'object', queryName: 'products' },
                { name: 'batchId', header: i18next.t('field.batch_no'), record: { align: 'center' } },
                { name: 'packingType', header: i18next.t('field.packing_type'), record: { align: 'center' } },
                { name: 'warehouse', type: 'object', record: { align: 'center' } },
                { name: 'location', type: 'object', queryName: 'locations', record: { align: 'center' } },
                { name: 'bizplace', type: 'object', record: { align: 'center' } },
                { name: 'qty', type: 'float', record: { align: 'center' } }
              ],
              list: { fields: ['palletId', 'product', 'batchId', 'location'] }
            }
          },
          width: 300
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'center' },
          width: 300
        },
        {
          type: 'object',
          name: 'warehouse',
          header: i18next.t('field.warehouse'),
          record: { align: 'center' },
          width: 300
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 300
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'vass',
              select: [
                { name: 'id', hidden: true },
                { name: 'name' },
                { name: 'description' },
                { name: 'operationGuideType', hidden: true },
                { name: 'operationGuide', hidden: true }
              ]
            }
          },
          width: 300
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
        }
      ]
    }
  }

  _updateContext() {
    this._actions = []
    if (this._selectedRecord && this._selectedRecord.vas && this._selectedRecord.vas.operationGuideType) {
      this._actions = [this.adjustButton]
    }

    this._actions = [...this._actions, this.createButton]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _onFieldChange() {
    this.data = {
      ...this.dataGrist.dirtyData,
      records: this.dataGrist.dirtyData.records.map(record => {
        return {
          ...record,
          ...record.inventory,
          ready: this._isReadyToCreate(record)
        }
      })
    }
  }

  _isReadyToCreate(record) {
    if (record.vas && record.vas.operationGuideType) {
      return Boolean(record.operationGuide && record.inventory && record.remark)
    } else if (record.vas && !record.vas.operationGuideType) {
      return Boolean(record.inventory && record.remark)
    } else {
      return false
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
        this.data = { records: [] }
        this._template = null
        this._selectedRecord = null
        this._selectedRecordIdx = null
        navigate(`vas_order_detail/${response.data.generateVasOrder.name}`)
        this._showToast({ message: i18next.t('vas_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validate() {
    if (!this.data.records.every(record => record.ready)) throw new Error(i18next.t('text.invalid_data_in_list'))
  }

  async _executeRelatedTrxs() {
    try {
      this.data = {
        ...this.data,
        records: await (async () => {
          let records = []
          for (let i = 0; i < this.dataGrist.dirtyData.records.length; i++) {
            const record = this.dataGrist.dirtyData.records[i]

            if (record.vas.operationGuide && record.operationGuide && record.operationGuide.transactions) {
              const trxs = record.operationGuide.transactions || []

              for (let j = 0; j < trxs.length; j++) {
                const trx = trxs[j]
                record.operationGuide = await trx(record.operationGuide)
              }
            }
            records.push(record)
          }

          return records
        })()
      }
    } catch (e) {
      throw e
    }
  }

  _getVasOrder() {
    return {
      orderVass: this.data.records.map(record => {
        let orderVas = {
          batchId: record.inventory.batchId,
          remark: record.remark,
          inventory: { id: record.inventory.id },
          vas: { id: record.vas.id }
        }

        if (record.operationGuide && record.operationGuide.data) {
          delete record.operationGuide.transactions
          orderVas.operationGuide = JSON.stringify(record.operationGuide)
        }

        return orderVas
      })
    }
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
