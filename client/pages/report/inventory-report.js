import { html, css } from 'lit-element'
import { PageView, client, gqlBuilder, flattenObject } from '@things-factory/shell'
import { localize, i18next } from '@things-factory/i18n-base'
import gql from 'graphql-tag'
import { getCodeByName } from '@things-factory/code-base'

class InventoryReport extends localize(i18next)(PageView) {
  static get styles() {
    return css`
      :host {
        display: block;

        width: 100%;
      }

      data-report {
        width: 100%;
        height: 100%;
      }
    `
  }

  static get properties() {
    return {
      config: Object,
      data: Object
    }
  }

  get context() {
    return {
      title: 'Inventory Report',
      printable: true
    }
  }

  get report() {
    return this.shadowRoot.querySelector('data-report')
  }

  render() {
    return html`
      <!-- <search-form id="search-form" .fields=${this._searchFields} @submit=${e =>
        this.dataGrist.fetch()}></search-form> -->

      <data-report .config=${this.config} .fetchHandler=${this.fetchHandler}></data-report>
    `
  }

  get reportConfig() {
    return {
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'date',
          name: 'createdAt',
          header: i18next.t('field.date'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 130
        },
        {
          type: 'string',
          name: 'bizplace|name',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 300
        },
        {
          type: 'string',
          name: 'product|name',
          header: i18next.t('field.product'),
          sortable: true,
          width: 400
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: false,
            align: 'center'
          },
          width: 180
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        // {
        //   type: 'string',
        //   name: 'transactionFlow',
        //   header: i18next.t('field.transaction'),
        //   record: { align: 'center' },
        //   sortable: true,
        //   width: 120
        // },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          sortable: true,
          width: 100
        }
      ],
      rows: {
        selectable: false,
        groups: [
          { column: 'createdAt', name: 'Date' },
          { column: 'bizplace|name', name: 'Customer' },
          { column: 'product|name', name: 'Product' },
          { column: 'packingType', name: 'Packing Type' },
          { column: 'batchId', name: 'Batch' }
        ],
        totals: ['qty']
      }
    }
  }
  async pageInitialized() {
    this.config = this.reportConfig
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.report.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      const response = await client.query({
        query: gql`
          query {
            inventoryHistoryReport(${gqlBuilder.buildArgs({
              filters: [],
              pagination: { page, limit },
              sortings: sorters
            })}) {
              palletId
              batchId
              bizplace {
                name
                description
              }
              product {
                name
                description
              }
              qty
              status
              packingType
              transactionType
              transactionFlow
              createdAt
            }
          }
        `
      })
      return {
        total: 0,
        records:
          response.data.inventoryHistoryReport.map(item => {
            return flattenObject({
              ...item,
              productName: item.product.name + ' ( ' + item.product.description + ' )'
            })
          }) || []
      }

      // return {
      //   total: 0 || 0,
      //   records: [] || []
      // }
    } catch (e) {
      console.log(e)
    }
  }
}

window.customElements.define('inventory-report', InventoryReport)
