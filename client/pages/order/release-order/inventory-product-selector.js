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
      config: Object,
      _productName: String
    }
  }

  activated(active) {
    if (JSON.parse(active)) {
      this.fetchInventoryProduct()
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        @submit=${() => this.inventoryGrist.fetch()}
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
        <mwc-button .productName=${this._productName} .batchId=${this._batchId} .currentQty=${this._currentQty}
          >${i18next.t('button.submit')}</mwc-button
        >
      </div>
    `
  }

  async firstUpdated() {
    this._searchFields = [
      {
        label: i18next.t('label.product'),
        name: 'productName',
        type: 'select',
        options: [{ value: '--Select a Product--' }],
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.product')
        }
      },
      {
        label: i18next.t('label.warehouse'),
        name: 'warehouseName',
        type: 'select',
        options: [{ value: '--Select a Warehouse--' }],
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.warehouse')
        }
      }
    ]

    this.inventoryConfig = {
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'object',
          name: 'product',
          record: { align: 'center' },
          header: i18next.t('field.product'),
          width: 250
        },
        {
          type: 'object',
          name: 'batchId',
          record: { align: 'center' },
          header: i18next.t('field.batch_id'),
          width: 200
        },
        {
          type: 'object',
          name: 'location',
          record: { align: 'center' },
          header: i18next.t('field.location'),
          width: 180
        },
        {
          type: 'ccfr4',
          name: 'qty',
          record: { align: 'center' },
          header: i18next.t('field.current_qty'),
          width: 120
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory')
  }

  async fetchInventoryProduct({ page, limit, sorters = [] }) {
    // const response = await client.query({
    //   query: gql`
    //     query {
    //       inventoryProducts(${gqlBuilder.buildArgs({
    //         filters: this.searchForm.queryFilters,
    //         pagination: { page, limit },
    //         sortings: sorters
    //       })}) {
    //         items {
    //           id
    //           name
    //           description
    //         }
    //         total
    //       }
    //     }
    //   `
    // })
    // if (!response.errors) {
    //   return {
    //     total: response.data.inventoryProducts.total || 0,
    //     records: response.data.inventoryProducts.items || []
    //   }
    // }
  }
}

window.customElements.define('inventory-product-selector', InventoryProductSelector)
