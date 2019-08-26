import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { getCodeByName } from '@things-factory/code-base'

class ProductList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
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
      ]
    }
  }

  activated(active) {
    if (JSON.parse(active) && this.dataGrist) {
      this.dataGrist.fetch()
    }
  }

  firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.name')
        }
      },
      {
        name: 'yourName',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.your_name')
        }
      },
      {
        name: 'refTo',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.origin_product')
        }
      },
      {
        name: 'type',
        type: 'select',
        options: [
          {
            name: 'test',
            value: 'test'
          }
        ],
        props: {
          type: 'select',
          searchOper: 'eq',
          placeholder: i18next.t('field.type')
        }
      },
      {
        name: 'packageType',
        props: {
          searchOper: 'eq',
          placeholder: i18next.t('field.package_type')
        }
      }
    ]

    this.config = {
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'dirty'
        },
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: true
        },
        {
          type: 'string',
          name: 'name',
          record: {
            editable: true
          },
          header: i18next.t('field.name'),
          width: 180
        },
        {
          type: 'string',
          name: 'yourName',
          record: {
            editable: true
          },
          header: i18next.t('field.your_name'),
          width: 180
        },
        {
          type: 'string',
          name: 'description',
          record: {
            editable: true
          },
          header: i18next.t('field.description'),
          width: 250
        },
        {
          type: 'object',
          name: 'refTo',
          record: {
            editable: false
          },
          header: i18next.t('field.origin_product'),
          width: 250
        },
        {
          type: 'string',
          name: 'type',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.type'),
          width: 150
        },
        {
          type: 'string',
          name: 'packageType',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.package_type'),
          width: 150
        },
        {
          type: 'string',
          name: 'unit',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.unit'),
          width: 150
        },
        {
          type: 'number',
          name: 'weight',
          record: {
            align: 'right',
            editable: true
          },
          header: i18next.t('field.weight'),
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.updater'),
          width: 250
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.updated_at'),
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

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          products(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              bizplace {
                id
                name
                description
              }
              name
              yourName
              description
              refTo {
                id
                name
                description
              }
              type
              packageType
              weight
              unit
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

  _saveProducts() {}

  _deleteProducts() {}
}

window.customElements.define('product-list', ProductList)
