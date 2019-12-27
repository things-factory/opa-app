import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import '@things-factory/import-ui'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import './inventory-by-product-detail'

class InventoryByProduct extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object
    }
  }

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

  get context() {
    return {
      title: i18next.t('title.inventory_by_product'),
      exportable: {
        name: i18next.t('title.inventory_by_product'),
        data: this._exportableData.bind(this)
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  pageInitialized() {
    this._searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        props: {
          searchOper: 'i_like'
        }
      },
      {
        label: i18next.t('field.product_ref'),
        name: 'productRef',
        type: 'object',
        queryName: 'products',
        field: 'name'
      },
      {
        label: i18next.t('field.type'),
        name: 'type',
        props: {
          searchOper: 'i_like'
        }
      }
    ]

    this.config = {
      rows: { appendable: false, selectable: { multiple: true } },
      list: { fields: ['name', 'description', 'qty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: this._showInventoryInfo.bind(this)
          }
        },
        {
          type: 'string',
          name: 'name',
          imex: { header: 'Name', key: 'name', width: 50, type: 'string' },
          header: i18next.t('field.name'),
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          imex: { header: 'Description', key: 'description', width: 50, type: 'string' },
          header: i18next.t('field.description'),
          width: 300
        },
        {
          type: 'object',
          name: 'productRef',
          record: {
            options: { queryName: 'products' }
          },
          imex: { header: 'Product Ref', key: 'product_ref', width: 50, type: 'string' },
          header: i18next.t('field.product_ref'),
          width: 300
        },
        {
          type: 'string',
          name: 'type',
          record: { align: 'center' },
          imex: { header: 'Type', key: 'type', width: 50, type: 'string' },
          header: i18next.t('field.type'),
          width: 150
        },
        {
          type: 'integer',
          name: 'qty',
          record: { align: 'center' },
          imex: { header: 'Qty', key: 'qty', width: 50, type: 'integer' },
          header: i18next.t('field.qty'),
          width: 80
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          inventoriesByProduct(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              product {
                id
                name
                description
                type
                productRef {
                  name
                  description
                }
              }
              qty
            }
            total
          }
        }
        `
    })

    if (!response.errors) {
      return {
        total: response.data.inventoriesByProduct.total || 0,
        records: (response.data.inventoriesByProduct.items || []).map(item => {
          return {
            ...item,
            ...item.product
          }
        })
      }
    }
  }

  get _columns() {
    return this.config.columns
  }

  async _fetchInventoriesForExport() {
    const page = 1
    const limit = 999999
    const response = await client.query({
      query: gql`
        query {
          inventoriesByProduct(${gqlBuilder.buildArgs({
            filters: [],
            pagination: { page, limit }
          })}) {
            items {
              product {
                id
                name
                description
                type
                productRef {
                  name
                  description
                }
              }
              qty
            }
            total
          }
        }
        `
    })

    if (!response.errors) {
      if (response.data.inventoriesByProduct.items.length > 0) {
        const products = response.data.inventoriesByProduct.items.map(item => {
          return {
            ...item.product,
            qty: item.qty
          }
        })
        return products
      } else {
        return []
      }
    }
  }

  async _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = await this._fetchInventoriesForExport()
    }

    var headerSetting = this.dataGrist._config.columns
      .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
      .map(column => {
        return column.imex
      })

    var data = records.map(item => {
      if (item.productRef) {
        var refName = item.productRef.name ? item.productRef.name : ''
        var refDesc = item.productRef.description ? ` (${item.productRef.description})` : ''
      }

      return {
        ...this._columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .reduce((record, column) => {
            record[column.imex.key] = column.imex.key
              .split('.')
              .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
            return record
          }, {}),
        id: item.id,
        name: item.name,
        description: item.description,
        product_ref: refName + refDesc
      }
    })

    return { header: headerSetting, data: data }
  }

  _showInventoryInfo(columns, data, column, record, rowIndex) {
    openPopup(
      html`
        <inventory-by-product-detail .productId="${record.id}"></inventory-by-product-detail>
      `,
      {
        backdrop: true,
        size: 'large',
        title: `${record.name} ${record.description ? `(${record.description})` : ''}`
      }
    )
  }
}

window.customElements.define('inventory-by-product', InventoryByProduct)
