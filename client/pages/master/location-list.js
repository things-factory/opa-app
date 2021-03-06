import { USBPrinter } from '@things-factory/barcode-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import '@things-factory/import-ui'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, PageView, store } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import { LOCATION_LABEL_SETTING_KEY } from '../constants'
import './generate-location-list'
import './print-location-label'

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

        data-grist {
          overflow-y: auto;
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      _warehouseName: String,
      _searchFields: Array,
      _locationList: Array,
      config: Object,
      _selectedRecords: Array
    }
  }

  constructor() {
    super()
    this._locationList = []
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${this._clearTempLocation.bind(this)}
      ></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
        @select-record-change=${e => (this._selectedRecords = e.detail.selectedRecords)}
        }
      ></data-grist>
    `
  }

  get context() {
    return {
      title: this._warehouseName,
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
        name: this._warehouseName,
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this._warehouseName = lifecycle.params.name ? lifecycle.params.name : undefined
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
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.type'),
        name: 'type',
        type: 'text',
        props: { searchOper: 'i_like' }
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
        props: { searchOper: 'i_like' }
      }
    ]

    this.config = {
      pagination: { pages: [20, 50, 100, 200] },
      rows: { selectable: { multiple: true } },
      list: {
        fields: ['name', 'type', 'status']
      },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.name'), key: 'name', width: 50, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'type',
          header: i18next.t('field.type'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.type'), key: 'type', width: 50, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.zone'), key: 'zone', width: 50, type: 'string' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'row',
          header: i18next.t('field.row'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.row'), key: 'row', width: 50, type: 'string' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'column',
          header: i18next.t('field.column'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.column'), key: 'column', width: 50, type: 'string' },
          sortable: true,
          width: 80
        },

        {
          type: 'string',
          name: 'shelf',
          header: i18next.t('field.shelf'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.shelf'), key: 'shelf', width: 50, type: 'string' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.status'), key: 'status', width: 50, type: 'string' },
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

  _importableData(records) {
    setTimeout(() => {
      openPopup(
        html`
          <import-pop-up
            .records=${records}
            .config=${{
              rows: this.config.rows,
              columns: [...this.config.columns.filter(column => column.imex !== undefined)]
            }}
            .importHandler="${this.importHandler.bind(this)}"
          ></import-pop-up>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.import')
        }
      )
    }, 500)
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    let filters = []
    if (this._warehouseId) {
      filters.push({
        name: 'warehouse_id',
        operator: 'eq',
        value: this._warehouseId
      })
    } else return

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

    if (!response.errors) {
      var responseItems = response.data.locations.items || []
      var total = response.data.locations.total || 0

      if (this._locationList.length > 0) {
        let generatedItems = this._locationList
        var records = [...responseItems, ...generatedItems]
        total += generatedItems.length
      }
    }

    return {
      records: records || responseItems || [],
      total: total || 0
    }
  }

  _clearTempLocation() {
    this._locationList = []
    this.dataGrist.fetch()
  }

  async importHandler(patches) {
    if (patches && patches.length) {
      patches = patches.map(patch => {
        if (this._warehouseId) {
          patch.warehouse = { id: this._warehouseId }
        }
        return patch
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

      if (!response.errors) {
        history.back()
        this._clearTempLocation()
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.data_imported_successfully')
            }
          })
        )
      }
    }
  }

  async _saveLocation() {
    let patches = this.dataGrist.exportPatchList({ flagName: 'cuFlag' })
    if (patches && patches.length) {
      patches = patches.map(patch => {
        if (this._warehouseId && !patch.warehouse) {
          patch.warehouse = { id: this._warehouseId }
        }
        return patch
      })

      try {
        this.dataGrist.showSpinner()

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

        if (!response.errors) {
          this._clearTempLocation()
          document.dispatchEvent(
            new CustomEvent('notify', {
              detail: {
                message: i18next.t('text.data_updated_successfully')
              }
            })
          )
        }
      } catch (e) {
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              level: error,
              message: e
            }
          })
        )
      } finally {
        this.dataGrist.hideSpinner()
      }
    }
  }

  async _deleteLocation() {
    CustomAlert({
      title: i18next.t('text.are_you_sure'),
      text: i18next.t('text.you_wont_be_able_to_revert_this'),
      type: 'warning',
      confirmButton: { text: i18next.t('button.delete'), color: '#22a6a7' },
      cancelButton: { text: i18next.t('button.cancel'), color: '#cfcfcf' },
      callback: async result => {
        if (result.value) {
          let ids = []
          this.dataGrist.selected.map(record => {
            if (record.id) ids.push(record.id)
          })
          if (ids && ids.length > 0) {
            const response = await client.query({
              query: gql`
                mutation {
                  deleteLocations(${gqlBuilder.buildArgs({ ids })})
                }
              `
            })

            if (!response.errors) {
              ids = []
              this._clearTempLocation()
            }
          } else
            document.dispatchEvent(
              new CustomEvent('notify', {
                detail: {
                  level: 'error',
                  message: `${i18next.t('text.cannot_delete_unsaved_location(s)')}`
                }
              })
            )
        }
      }
    })
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

    if (name) {
      CustomAlert({
        title: i18next.t('text.delete_all_locations?'),
        text: i18next.t('text.you_wont_be_able_to_revert_this'),
        type: 'warning',
        confirmButton: { text: i18next.t('button.delete_all'), color: '#22a6a7' },
        cancelButton: { text: i18next.t('button.cancel'), color: '#cfcfcf' },
        callback: async result => {
          if (result.value && name !== '') {
            const response = await client.query({
              query: gql`
                mutation {
                  deleteAllLocations(${gqlBuilder.buildArgs({ name })})
                }
              `
            })
            if (!response.errors) this._clearTempLocation()
          }
        }
      })
    } else {
      throw new Error(i18next.t('text.warehouse_not_found'))
    }
  }

  async _generateLocation() {
    openPopup(
      html`
        <generate-location-list
          @generated="${e => {
            this._locationList = e.detail
            this.dataGrist.fetch()
          }}"
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

    var headerSetting = this.dataGrist._config.columns
      .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
      .map(column => {
        return column.imex
      })

    var data = records.map(item => {
      return {
        id: item.id,
        ...this._columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .reduce((record, column) => {
            record[column.imex.key] = column.imex.key
              .split('.')
              .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
            return record
          }, {})
      }
    })

    return { header: headerSetting, data: data }
  }

  async _printLocationLabel() {
    let items = []

    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      items = this.dataGrist.selected
    }

    openPopup(
      html`
        <print-location-label
          .selectedLocations="${items}"
          .warehouseId="${this._warehouseId}"
          @printing="${e => {
            const records = e.detail
            this._printLocations(records)
            this.dataGrist.fetch()
          }}"
        ></print-location-label>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.print_location_label')
      }
    )
  }

  async _printLocations(records) {
    var labelId = this._locationLabel && this._locationLabel.id

    if (!labelId) {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: `${i18next.t('text.no_label_setting_was_found')}. ${i18next.t('text.please_check_your_setting')}`
          }
        })
      )
    } else {
      for (var record of records) {
        var searchParams = new URLSearchParams()

        /* for location record mapping */
        searchParams.append('location', record.name)
        searchParams.append('label', record.indicator)
        searchParams.append('row', record.row)
        searchParams.append('column', record.column)
        searchParams.append('shelf', record.shelf)

        try {
          const response = await fetch(`/label-command/${labelId}?${searchParams.toString()}`, {
            method: 'GET'
          })

          if (response.status !== 200) {
            throw `Error : Can't get label command from server (response: ${response.status})`
          }

          var command = await response.text()

          if (!this.printer) {
            this.printer = new USBPrinter()
          }

          await this.printer.connectAndPrint(command)
        } catch (ex) {
          document.dispatchEvent(
            new CustomEvent('notify', {
              detail: {
                level: 'error',
                message: ex,
                ex
              }
            })
          )

          delete this.printer
          break
        }
      }
    }
  }

  stateChanged(state) {
    var locationLabelSetting = state.dashboard[LOCATION_LABEL_SETTING_KEY]
    this._locationLabel = (locationLabelSetting && locationLabelSetting.board) || {}
  }
}

window.customElements.define('location-list', LocationList)
