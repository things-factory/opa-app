import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import './generate-list'

class LocationList extends connect(store)(localize(i18next)(PageView)) {
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
      _warehouseId: String,
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
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.location'),
      actions: [
        {
          title: i18next.t('button.generate'),
          action: this._generateLocation.bind(this)
        },
        {
          title: i18next.t('button.save'),
          action: this._saveLocation.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteLocation.bind(this)
        }
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
        name: 'name',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.name') }
      },
      {
        name: 'zone',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.zone') }
      },
      {
        name: 'row',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.row') }
      },
      {
        name: 'column',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.column') }
      },
      {
        name: 'shelf',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.shelf') }
      },
      {
        name: 'status',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.status') }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._openGenerate(record.id, record.name)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 150
        },

        {
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'row',
          header: i18next.t('field.row'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'column',
          header: i18next.t('field.column'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },

        {
          type: 'string',
          name: 'shelf',
          header: i18next.t('field.shelf'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
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
    let filters = []
    if (this._warehouseId) {
      filters.push({
        name: 'warehouse_id',
        operator: 'eq',
        value: this._warehouseId
      })
    }

    const response = await client.query({
      query: gql`
        query {
          locations(${gqlBuilder.buildArgs({
            filters: [...filters, ...this._conditionParser()],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              name
              zone
              row
              column
              shelf
              status
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

    this.rawLocationData = response.data.locations.items

    return {
      total: response.data.locations.total || 0,
      records: response.data.locations.items || []
    }
  }

  _openGenerate(locationId, locationName) {
    openPopup(html`
      <generate-list
        style="width: 80vw; height: 80vh"
        .locationId="${locationId}"
        .locationName="${locationName}"
      ></generate-list>
    `)
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

  async _saveLocation() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(location => {
        location.cuFlag = location.__dirty__
        if (this._warehouseId) {
          location.warehouse = { id: this._warehouseId }
        }
        delete location.__dirty__
        return location
      })

      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleLocation(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }

  async _deleteLocation() {
    const names = this.dataGrist.selected.map(record => record.name)
    if (names && names.length > 0) {
      const response = await client.query({
        query: gql`
            mutation {
              deleteLocations(${gqlBuilder.buildArgs({ names })})
            }
          `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }

  async _generateLocation(locationId, locationName) {
    openPopup(html`
      <generate-list
        style="width: 80vw; height: 80vh"
        .locationId="${locationId}"
        .locationName="${locationName}"
      ></generate-list>
    `)
  }

  stateChanged(state) {
    if (this.active) {
      this._warehouseId = state && state.route && state.route.resourceId
    }
  }
}

window.customElements.define('location-list', LocationList)
