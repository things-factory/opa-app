import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import {
  client,
  CustomAlert,
  gqlBuilder,
  isMobileDevice,
  PageView,
  ScrollbarStyles,
  store
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import '../components/import-pop-up'
import './product-option-detail-list'

class ProductOptionList extends connect(store)(localize(i18next)(PageView)) {
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

  static get properties() {
    return {
      _productId: String,
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
      title: i18next.t('title.product_option'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveProductOptions.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteProductOptions.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.product_option'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
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
        label: i18next.t('field.description'),
        name: 'description',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.config = {
      rows: {
        selectable: {
          multiple: true
        }
      },
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
              if (record.id && record.name) this._openProductOptionDetails(record.id, record.name)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 150
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

  _importableData(records) {
    setTimeout(() => {
      openPopup(
        html`
          <import-pop-up
            .records=${records}
            .config=${this.config}
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
    if (this._productId) {
      filters.push({
        name: 'product',
        operator: 'eq',
        value: this._productId
      })
    }

    const response = await client.query({
      query: gql`
        query {
          productOptions(${gqlBuilder.buildArgs({
            filters: [...filters, ...this.searchForm.queryFilters],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
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

    if (!response.errors) {
      return {
        total: response.data.productOptions.total || 0,
        records: response.data.productOptions.items || []
      }
    }
  }

  async importHandler(patches) {
    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleProductOption(${gqlBuilder.buildArgs({
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

  _openProductOptionDetails(productOptionId, productOptionName) {
    openPopup(
      html`
        <product-option-detail-list
          .productOptionId="${productOptionId}"
          .productOptionName="${productOptionName}"
        ></product-option-detail-list>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.product_option_detail_list')
      }
    )
  }

  async _saveProductOptions() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(productOption => {
        let patchField = productOption.id ? { id: productOption.id } : {}
        const dirtyFields = productOption.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.cuFlag = productOption.__dirty__
        if (this._productId) {
          patchField.product = { id: this._productId }
        }

        return patchField
      })

      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleProductOption(${gqlBuilder.buildArgs({
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

  async _deleteProductOptions() {
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
              deleteProductOptions(${gqlBuilder.buildArgs({
                product: {
                  id: this._productId
                },
                names
              })})
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
    return this.dataGrist.exportRecords()
  }

  stateChanged(state) {
    if (this.active) {
      this._productId = state && state.route && state.route.resourceId
    }
  }
}

window.customElements.define('product-option-list', ProductOptionList)
