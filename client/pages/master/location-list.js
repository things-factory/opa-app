import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import './generate-location-list'
import { USBPrinter } from '@things-factory/barcode-base'
import Swal from 'sweetalert2'

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
          background-color: var(--main-section-background-color);
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

  static get properties() {
    return {
      _warehouseId: String,
      _searchFields: Array,
      config: Object
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
          title: i18next.t('button.print_label'),
          action: this._printLocationLabel.bind(this)
        },
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
        },
        {
          title: i18next.t('button.delete_all'),
          action: this._deleteAllLocations.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.location'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: () => {}
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this._warehouseId = lifecycle.resourceId
      this.dataGrist.fetch()
    }
  }

  pageInitialized() {
    this._searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.type'),
        name: 'type',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.zone'),
        name: 'zone',
        type: 'text',
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.row'),
        name: 'row',
        type: 'text',
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.column'),
        name: 'column',
        type: 'text',
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.shelf'),
        name: 'shelf',
        type: 'text',
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'text',
        props: { searchOper: 'like' }
      }
    ]

    this.config = {
      pagination: { pages: [20, 50, 100, 200] },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'type',
          header: i18next.t('field.type'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'row',
          header: i18next.t('field.row'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'column',
          header: i18next.t('field.column'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 80
        },

        {
          type: 'string',
          name: 'shelf',
          header: i18next.t('field.shelf'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'center' },
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
            filters: [...filters, ...this.searchForm.queryFilters],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              zone
              row
              type
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

  async _saveLocation() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(location => {
        let patchField = location.id ? { id: location.id } : {}
        const dirtyFields = location.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.cuFlag = location.__dirty__
        if (this._warehouseId) {
          patchField.warehouse = { id: this._warehouseId }
        }

        return patchField
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

  async _deleteAllLocations() {
    let filters = []
    if (this._warehouseId) {
      filters.push({
        name: 'id',
        operator: 'eq',
        value: this._warehouseId
      })
    }

    const retrieve = await client.query({
      query: gql`
          query {
            warehouses(${gqlBuilder.buildArgs({
              filters: [...filters],
              pagination: {},
              sortings: []
            })}) {
              items {
                id
                name
              }
            }
          }
        `
    })
    let name = retrieve.data.warehouses.items[0].name

    Swal.fire({
      title: i18next.t('text.delete_all_locations?'),
      text: i18next.t('text.you_wont_be_able_to_revert_this!'),
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22a6a7',
      cancelButtonColor: '#cfcfcf',
      confirmButtonText: i18next.t('button.delete_all'),
      cancelButtonText: i18next.t('button.cancel')
    }).then(async result => {
      if (result.value && name !== '') {
        const response = await client.query({
          query: gql`
              mutation {
                deleteAllLocations(${gqlBuilder.buildArgs({ name })})
              }
            `
        })
        if (!response.errors) this.dataGrist.fetch()
      }
    })
  }

  async _printLocationLabel() {
    const records = this.dataGrist.selected
    var labelId = this._locationLabel && this._locationLabel.id

    if (!labelId) {
      Swal.fire({
        title: i18next.t('text.no_label_setting_was_found'),
        text: i18next.t('text.please_check_your_setting'),
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#22a6a7',
        cancelButtonColor: '#cfcfcf',
        confirmButtonText: i18next.t('button.setting'),
        cancelButtonText: i18next.t('text.cancel')
      }).then(nav => {
        if (nav.value) navigate('setting')
      })
    } else {
      for (var record of records) {
        var searchParams = new URLSearchParams()
        searchParams.append('location', record.name)
        searchParams.append('shelf', record.shelf)

        const response = await fetch(`/label-command/${labelId}?${searchParams.toString()}`, {
          method: 'GET'
        })

        var command = await response.text()

        try {
          if (!this.printer) {
            this.printer = new USBPrinter()
          }

          await this.printer.connectAndPrint(command)
        } catch (e) {
          throw new Error(e)
        }
      }
    }
  }

  async _generateLocation() {
    openPopup(
      html`
        <generate-location-list
          .warehouseId="${this._warehouseId}"
          .callback="${this.dataGrist.fetch.bind(this.dataGrist)}"
        ></generate-location-list>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.generate_location_list')
      }
    )
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = this.dataGrist.data.records
    }

    return records.map(item => {
      return this._columns
        .filter(column => column.type !== 'gutter')
        .reduce((record, column) => {
          record[column.name] = item[column.name]
          return record
        }, {})
    })
  }

  stateChanged(state) {
    this._locationLabel = state.labelSettings.locationLabel
  }
}

window.customElements.define('location-list', LocationList)
