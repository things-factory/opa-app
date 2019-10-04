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

          <label>${i18next.t('label.total_balance')}</label>
          <input name="totalPrice" />
        </fieldset>
      </form>
    `
  }

  get context() {
    return {
      title: i18next.t('title.report_inventory_warehouse'),
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
          header: i18next.t('field.stock_name'),
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
    let columns = ['Stock Name', 'In', 'Out', 'Description']

    const doc = new jsPDF() // or let doc = new jsPDF.default();
    doc.autoTable(columns, solihin, {
      margin: { top: 40, left: 10, right: 10, bottom: 0 },
      styles: { textColor: [0, 0, 0], fillColor: [500, 500, 500] },
      // columnStyles: { 0: { halign: 'center', fillColor: [0, 0, 0] } },
      // columnStyles: { 1: { halign: 'center', fillColor: [0, 0, 0] } }
      rowStyles: { fillColor: [500, 500, 500] }
    })
    // doc.putTotalPages()

    doc.setFontSize(10)
    doc.text('Opa App.', 100, 10)
    doc.setFontSize(15)
    doc.text('Inventory Warehouse Detail', 75, 20)

    doc.setLineWidth(1)

    doc.line(8, 35, 200, 35)
    doc.setFontSize(10)
    doc.text(
      'Warehouse Opening Balance                                                                                                          Stock Total Average Cost',
      8,
      30
    )
    doc.page = 1 // use this as a counter.

    function pageNumber() {
      doc.text(187, 20, 'Page ' + doc.page) //print number bottom right
      doc.page++
    }
    pageNumber()

    var today = new Date()
    var newdat = '' + today
    doc.text(167.9, 5, newdat)
    // doc.text(107, 68, newdat)

    doc.save('inventory-summary-report')
  }

  async _savePdf() {
    let sol = []

    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(movement => {
        let patchField = movement.id ? { id: movement.id } : {}

        const dataArray = []
        dataArray.push(movement.name)
        dataArray.push(movement.inQty)
        dataArray.push(movement.outQty)
        dataArray.push(movement.description)

        sol.push(dataArray)

        return patchField
      })
      this.testPdf = sol
      const response = await sol.push({})

      if (!response.errors) {
        this._generatePDF(sol)

        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.turn_to_pdf_successfully')
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
