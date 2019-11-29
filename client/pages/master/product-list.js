import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import '@things-factory/import-ui'
import { openImportPopUp } from '@things-factory/import-ui'
import { client, CustomAlert, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class ProductList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      searchFields: Array,
      config: Object
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
        data-grist {
          overflow-y: auto;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form .fields=${this.searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .data=${this.data}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.product'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => this._saveProducts(this.dataGrist.exportPatchList({ flagName: 'cuFlag ' }))
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteProducts.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.product'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: records => {
          const config = {
            rows: this.config.rows,
            columns: [...this.config.columns.filter(column => column.imex !== undefined)]
          }
          openImportPopUp(records, config, async patches => {
            await this._saveVas(patches)
            history.back()
          })
        }
      }
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  pageInitialized() {
    this.searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        props: {
          searchOper: 'i_like'
        }
      },
      {
        label: i18next.t('field.product_ref'),
        name: 'productRef',
        type: 'object',
        queryName: 'products',
        field: 'name'
      },
      {
        label: i18next.t('field.type'),
        name: 'type',
        props: {
          searchOper: 'i_like'
        }
      }
    ]

    this.config = {
      rows: {
        handlers: { click: this._setProductRefCondition.bind(this) },
        selectable: { multiple: true }
      },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          record: { editable: true },
          imex: { header: 'Name', key: 'name', width: 50, type: 'string' },
          header: i18next.t('field.name'),
          sortable: true,
          width: 180
        },
        {
          type: 'object',
          name: 'productRef',
          record: {
            editable: true,
            options: { queryName: 'products' }
          },
          imex: { header: 'Product Ref', key: 'productRef', width: 50, type: 'string' },
          header: i18next.t('field.product_ref'),
          sortable: true,
          width: 230
        },
        {
          type: 'string',
          name: 'description',
          record: { editable: true },
          imex: { header: 'Description', key: 'description', width: 50, type: 'string' },
          header: i18next.t('field.description'),
          sortable: true,
          width: 300
        },
        {
          type: 'float',
          name: 'weight',
          record: { editable: true, align: 'center' },
          imex: { header: 'Weight', key: 'weight', width: 50, type: 'float' },
          header: i18next.t('field.packing_weight'),
          width: 80
        },
        {
          type: 'string',
          name: 'unit',
          record: { editable: true, align: 'center' },
          imex: { header: 'Unit', key: 'unit', width: 50, type: 'string' },
          header: i18next.t('field.unit'),
          width: 80
        },
        {
          type: 'string',
          name: 'type',
          record: { align: 'center', editable: true },
          imex: { header: 'Type', key: 'type', width: 50, type: 'string' },
          header: i18next.t('field.type'),
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'updater',
          record: { align: 'center', editable: false },
          header: i18next.t('field.updater'),
          width: 250
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: { align: 'center', editable: false },
          header: i18next.t('field.updated_at'),
          sortable: true,
          width: 180
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    const response = await client.query({
      query: gql`
        query {
          products(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              productRef {
                name
                description
              }
              unit
              weight
              description
              type
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
        total: response.data.products.total || 0,
        records: response.data.products.items || []
      }
    }
  }

  _setProductRefCondition(_columns, _data, _column, record, _rowIndex) {
    this.config.columns.map(column => {
      if (column.name === 'productRef') {
        if (record && record.id) {
          column.record.options.basicArgs = { filters: [{ name: 'id', operator: 'noteq', value: record.id }] }
        } else {
          delete column.record.options.basicArgs
        }
      }
    })
  }

  async _saveProducts(patches) {
    if (patches && patches.length) {
      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleProduct(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this.showToast(i18next.t('text.data_updated_successfully'))
      }
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_changed'),
        text: i18next.t('text.there_is_nothing_to_save')
      })
    }
  }

  async _deleteProducts() {
    const ids = this.dataGrist.selected.map(record => record.id)
    if (ids && ids.length) {
      const anwer = await CustomAlert({
        type: 'warning',
        title: i18next.t('button.delete'),
        text: i18next.t('text.are_you_sure'),
        confirmButton: { text: i18next.t('button.delete') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!anwer.value) return
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_selected'),
        text: i18next.t('text.there_is_nothing_to_delete')
      })

      const response = await client.query({
        query: gql`
          mutation {
            deleteProducts(${gqlBuilder.buildArgs({ names })})
          }
        `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this.showToast(i18next.t('text.data_deleted_successfully'))
      }
    }
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
        ...this.config.columns
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

  showToast(message) {
    document.dispatchEvent(new CustomEvent('notify', { detail: { message } }))
  }
}

window.customElements.define('product-list', ProductList)
