import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getCodeByName } from '@things-factory/code-base'
import { openImportPopUp } from '@things-factory/import-ui'
import {
  client,
  CustomAlert,
  gqlBuilder,
  isMobileDevice,
  PageView,
  ScrollbarStyles,
  navigate
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { openPopup } from '@things-factory/layout-base'
import './opa-product-batch-allocation'

class OpaProductAllocation extends localize(i18next)(PageView) {
  static get properties() {
    return {
      searchFields: Array,
      config: Object,
      allcationConfig: Object
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

        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .grist-product {
          flex: 4;
        }
        .grist-allocation {
          flex: 2;
        }

        .grist-container {
          overflow-y: hidden;
          display: flex;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form
        .fields=${this.searchFields}
        @submit=${e => {
          this.dataGrist.fetch()
          this.allcationConfig.fetch()
        }}
      ></search-form>

      <div class="grist-container">
        <div class="grist grist-product">
          <data-grist
            id="product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .data=${this.data}
            .fetchHandler="${this.fetchHandler.bind(this)}"
          ></data-grist>
        </div>
        <div class="grist grist-allocation">
          <data-grist
            id="allocation-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.allcationConfig}
            .fetchHandler="${this.fetchAllocationHandler.bind(this)}"
          ></data-grist>
        </div>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.product_allocation'),
      actions: [
        {
          title: i18next.t('button.batch_adjust'),
          action: this._showBatchPopup.bind(this)
        },
        {
          title: i18next.t('button.update_allocation'),
          action: () => {
            this.showToast(i18next.t('text.updated'))
          }
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('#product-grist')
  }
  get allocationDataGrist() {
    return this.shadowRoot.querySelector('#allocation-grist')
  }

  async pageInitialized() {
    const productType = await getCodeByName('PRODUCT_TYPES')
    const packingType = await getCodeByName('PACKING_TYPES')

    this.searchFields = [
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
      rows: {
        selectable: { multiple: true }
      },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'sku',
          record: { editable: false },
          imex: { header: 'sku', key: 'sku', width: 50, type: 'string' },
          header: i18next.t('field.sku'),
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'name',
          record: { editable: false },
          imex: { header: 'Name', key: 'name', width: 50, type: 'string' },
          header: i18next.t('field.name'),
          sortable: true,
          width: 180
        },
        {
          type: 'object',
          name: 'productRef',
          record: {
            editable: false,
            options: {
              queryName: 'products',
              select: [
                { name: 'id', hidden: true },
                { name: 'sku', header: i18next.t('field.sku'), width: 200 },
                { name: 'name', header: i18next.t('field.name'), width: 200 },
                { name: 'description', header: i18next.t('field.description'), width: 500 }
              ]
            }
          },
          imex: { header: 'Product Ref', key: 'productRef', width: 50, type: 'string' },
          header: i18next.t('field.product_ref'),

          sortable: true,
          width: 230
        },
        {
          type: 'select',
          name: 'type',
          header: i18next.t('field.type'),
          record: {
            editable: false,
            align: 'center',
            options: ['', ...Object.keys(productType).map(key => productType[key].name)]
          },
          imex: {
            header: i18next.t('field.type'),
            key: 'type',
            width: 50,
            type: 'array',
            arrData: productType.map(productType => {
              return {
                name: productType.name,
                id: productType.name
              }
            })
          },
          sortable: true,
          width: 120
        },
        {
          type: 'select',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: {
            editable: false,
            align: 'center',
            options: ['', ...Object.keys(packingType).map(key => packingType[key].name)]
          },
          imex: {
            header: i18next.t('field.packingType'),
            key: 'packingType',
            width: 50,
            type: 'array',
            arrData: packingType.map(packingType => {
              return {
                name: packingType.name,
                id: packingType.name
              }
            })
          },
          width: 120
        },
        {
          type: 'float',
          name: 'qty',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.qoh'),
          sortable: true,
          width: 120
        }
      ]
    }

    this.allcationConfig = {
      columns: [
        {
          type: 'string',
          name: 'retail',
          record: { align: 'center' },
          header: i18next.t('field.store_name'),
          width: 150
        },
        {
          type: 'string',
          name: 'allocation',
          record: { align: 'center', editable: true },
          header: i18next.t('field.inbound_allocation_percentage'),
          width: 230
        },
        {
          type: 'string',
          name: 'allocatedQuantity',
          record: { align: 'center', editable: true },
          header: i18next.t('field.allocated_quantity'),
          width: 170
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    const response = await client.query({
      query: gql`
        query {
          products(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              sku
              id
              name
              description
              productRef {
                name
                description
              }
              childProductRef{
                name
                description
              }
              childProductQty
              packingType
              type
              expirationPeriod
              weightUnit
              weight
              density
              lengthUnit
              width
              depth
              height
              auxUnit1
              auxValue1
              auxUnit2
              auxValue2
              auxUnit3
              auxValue3
              updater {
                name
                description
              }
              updatedAt
            }
            total
          }
        }
        `
    })

    if (!response.errors) {
      return {
        total: response.data.products.total || 0,
        records:
          response.data.products.items.map(itm => {
            return { ...itm, qty: 100 }
          }) || []
      }
    }
  }

  fetchAllocationHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    return {
      total: 10,
      records: [
        { retail: 'HQ', allocation: 20, allocatedQuantity: 20 },
        { retail: 'Subang', allocation: 5, allocatedQuantity: 5 },
        { retail: 'PJ', allocation: 15, allocatedQuantity: 15 },
        { retail: 'Shah Alam', allocation: 13, allocatedQuantity: 13 },
        { retail: 'Klang', allocation: 15, allocatedQuantity: 15 },
        { retail: 'Setapak', allocation: 4, allocatedQuantity: 4 },
        { retail: 'Cheras', allocation: 10, allocatedQuantity: 10 },
        { retail: 'Kajang', allocation: 16, allocatedQuantity: 16 },
        { retail: 'Kepong', allocation: 7, allocatedQuantity: 7 },
        { retail: 'Puchong', allocation: 5, allocatedQuantity: 5 }
      ]
    }
  }

  _showBatchPopup(columns, data, column, record, rowIndex) {
    const ids = this.dataGrist.selected.map(record => record.id)
    if (ids && ids.length > 0) {
      openPopup(html` <opa-product-batch-allocation></opa-product-batch-allocation> `, {
        backdrop: true,
        size: 'medium',
        title: `Batch Allocation`
      })
    } else {
      this.showToast(i18next.t('text.there_is_no_product'))
    }
  }

  showToast(message) {
    document.dispatchEvent(new CustomEvent('notify', { detail: { message } }))
  }
}

window.customElements.define('opa-product-allocation', OpaProductAllocation)
