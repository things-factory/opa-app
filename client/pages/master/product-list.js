import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../utils/custom-alert'
import '../components/import-pop-up'

class ProductList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object,
      importHandler: Object
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
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.product'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveProducts.bind(this)
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
        handler: this._importableData.bind(this)
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  pageInitialized() {
    this._searchFields = [
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
          imex: { header: 'Product Ref', key: 'product_ref', width: 50, type: 'string' },
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

  _setProductRefCondition(columns, data, column, record, rowIndex) {
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

  async importHandler(patches) {
    patches.map(itm => {
      itm.weight = parseFloat(itm.weight)
    })
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

  async _saveProducts() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(product => {
        let patchField = product.id ? { id: product.id } : {}
        const dirtyFields = product.__dirtyfields__
        for (let key in dirtyFields) {
          if (dirtyFields[key].after instanceof Object) {
            for (let objKey in dirtyFields[key].after) {
              if (objKey.startsWith('__')) delete dirtyFields[key].after[objKey]
            }
          }
          patchField[key] = dirtyFields[key].after
        }
        patchField.cuFlag = product.__dirty__

        return patchField
      })

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

  async _deleteProducts() {
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
              deleteProducts(${gqlBuilder.buildArgs({ names })})
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

  async _fetchProductsToExport() {
    const response = await client.query({
      query: gql`
        query {
          products(${gqlBuilder.buildArgs({
            filters: []
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
      return response.data.products.items || []
    }
  }

  async _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = await this._fetchProductsToExport()
    }

    var headerSetting = this.dataGrist._config.columns
      .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
      .map(column => {
        return column.imex
      })

    var data = records.map(item => {
      return {
        ...this._columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .reduce((record, column) => {
            record[column.imex.key] = column.imex.key
              .split('.')
              .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
            return record
          }, {}),
        id: item.id,
        product_ref: item.productRef ? item.productRef.name + ' (' + item.productRef.description + ')' : ''
      }
    })

    return { header: headerSetting, data: data }
  }
}

window.customElements.define('product-list', ProductList)
