import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class InventorySummaryReport extends localize(i18next)(PageView) {
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
          title: i18next.t('button.toPdf')
          // action: this._saveProducts.bind(this)
        }
        // {
        //   title: i18next.t('button.delete'),
        //   action: this._deleteProducts.bind(this)
        // }
      ]
    }
  }

  activated(active) {
    if (JSON.parse(active) && this.dataGrist) {
      this.dataGrist.fetch()
    }
  }

  async firstUpdated() {
    this._searchFields = [
      {
        label: i18next.t('label.customer'),
        name: 'name',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('label.customer')
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
        label: i18next.t('start_date'),
        name: 'startDate',
        type: 'datetime-local',
        props: { searchOper: 'like', placeholder: i18next.t('label.start_date') }
      },
      {
        label: i18next.t('end_date'),
        name: 'endDate',
        type: 'datetime-local',
        props: { searchOper: 'like', placeholder: i18next.t('label.end_date') }
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
        //   header: i18next.t('field.bizplace'),
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
            filters: this._conditionParser(),
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

  get _columns() {
    return this.config.columns
  }
}

window.customElements.define('inventory-summary-report', InventorySummaryReport)
