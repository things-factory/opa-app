import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { getCodeByName } from '@things-factory/code-base'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { ScrollbarStyles } from '@things-factory/styles'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class CustomerOnhandInventory extends localize(i18next)(PageView) {
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
      data: Object
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.onhand_inventory'),
      exportable: {
        name: i18next.t('title.onhand_inventory'),
        data: this._exportableData.bind(this)
      }
    }
  }

  async pageInitialized() {
    const _packingType = await getCodeByName('PACKING_TYPES')
    this.config = {
      list: {
        fields: ['palletId', 'product', 'location']
      },
      rows: {
        appendable: false,
        selectable: { multiple: true }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.pallet_id'), key: 'palletId', width: 30, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.batch_no'), key: 'batchId', width: 30, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          imex: {
            header: i18next.t('field.product'),
            key: 'product.name',
            width: 50,
            type: 'string'
          },
          sortable: true,
          width: 500
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: false,
            align: 'left',
            codeName: 'PACKING_TYPES'
          },
          imex: {
            header: i18next.t('field.packing_type'),
            key: 'packingType',
            width: 50,
            type: 'string'
          },
          width: 150
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.qty'), key: 'qty', width: 30, type: 'number' },
          sortable: true,
          width: 80
        },
        {
          type: 'number',
          name: 'weight',
          header: i18next.t('field.total_weight'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.total_weight'), key: 'weight', width: 30, type: 'number' },
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          imex: {
            header: i18next.t('field.location'),
            key: 'location.name',
            width: 15,
            type: 'string'
          },
          sortable: true,
          width: 120
        }
      ]
    }

    this._searchFields = [
      {
        label: i18next.t('field.product'),
        name: 'product',
        type: 'object',
        queryName: 'products',
        field: 'name'
      },
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
        label: i18next.t('field.packing_type'),
        name: 'packingType',
        type: 'select',
        options: [
          { value: '' },
          ..._packingType.map(packingType => {
            return {
              name: packingType.name,
              value: packingType.name
            }
          })
        ],
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.location'),
        name: 'location',
        type: 'object',
        queryName: 'locations',
        field: 'name'
      }
    ]
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get _columns() {
    return this.config.columns
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
        query {
          inventories(${gqlBuilder.buildArgs({
            filters: [...filters, { name: 'status', operator: 'notin', value: ['INTRANSIT', 'TERMINATED', 'DELETED'] }],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              palletId
              batchId
              product {
                name
                description
              }
              packingType
              qty
              weight
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

    return {
      total: response.data.inventories.total || 0,
      records: response.data.inventories.items || []
    }
  }

  async fetchInventoriesForExport() {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
        query {
          inventories(${gqlBuilder.buildArgs({
            filters: [...filters, { name: 'status', operator: 'notin', value: ['INTRANSIT', 'TERMINATED', 'DELETED'] }],
            pagination: { page: 1, limit: 9999999 },
            sortings: []
          })}) {
            items {
              id
              palletId
              batchId
              packingType
              weight
              bizplace {
                id
                name
                description
              }
              product {
                id
                name
              }
              qty
              warehouse {
                id
                name
                description
              }
              zone
              location {
                id
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

    return response.data.inventories.items || []
  }

  async _exportableData() {
    try {
      let records = []
      let data = []

      var headerSetting = [
        ...this.dataGrist._config.columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .map(column => {
            return column.imex
          })
      ]

      if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
        records = this.dataGrist.selected
        data = records
      } else {
        data = await this.fetchInventoriesForExport()
      }

      data = data.map(item => {
        return {
          id: item.id,
          ...this._columns
            .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
            .reduce((record, column) => {
              record[column.imex.key] = column.imex.key
                .split('.')
                .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
              return record
            }, {})
        }
      })

      return { header: headerSetting, data: data }
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

window.customElements.define('customer-onhand-inventory', CustomerOnhandInventory)
