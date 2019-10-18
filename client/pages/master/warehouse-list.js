import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { openPopup } from '@things-factory/layout-base'
import { css, html } from 'lit-element'
import '../components/import-pop-up'
import { CustomAlert } from '../../utils/custom-alert'

class WarehouseList extends localize(i18next)(PageView) {
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
      data: Object,
      importHandler: Object
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${e => this.dataGrist.fetch()}
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
      title: i18next.t('title.warehouse'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveWarehouse.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteWarehouse.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.warehouse'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
    }
  }

  async pageInitialized() {
    this._warehouseTypes = await getCodeByName('WAREHOUSE_TYPES')
    this.bizplace = await this.fetchBizplace()

    this._searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.description'),
        name: 'description',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.type'),
        name: 'type',
        type: 'select',
        options: [
          { value: '' },
          ...this._warehouseTypes.map(_warehouseType => {
            return {
              name: _warehouseType.name,
              value: _warehouseType.name
            }
          })
        ],
        props: { searchOper: 'eq' }
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
              if (record.id) navigate(`locations/${record.id}?name=${record.name}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: true,
            align: 'center',
            imexSetting: { header: 'Name', key: 'name', width: 50, type: 'string' }
          },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: true,
            align: 'center',
            imexSetting: { header: 'Description', key: 'description', width: 100, type: 'string' }
          },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'bizplace',
          record: {
            align: 'center',
            editable: true,
            options: {
              queryName: 'bizplaces'
            },
            imexSetting: {
              header: 'Bizplace',
              key: 'bizplace.name',
              width: 50,
              type: 'array',
              arrData: this.bizplace
            }
          },
          header: i18next.t('field.customer'),
          width: 200
        },
        {
          type: 'code',
          name: 'type',
          header: i18next.t('field.type'),
          record: {
            editable: true,
            align: 'center',
            codeName: 'WAREHOUSE_TYPES',
            imexSetting: {
              header: 'Type',
              key: 'type',
              width: 50,
              type: 'array',
              arrData: this._warehouseTypes.map(_warehouseType => {
                return {
                  name: _warehouseType.name,
                  id: _warehouseType.name
                }
              })
            }
          },
          sortable: true,
          width: 100
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 180
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 180
        }
      ]
    }

    this.importConfig = {
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
              if (record.id) navigate(`locations/${record.id}?name=${record.name}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: true,
            align: 'center',
            imexSetting: { header: 'Name', key: 'name', width: 50, type: 'string' }
          },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: true,
            align: 'center',
            imexSetting: { header: 'Description', key: 'description', width: 100, type: 'string' }
          },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'bizplace',
          record: {
            align: 'center',
            editable: true,
            options: {
              queryName: 'bizplaces'
            },
            imexSetting: {
              header: 'Bizplace',
              key: 'bizplace.name',
              width: 50,
              type: 'array',
              arrData: this.bizplace
            }
          },
          header: i18next.t('field.customer'),
          width: 200
        },
        {
          type: 'code',
          name: 'type',
          header: i18next.t('field.type'),
          record: {
            editable: true,
            align: 'center',
            codeName: 'WAREHOUSE_TYPES',
            imexSetting: {
              header: 'Type',
              key: 'type',
              width: 50,
              type: 'array',
              arrData: this._warehouseTypes.map(_warehouseType => {
                return {
                  name: _warehouseType.name,
                  id: _warehouseType.name
                }
              })
            }
          },
          sortable: true,
          width: 100
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }
  async fetchBizplace() {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: []
            })}) {
              items {
                id
                name
              }
            }
          }
        `
    })
    return response.data.bizplaces.items
  }

  _importableData(records) {
    setTimeout(() => {
      openPopup(
        html`
          <import-pop-up
            .records=${records}
            .config=${this.importConfig}
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
    const response = await client.query({
      query: gql`
        query {
          warehouses(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {  
            items {
              id
              name
              bizplace
              {
                id
                name
              }
              type
              description
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
      total: response.data.warehouses.total || 0,
      records: response.data.warehouses.items || []
    }
  }

  async importHandler(patches) {
    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleWarehouse(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
    })

    if (!response.errors) {
      history.back()
      this.dataGrist.fetch()
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            message: i18next.t('text.data_imported_successfully')
          }
        })
      )
    }
  }

  async _saveWarehouse() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(warehouse => {
        let patchField = warehouse.id ? { id: warehouse.id } : {}
        const dirtyFields = warehouse.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.cuFlag = warehouse.__dirty__

        return patchField
      })

      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleWarehouse(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.data_updated_successfully')
            }
          })
        )
      }
    }
  }

  async _deleteWarehouse() {
    CustomAlert({
      title: i18next.t('text.are_you_sure'),
      text: i18next.t('text.you_wont_be_able_to_revert_this'),
      type: 'warning',
      confirmButton: { text: i18next.t('button.delete'), color: '#22a6a7' },
      cancelButton: { text: 'cancel', color: '#cfcfcf' },
      callback: async result => {
        if (result.value) {
          const names = this.dataGrist.selected.map(record => record.name)
          if (names && names.length > 0) {
            const response = await client.query({
              query: gql`
              mutation {
                deleteWarehouses(${gqlBuilder.buildArgs({ names })})
              }
            `
            })

            if (!response.errors) {
              this.dataGrist.fetch()
              document.dispatchEvent(
                new CustomEvent('notify', {
                  detail: {
                    message: i18next.t('text.data_deleted_successfully')
                  }
                })
              )
            }
          }
        }
      }
    })
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

    let headerSetting = this.dataGrist._config.columns
      .filter(
        column => column.type !== 'gutter' && column.record !== undefined && column.record.imexSetting !== undefined
      )
      .map(column => {
        return column.record.imexSetting
      })

    let data = records.map(item => {
      return {
        id: item.id,
        ...this._columns
          .filter(
            column => column.type !== 'gutter' && column.record !== undefined && column.record.imexSetting !== undefined
          )
          .reduce((record, column) => {
            record[column.record.imexSetting.key] = column.record.imexSetting.key
              .split('.')
              .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
            return record
          }, {})
      }
    })

    return { header: headerSetting, data: data }
  }
}

window.customElements.define('warehouse-list', WarehouseList)
