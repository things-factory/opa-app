import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getColumns } from '@things-factory/resource-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { openPopup } from '@things-factory/layout-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import './location-list'

class WarehouseList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      backdrop: Boolean,
      direction: String,
      hovering: String,
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
      q

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
          icon: 'search',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._openLocations(record.id, record.name)
            }
          }
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
        }
      ]
    }
  }

  async activated(active) {
    if (active) {
      const response = await getColumns('Warehouse')
      this._columns = response.menu.columns
      this._searchFields = this._modifySearchFields(this._columns)

      this.config = {
        ...this.config,
        columns: [...this.config.columns, ...this._modifyGridFields(this._columns)]
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

    this.rawWarehouseData = response.data.warehouses.items

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
              locations{
                id
                name
                zone
                row
                column
                shelf
                status
                description
                
              }

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
                type
                description
              }
            }
          `
        })
        navigate('warehouses')
      } catch (e) {
        console.log(this.selectedVehicle)

        this._notify(e.message)
      }
    }
    // this._getGroupMenus()
    this._getScreens()
  }

  _getNewWarehouses() {
    const warehouses = this.shadowRoot.querySelector('#warehouses').dirtyRecords
    if (warehouses.length === 0) {
      throw new Error(i18next.t('text.list_is_not_completed'))
    } else {
      return warehouses.map(warehouse => {
        delete warehouse.__dirty__
        return warehouse
      })
    }
  }

  // async _getWarehouseCodes() {
  //   const response = await client.query({
  //     query: gql`
  //       query {
  //         commonCode(${gqlBuilder.buildArgs({
  //           name: 'WORKER_TYPE'
  //         })}) {
  //           name
  //           details {
  //             name
  //           }
  //         }
  //       }
  //     `
  //   })

  //   return response.data.commonCode.details.map(warehouse => warehouse.name)
  // }

  _openLocations(locationId, locationName) {
    openPopup(html`
      <location-list style="height: 400px;" .locationId="${locationId}" .locationName="${locationName}"></location-list>
    `)
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
