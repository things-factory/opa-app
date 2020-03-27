import { localize, i18next } from '@things-factory/i18n-base'
import { html, css, LitElement } from 'lit-element'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { client, CustomAlert } from '@things-factory/shell'
import gql from 'graphql-tag'
import { INVENTORY_STATUS } from '../inventory/constants'

class PutawayWorksheetGeneratePopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      config: Object,
      data: Object,
      arrivalNotice: Object
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
          margin-left: auto;
        }
      `
    ]
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data="${this.data}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._generatePutawayWorksheet.bind(this)}">${i18next.t('button.create')}</mwc-button>
      </div>
    `
  }

  constructor() {
    super()
    this.data = { records: [] }
  }

  firstUpdated() {
    this.config = {
      list: { fields: ['batchId', 'palletId', 'product'] },
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true },
        appendable: false
      },
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

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  updated(changedProps) {
    if (changedProps.has('arrivalNotice')) {
      this._fetchPartiallyUnloadedPalltets()
    }
  }

  async _fetchPartiallyUnloadedPalltets() {
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
                  name
                  description
                }
                packingType
                palletId
                qty
                updatedAt
                updater {
                  name
                  description
                }
              }
            }
          }
        `
      })

      if (!response.errors) {
        this.data = {
          ...this.data,
          records: response.data.inventories.items
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _generatePutawayWorksheet() {
    try {
      const inventories = this.grist.selected.map(inv => {
        return { id: inv.id }
      })
      if (!inventories || inventories.length == 0) {
        throw new Error(i18next.t('text.there_is_no_selected_items'))
      }
      if (!this.arrivalNotice || !this.arrivalNotice.name) return

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.generate_putaway_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

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
