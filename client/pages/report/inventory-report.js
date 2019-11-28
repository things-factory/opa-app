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
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: false,
            align: 'center'
          },
          width: 200
        },
        {
          type: 'string',
          name: 'product|name',
          header: i18next.t('field.product'),
          sortable: true,
          width: 300
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'transactionType',
          header: i18next.t('field.transaction_type'),
          record: { align: 'center' },
          sortable: true,
          width: 250
        },
        {
          type: 'datetime',
          name: 'createdAt',
          header: i18next.t('field.date'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'bizplace|name',
          header: i18next.t('field.customer'),
          record: {
            editable: false,
            align: 'left'
          },
          sortable: true,
          width: 300
        },
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
        groups: [
          { column: 'packingType', name: 'Packing Type' },
          { column: 'product|name', name: 'Product Name' },
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
              ...item
            })
          }) || []
      }

      // return {
      //   total: 0 || 0,
      //   records: [] || []
      // }
    } catch (e) {
      console.log(e)
      // this._showToast(e)
    }
  }
}

window.customElements.define('inventory-report', InventoryReport)
