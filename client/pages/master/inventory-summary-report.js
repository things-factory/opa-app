import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

class InventorySummaryReport extends localize(i18next)(PageView) {
  constructor() {
    super()
    this.testPdf = []
    this.InventorySummaryReport = []
  }
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
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

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>

      <form class="multi-column-form">
        <fieldset>
          <!-- <label>${i18next.t('label.balance')}</label>
          <input name="balance" /> -->

          <label>${i18next.t('label.total_price')}</label>
          <input name="totalPrice" />
        </fieldset>
      </form>
    `
  }

  get context() {
    return {
      title: i18next.t('title.inventory_warehouse'),
      actions: [
        {
          title: i18next.t('button.toPdf'),
          action: this._savePdf.bind(this)
        }
        // {
        //   title: i18next.t('button.delete'),
        //   action: this._deleteProducts.bind(this)
        // }
      ]
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
        label: i18next.t('field.customer'),
        name: 'name',
        props: {
          searchOper: 'like'
        }
      },
      {
        type: 'select',
        name: 'bizplaces',
        record: {
          align: 'center',
          editable: true,
          options: {
            queryName: 'bizplaces'
            // basicArgs: {
            //   filters: [
            //     {
            //       name: 'name',
            //       value: 'o',
            //       operator: 'like',
            //       dataType: 'string'
            //     }
            //   ]
            // }
          }
        },
        width: 200
      },
      {
        type: 'select',
        name: 'product',
        record: {
          align: 'center',
          editable: true,
          options: {
            queryName: 'products'
            // basicArgs: {
            //   filters: [
            //     {
            //       name: 'name',
            //       value: 'o',
            //       operator: 'like',
            //       dataType: 'string'
            //     }
            //   ]
            // }
          }
        },
        width: 200
      },

      {
        label: i18next.t('field.start_date'),
        name: 'startDate',
        type: 'datetime-local',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.end_date'),
        name: 'endDate',
        type: 'datetime-local',
        props: { searchOper: 'like' }
      }
    ]

    this.config = {
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder'
          // handlers: {
          //   click: (columns, data, column, record, rowIndex) => {
          //     if (record.id) navigate(`product_options/${record.id}`)
          //   }
          // }
        },
        {
          type: 'string',
          name: 'name',
          record: {
            editable: true
          },
          header: i18next.t('field.name'),
          width: 180
        },
        // {
        //   type: 'object',
        //   name: 'bizplace',
        //   record: {
        //     align: 'center',
        //     editable: true,
        //     options: {
        //       queryName: 'bizplaces'
        //       // basicArgs: {
        //       //   filters: [
        //       //     {
        //       //       name: 'name',
        //       //       value: 'o',
        //       //       operator: 'like',
        //       //       dataType: 'string'
        //       //     }
        //       //   ]
        //       // }
        //     }
        //   },
        //   header: i18next.t('field.customer'),
        //   width: 200
        // },
        {
          type: 'integer',
          name: 'inQty',
          record: {
            editable: true
          },
          header: i18next.t('field.in'),
          width: 50
        },
        {
          type: 'integer',
          name: 'outQty',
          record: {
            editable: true
          },
          header: i18next.t('field.out'),
          width: 50
        },
        {
          type: 'string',
          name: 'description',
          record: {
            editable: true
          },
          header: i18next.t('field.description'),
          width: 250
        },
        {
          type: 'object',
          name: 'updater',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.updater'),
          width: 250
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.updated_at'),
          width: 180
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
          movements(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              description
              inQty
              outQty
              updater {
                id
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
        total: response.data.movements.total || 0,
        records: response.data.movements.items || []
      }
    }
  }

  _generatePDF(solihin) {
    let columns = ['Name', 'In', 'Out', 'Description']

    const doc = new jsPDF() // or let doc = new jsPDF.default();
    doc.autoTable(columns, solihin, {
      margin: { top: 50, left: 20, right: 20, bottom: 0 },
      createdHeaderCell: function(cell, data) {
        if (cell.raw === 'Name') {
          cell.styles.fontSize = 15
          cell.styles.textColor = 111
        } else {
          //else rule for drawHeaderCell hook
          cell.styles.textColor = 255
          cell.styles.fontSize = 10
        }
      },
      createdCell: function(cell, data) {
        if (cell.raw === 'Description') {
          cell.styles.fontSize = 15
          cell.styles.textColor = 111
        }
      }
    })
    doc.text('Opa App', 100, 5)
    doc.text('Warehouse Opening Balance                                Stock Total Average Cost', 5, 20)
    doc.save('inventory-summary-report')
  }

  async _savePdf() {
    let sol = []

    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(movement => {
        let patchField = movement.id ? { id: movement.id } : {}
        const dirtyFields = movement.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.cuFlag = movement.__dirty__

        const dataArray = []
        dataArray.push(movement.name)
        dataArray.push(movement.inQty)
        dataArray.push(movement.outQty)
        dataArray.push(movement.description)

        sol.push(dataArray)

        return patchField
      })
      this._generatePDF(sol)
      this.testPdf = sol
      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleMovement(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this._generatePDF(sol)

        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.data_updated_successfully')
            }
          })
        )
      }
    }
  }

  get _columns() {
    return this.config.columns
  }
}

window.customElements.define('inventory-summary-report', InventorySummaryReport)
