import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getColumns } from '@things-factory/resource-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class BizplaceList extends localize(i18next)(PageView) {
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
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${async () => {
          const { records, total } = await this._getBizplaces()
          this.data = {
            records,
            total
          }
        }}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.bizplace'),
      actions: [
        {
          title: 'add',
          action: () => {
            console.log('this is add action')
          }
        },
        {
          title: 'save',
          action: () => {
            console.log('this is save action')
          }
        },
        {
          title: 'delete',
          action: () => {
            console.log('this is delete action')
          }
        }
      ]
    }
  }

  async firstUpdated() {
    this.config = {
      pagination: {
        infinite: true
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: false
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'search',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const selectedOrder = this.rawOrderData.find(orderData => orderData.name === record.name)
              navigate(`bizplace-list/${selectedOrder.resourceId}`)
            }
          }
        }
      ]
    }
  }

  async activated(active) {
    if (active) {
      const response = await getColumns('Bizplace')
      this._columns = response.menu.columns
      this._searchFields = this._modifySearchFields(this._columns)

      this.config = {
        ...this.config,
        columns: [...this.config.columns, ...this._modifyGridFields(this._columns)]
      }

      const { records, total } = await this._getBizplaces()
      this.data = {
        records,
        total
      }
    }
  }

  _modifySearchFields(columns) {
    return columns
      .filter(field => field.searchRank && field.searchRank > 0)
      .sort((a, b) => a.searchRank - b.searchRank)
      .map(field => {
        return {
          name: field.name,
          type: field.searchEditor ? field.searchEditor : 'text',
          props: {
            min: field.rangeVal ? field.rangeVal.split(',')[0] : null,
            max: field.rangeVal ? field.rangeVal.split(',')[1] : null,
            searchOper: field.searchOper ? field.searchOper : 'eq',
            placeholder: i18next.t(field.term)
          },
          value: field.searchInitVal
        }
      })
  }

  _modifyGridFields(columns) {
    return columns
      .filter(column => column.gridRank && column.gridRank > 0)
      .sort((a, b) => a.gridRank - b.gridRank)
      .map(column => {
        const type = column.refType == 'Entity' || column.refType == 'Menu' ? 'object' : column.colType
        return {
          type,
          name: column.name,
          header: i18next.t(column.term),
          record: {
            editable: column.gridEditor !== 'readonly',
            align: column.gridAlign || 'left'
          },
          sortable: true,
          width: column.gridWidth || 100
        }
      })
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async _getBizplaces() {
    const response = await client.query({
      query: gql`
        query {
          bizplaces(${gqlBuilder.buildArgs({
            filters: this._conditionParser()
          })}) {
            items {
              company {
                name
              }
              name
              description
              address
              postalCode
              status
              updatedAt
              updater {
                id
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
      total: response.data.bizplaces.total || 0,
      records: response.data.bizplaces.items || []
    }
  }

  _conditionParser() {
    const fields = this.searchForm.getFields()
    const conditionFields = fields.filter(
      field => (field.type !== 'checkbox' && field.value && field.value !== '') || field.type === 'checkbox'
    )
    const conditions = []

    conditionFields.forEach(field => {
      conditions.push({
        name: field.name,
        value: field.type === 'text' ? field.value : field.type === 'checkbox' ? field.checked : field.value,
        operator: field.getAttribute('searchOper'),
        dataType: field.type === 'text' ? 'string' : field.type === 'number' ? 'float' : 'boolean'
      })
    })
    return conditions
  }
}

window.customElements.define('bizplace-list', BizplaceList)
