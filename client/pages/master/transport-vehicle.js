import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate, ScrollbarStyles } from '@things-factory/shell'
import { getColumns } from '@things-factory/resource-base'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

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
          action: this.updateMultipleTransportVehicle.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this.deleteTransportVehicle.bind(this)
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
          .data=${this.data}
          .fetchHandler="${this.fetchHandler.bind(this)}"
          @record-change="${this._onVehicleChangeHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  firstUpdated() {
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
        name: 'regNumber',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.registration_no')
        }
      },
      {
        name: 'size',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.size')
        }
      },
      {
        name: 'status',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.status')
        }
      }
    ]

    this.data = { records: [] }
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
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 250
        },
        {
          type: 'string',
          name: 'regNumber',
          header: i18next.t('field.registration_no'),
          record: {
            align: 'left',
            editable: true
          },
          width: 200
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
          name: 'size',
          header: i18next.t('field.size'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            align: 'center',
            editable: true
          },
          width: 250
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

  async _onVehicleChangeHandler(e) {
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

  async updateMultipleTransportVehicle() {
    try {
      const vehicles = this._getNewVehicles()

      await client.query({
        query: gql`
          mutation {
            updateMultipleTransportVehicle(${gqlBuilder.buildArgs({
              patches: vehicles[0]
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
    } catch (e) {
      this._notify(e.message)
    }
  }

  async deleteTransportVehicle() {
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
      } catch (e) {
        console.log(this.selectedVehicle)
        this._notify(e.message)
      }
    }
  }

  _getNewVehicles() {
    const vehicles = this.shadowRoot.querySelector('#vehicles').dirtyRecords
    if (vehicles.length === 0) {
      throw new Error(i18next.t('text.list_is_not_completed'))
    } else {
      return vehicles.map(vehicle => {
        delete vehicle.__dirty__
        return vehicle
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

window.customElements.define('transport-vehicle', TransportVehicle)
