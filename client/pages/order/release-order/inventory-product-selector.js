import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import '../../components/import-pop-up'
import { LOCATION_TYPE } from '../constants/location'

export class InventoryProductSelector extends localize(i18next)(LitElement) {
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

        search-form {
          overflow: visible;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .grist-container {
          overflow-y: hidden;
          display: flex;
          flex: 1;
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
          margin-left: auto;
        }
        .button-container > mwc-button {
          padding: 10px;
        }
      `
    ]
  }

  static get properties() {
    return {
      _searchFields: Array,
      inventoryConfig: Object,
      _productName: String
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        @submit=${async () => this.inventoryGrist.fetch()}
      ></search-form>

      <div class="grist-container">
        <div class="grist">
          <h2>${i18next.t('title.inventory')}</h2>
          <data-grist
            id="inventory"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.inventoryConfig}
            .fetchHandler=${this.fetchInventoryProduct.bind(this)}
          ></data-grist>
        </div>
      </div>

      <div class="button-container">
        <mwc-button
          @click=${() => {
            history.back()
          }}
          >${i18next.t('button.cancel')}</mwc-button
        >
        <mwc-button @click="${this._confirm.bind(this)}">${i18next.t('button.confirm')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.inventoryConfig = {
      pagination: { infinite: true },
      list: {
        fields: ['product', 'batchId', 'location']
      },
      rows: {
        selectable: { multiple: true },
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          record: { align: 'center' },
          header: i18next.t('field.product'),
          sortable: true,
          width: 250
        },
        {
          type: 'string',
          name: 'batchId',
          record: { align: 'center' },
          header: i18next.t('field.batch_no'),
          sortable: true,
          width: 200
        },
        {
          type: 'object',
          name: 'location',
          record: { align: 'center' },
          header: i18next.t('field.location'),
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'packingType',
          record: { align: 'center' },
          header: i18next.t('field.packing_type'),
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'qty',
          record: { align: 'center' },
          header: i18next.t('field.qty'),
          sortable: true,
          width: 120
        }
      ]
    }

    this._searchFields = [
      {
        label: i18next.t('field.location'),
        name: 'locationName',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.batch_no'),
        name: 'batchId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.product'),
        name: 'productName',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.inventoryGrist.fetch()
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory')
  }

  async fetchInventoryProduct({ page, limit, sorters = [] }) {
    let inventory = {}
    this.searchForm.queryFilters.forEach(filter => {
      inventory[filter.name] = filter.value
    })
    const response = await client.query({
      query: gql`
        query {
          onhandInventories(${gqlBuilder.buildArgs({
            inventory,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              palletId
              batchId
              packingType
              bizplace {
                name
                description
              }
              product {
                name
                description
              }
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
        total: response.data.onhandInventories.total || 0,
        records: response.data.onhandInventories.items || []
      }
    }
  }

  _conditionParser() {
    return this.searchForm
      .getFields()
      .filter(field => (field.type !== 'checkbox' && field.value && field.value !== '') || field.type === 'checkbox')
      .map(field => {
        return {
          name: field.name,
          value:
            field.type === 'text'
              ? field.value
              : field.type === 'checkbox'
              ? field.checked
              : field.type === 'number'
              ? parseFloat(field.value)
              : field.value,
          operator: field.getAttribute('searchOper')
        }
      })
  }

  _confirm() {
    // getting data that you want to provide outside.
    // dispatch custom event for letting outside of componenet catch
    const selectedInventory = this.inventoryGrist.selected
    if (selectedInventory) {
      this.dispatchEvent(new CustomEvent('selected', { detail: this.inventoryGrist.selected }))
      history.back()
    } else {
      document.dispatchEvent(
        new CustomEvent('notify', { detail: { message: i18next.t('text.inventory_is_not_selected') } })
      )
    }
  }
}

window.customElements.define('inventory-product-selector', InventoryProductSelector)
