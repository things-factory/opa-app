import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getColumns } from '@things-factory/resource-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { pathToFileURL } from 'url'

class TransportVehicle extends localize(i18next)(PageView) {
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
      title: i18next.t('title.transport_vehicle'),
      actions: [
        {
          title: i18next.t('button.add'),
          action: () => {
            console.log('this is add action')
          }
        },
        {
          title: i18next.t('button.save'),
          action: this._saveTransportVehicle.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteTransportVehicle.bind(this)
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
          id="vehicles"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  async firstUpdated() {
    const response = await getColumns('Transport Vehicle')
    this._columns = response.menu.columns
    this._searchFields = this._modifySearchFields(this._columns)

    this.config = {
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
          gutterName: 'row-selector'
        },
        ...this._modifyGridFields(this._columns)
      ]
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
        query{
          transportVehicles(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
            pagination: { page, limit },
            sortings: sorters
          })}){
            items{
              name
              regNumber
              description
              size
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

    this.rawVehicleData = response.data.transportVehicles.items

    return {
      total: response.data.transportVehicles.total || 0,
      records: response.data.transportVehicles.items || []
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

  async _saveTransportVehicle() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(vehicles => {
        vehicles.cuFlag = vehicles.__dirty__
        debugger
        delete vehicles.__dirty__
        return vehicles
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleTransportVehicle(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
              regNumber
              size
              status
              description
            }
          }
        `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }

  async _deleteTransportVehicle() {
    let confirmDelete = confirm('Are you sure?')
    if (confirmDelete) {
      try {
        const selectedVehicle = this.rawVehicleData.find(
          vehicleData => vehicleData.name === this.dataGrist.selected[0].name
        )
        await client.query({
          query: gql`
            mutation {
              deleteTransportVehicle(${gqlBuilder.buildArgs({ name: selectedVehicle.name })}){
                name
                regNumber
              }
            }
          `
        })

        this.dataGrist.fetch()
      } catch (e) {
        console.log(this.selectedVehicle)
        this._notify(e.message)
      }
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

window.customElements.define('transport-vehicle', TransportVehicle)
