import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

class WarehouseList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      backdrop: Boolean,
      direction: String,
      hovering: String,
      limit: Number,
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
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: hidden;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.warehouse_list'),
      actions: [
        {
          title: i18next.t('button.submit'),
          action: this.createWarehouse.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this.deleteWarehouseList.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="name"
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          id="warehouses"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          .fetchHandler="${this.fetchHandler.bind(this)}"
          @record-change="${this._onWarehouseChangeHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.name')
        }
      },
      {
        name: 'description',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.description')
        }
      },
      {
        name: 'warehouse',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.warehouse')
        }
      },
      {
        name: 'zone',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.zone')
        }
      },
      {
        name: 'section',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.section')
        }
      },
      {
        name: 'unit',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.unit')
        }
      },
      {
        name: 'shelf',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.shelf')
        }
      },
      {
        name: 'state',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.state')
        }
      }
    ]
    this.data = { records: [] }

    this.config = {
      pagination: {
        pages: [20, 40, 80, 100]
      },
      rows: {
        selectable: {
          multiple: false
        }
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
          icon: 'delete_outline',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.data.records.splice(rowIndex, 1)

              this.data = {
                ...this.data,
                records: [...this.data.records]
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.name'),
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'string',
          name: 'warehouse',
          header: i18next.t('field.warehouse'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'string',
          name: 'section',
          header: i18next.t('field.warehouse'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'string',
          name: 'shelf',
          header: i18next.t('field.shelf'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'string',
          name: 'state',
          header: i18next.t('field.state'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: {
            align: 'left'
          },
          header: i18next.t('field.updated_at'),
          width: 150
        }
      ]
    }
    this.data = await this._getWarehouseList()
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
        warehouses(${gqlBuilder.buildArgs({
          filters: this._conditionParser(),
          pagination: { page, limit },
          sortings: sorters
        })}) {
          items {
            name
            description
            type
            locations{
              id
              name
              zone
              row
              shelf
              status
              description
              warehouse
            }
            updatedAt
            updater{
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
      // total: this._parseOrderData(response.data.warehouses.items),
      total: response.data.warehouses.total || 0,
      records: response.data.warehouses.items || []
    }
  }

  _conditionParser() {
    if (!this.searchForm) return []
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

  async _onWarehouseChangeHandler(e) {
    const before = e.detail.before || {}
    const after = e.detail.after
    let record = this.data.records[e.detail.row]
    if (!record) {
      record = { ...after }
      this.data.records.push(record)
    } else if (record !== after) {
      record = Object.assign(record, after)
    }
  }

  async createWarehouse() {
    try {
      const warehouses = this._getNewWarehouses()

      await client.query({
        query: gql`
          mutation {
            createWarehouse(${gqlBuilder.buildArgs({
              warehouse: warehouses[0]
            })}) {
              name
              description
              type
              updatedAt
              updater
              {
                id
                name
                description
              }
            }
          }
        `
      })

      navigate('warehouses')
    } catch (e) {
      this._notify(e.message)
    }
  }

  async deleteWarehouseList() {
    let confirmDelete = confirm('Are you sure?')
    if (confirmDelete) {
      try {
        const selectedWarehouse = this.rawWarehouseData.find(
          warehouseData => warehouseData.name === this.dataGrist.selected[0].name
        )
        await client.query({
          query: gql`
            mutation {
              deleteWarehouse(${gqlBuilder.buildArgs({ name: selectedWarehouse.name })}){
                name
                description
              }
            }
          `
        })
        navigate('warehouses')
      } catch (e) {
        console.log(this.selectedWarehouse)

        this._notify(e.message)
      }
    }
    this._getGroupMenus()
    this._getScreens()
  }

  _getNewWarehouses() {
    const warehouses = this.shadowRoot.querySelector('#warehouses').dirtyRecords
    if (warehouses.length === 0) {
      throw new Error(i18next.t('text.list_is_not_completed'))
    } else {
      return warehouses.map(warehouse => {
        delete warehouses.__dirty__
        return warehouse
      })
    }
  }

  _notify(message, level = '') {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          level,
          message
        }
      })
    )
  }
}

window.customElements.define('warehouse-list', WarehouseList)
