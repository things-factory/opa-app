import '@material/mwc-button/mwc-button'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { ScrollbarStyles } from '@things-factory/styles'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import './inventory-history-by-pallet'

class InventoryByProductDetail extends localize(i18next)(LitElement) {
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

        data-grist {
          overflow-y: auto;
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
      productId: String
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  firstUpdated() {
    this.config = {
      list: { fields: ['palletId', 'batchId', 'orderRefNo', 'orderNo', 'zone', 'location', 'qty'] },
      rows: { appendable: false },
      columns: [
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: this._showInventoryMovement.bind(this)
          }
        },
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
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          record: { align: 'center' },
          sortable: true,
          width: 80
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
        }
      ]
    }

    this._searchFields = [
      {
        label: i18next.t('field.batch_no'),
        name: 'batchId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.pallet_id'),
        name: 'palletId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.location'),
        name: 'location',
        type: 'object',
        queryName: 'locations',
        field: 'name'
      },
      {
        label: i18next.t('field.zone'),
        name: 'zone',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      if (!this.productId) return
      const filters = await this.searchForm.getQueryFilters()
      const response = await client.query({
        query: gql`
          query {
            inventories(${gqlBuilder.buildArgs({
              filters: [
                ...filters,
                { name: 'product_id', operator: 'eq', value: this.productId },
                { name: 'status', operator: 'notin', value: ['INTRANSIT', 'DELETED'] }
              ],
              pagination: { page, limit },
              sortings: sorters
            })}) {
              items {
                palletId
                batchId
                qty
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
          total: response.data.inventories.total || 0,
          records: response.data.inventories.items || []
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _showInventoryMovement(columns, data, column, record, rowIndex) {
    openPopup(
      html`
        <inventory-history-by-pallet .palletId="${record.palletId}"></inventory-history-by-pallet>
      `,
      {
        backdrop: true,
        size: 'large',
        title: `${record.palletId} - History`
      }
    )
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

window.customElements.define('inventory-by-product-detail', InventoryByProductDetail)
