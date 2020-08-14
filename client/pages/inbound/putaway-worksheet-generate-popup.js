import { localize, i18next } from '@things-factory/i18n-base'
import { html, css, LitElement } from 'lit-element'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { client, CustomAlert } from '@things-factory/shell'
import gql from 'graphql-tag'
import { INVENTORY_STATUS } from '../inventory/constants'
import { WORKSHEET_STATUS } from './constants/worksheet'

class PutawayWorksheetGeneratePopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      inventoryGristConfig: Object,
      inventoryGristData: Object,
      crossDockGristConfig: Object,
      crossDockGristData: Object,
      arrivalNotice: Object,
      crossDocking: Boolean
    }
  }

  static get styles() {
    return [
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
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
      <div class="grist">
        ${this.crossDocking
          ? html` <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.cross_docking')}</h2>
              <data-grist
                id="cross-dock-grist"
                .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
                .config=${this.crossDockGristConfig}
                .data="${this.crossDockGristData}"
              ></data-grist>`
          : ''}

        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.unloaded_pallets')}</h2>
        <data-grist
          id="inventory-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.inventoryGristConfig}
          .data="${this.inventoryGristData}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click="${this._generatePutawayWorksheet.bind(this)}">${i18next.t('button.create')}</button>
      </div>
    `
  }

  constructor() {
    super()
    this.crossDockGristData = { records: [] }
    this.inventoryGristData = { records: [] }
  }

  firstUpdated() {
    if (this.crossDocking) {
      this.crossDockGristConfig = {
        list: { fields: ['batchId', 'palletId', 'product'] },
        pagination: { infinite: true },
        rows: { selectable: { multiple: true }, appendable: false },
        columns: [
          { type: 'gutter', gutterName: 'sequence' },
          {
            type: 'string',
            name: 'batchId',
            header: i18next.t('field.batch_no'),
            record: { align: 'center' },
            width: 150
          },
          {
            type: 'object',
            name: 'product',
            header: i18next.t('field.product'),
            record: { align: 'left' },
            width: 200
          },
          {
            type: 'string',
            name: 'packingType',
            header: i18next.t('field.packingType'),
            record: { align: 'center' },
            width: 200
          },
          {
            type: 'integer',
            name: 'releaseQty',
            header: i18next.t('field.releaseQty'),
            record: { align: 'center' },
            width: 80
          },
          {
            type: 'float',
            name: 'releaseWeight',
            header: i18next.t('field.release_weight'),
            record: { align: 'center' },
            width: 80
          }
        ]
      }
    }

    this.inventoryGristConfig = {
      list: { fields: ['batchId', 'palletId', 'product'] },
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'number',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        }
      ]
    }
  }

  get crossDockGrist() {
    return this.shadowRoot.querySelector('data-grist#cross-dock-grist')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  updated(changedProps) {
    if (changedProps.has('arrivalNotice')) {
      this.fetchPartiallyUnloadedPalltets()
    }

    if (changedProps.has('crossDocking') && this.crossDocking) {
      this.fetchCrossDockInventories()
    }
  }

  async fetchPartiallyUnloadedPalltets() {
    if (!this.arrivalNotice || !this.arrivalNotice.id) return

    try {
      const response = await client.query({
        query: gql`
          query { 
            inventories(${gqlBuilder.buildArgs({
              filters: [
                {
                  name: 'status',
                  operator: 'eq',
                  value: INVENTORY_STATUS.PARTIALLY_UNLOADED.value
                },
                {
                  name: 'refOrderId',
                  operator: 'eq',
                  value: this.arrivalNotice.id
                }
              ]
            })}) {
              items {
                id
                batchId
                product {
                  id
                  name
                  description
                }
                packingType
                palletId
                qty
                weight
                updatedAt
                updater {
                  name
                }
              }
            }
          }
        `
      })

      if (!response.errors) {
        this.inventoryGristData = { records: response.data.inventories.items }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async fetchCrossDockInventories() {
    const response = await client.query({
      query: gql`
        query {
          releaseGood(${gqlBuilder.buildArgs({
            name: this.arrivalNotice.releaseGood.name
          })}) {
            orderInventories {
              batchId
                packingType
                product {
                  id
                  name
                  description
                }
                releaseQty
                releaseWeight
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.crossDockGristData = {
        records: response.data.releaseGood.orderInventories
      }
    } else {
      history.back()
    }
  }

  async _generatePutawayWorksheet() {
    try {
      this.checkValidity()
      if (!this.arrivalNotice || !this.arrivalNotice.name) return

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.generate_putaway_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return
      const inventories = this.inventoryGrist.selected.map(record => {
        return { id: record.id }
      })

      const response = await client.query({
        query: gql`
            mutation {
              generatePartialPutawayWorksheet(${gqlBuilder.buildArgs({
                arrivalNoticeNo: this.arrivalNotice.name,
                inventories
              })})
            }
          `
      })

      if (!response.errors) {
        await CustomAlert({
          title: i18next.t('title.completed'),
          text: i18next.t('text.generate_putaway_worksheet'),
          confirmButton: { text: i18next.t('button.confirm') }
        })

        this.dispatchEvent(new CustomEvent('completed'))
        history.back()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  checkValidity() {
    if (!this.inventoryGrist.selected?.length) throw new Error(i18next.t('text.there_is_no_selected_items'))
    // Find out pallet which is included in cross dock picking
    const compareIdenticality = function (a, b) {
      return a.batchId === b.batchId && a.product.id === b.product.id && a.packingType === b.packingType
    }

    const { selectedInvs, nonSelectedInvs } = this.inventoryGrist.dirtyData.records.reduce(
      (inventories, record) => {
        if (record.__selected__) {
          inventories.selectedInvs.push(record)
        } else {
          inventories.nonSelectedInvs.push(record)
        }

        return inventories
      },
      { selectedInvs: [], nonSelectedInvs: [] }
    )

    const includedInvs = selectedInvs.filter(inv =>
      this.crossDockGrist.dirtyData.records.find(ordInv => compareIdenticality(inv, ordInv))
    )

    // If there's included pallets
    if (includedInvs.length) {
      // 선택되지 않은 인벤토리의 수량의 합계가 처리하려는 작업의 수량 보다 크거나 같아야함

      const isEveryQtySufficient = this.crossDockGrist.dirtyData.records.every(crossDockInv => {
        if (!includedInvs.find(inv => compareIdenticality(inv, crossDockInv))) {
          return true
        }

        const { qty, weight } = nonSelectedInvs
          .filter(nonSelectedInv => compareIdenticality(nonSelectedInv, crossDockInv))
          .reduce(
            (amount, inv) => {
              amount.qty += inv.qty
              amount.weight += inv.weight
              return amount
            },
            { qty: 0, weight: 0 }
          )

        return crossDockInv.releaseQty <= qty && crossDockInv.releaseWeight <= weight
      })

      if (!isEveryQtySufficient) {
        throw new Error(i18next.t('text.product_should_be_remain_for_picking'))
      }
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

window.customElements.define('putaway-worksheet-generate-popup', PutawayWorksheetGeneratePopup)
