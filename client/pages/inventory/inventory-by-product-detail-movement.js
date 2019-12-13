import '@material/mwc-button/mwc-button'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class InventoryByProductDetailMovement extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        search-form {
          overflow: visible;
        }

        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }

        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object,
      palletId: String
    }
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  firstUpdated() {
    this.config = {
      list: { fields: ['palletId', 'batchId', 'location', 'qty', 'weight', 'description'] },
      rows: { appendable: false },
      pagination: { infinite: true },
      columns: [
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          sortable: true,
          width: 200
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
          type: 'string',
          name: 'description',
          header: i18next.t('field.transaction_type'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.date'),
          record: { align: 'left' },
          sortable: true,
          width: 170
        }
      ]
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      if (!this.palletId) return
      const response = await client.query({
        query: gql`
          query {
            inventoryHistories(${gqlBuilder.buildArgs({
              filters: [
                { name: 'palletId', operator: 'eq', value: this.palletId },
                {
                  name: 'transactionType',
                  operator: 'in',
                  value: ['ADJUSTMENT', 'UNLOADING', 'PICKING', 'UNDO_UNLOADING']
                }
              ],
              pagination: { page, limit },
              sortings: sorters
            })}) {
              items {
                palletId
                batchId
                qty
                weight
                description
                warehouse {
                  name
                  description
                }
                zone
                location {
                  name
                  description
                }
                updatedAt
                updater {
                  name
                  description
                }
              }
              total
            }
          }
        `
      })

      if (!response.errors) {
        return {
          total: response.data.inventoryHistories.total || 0,
          records: response.data.inventoryHistories.items || []
        }
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

window.customElements.define('inventory-by-product-detail-movement', InventoryByProductDetailMovement)
