import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

export class WorkerForm extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
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
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
      `
    ]
  }

  static get properties() {
    return {
      bizplaceId: String,
      bizplaceName: String,
      _searchFields: Array,
      config: Object,
      data: Object
    }
  }

  render() {
    return html`
      <h2>${this.bizplaceName}</h2>
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${async () => {
          const { records, total } = await this._getContactPoints()
          this.data = {
            records,
            total
          }
        }}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.contactPoint'),
      actions: [
        {
          title: 'add',
          action: () => {
            console.log('this is add action')
          }
        },
        {
          title: 'save',
          action: () => {
            console.log('this is save action')
          }
        },
        {
          title: 'delete',
          action: () => {
            console.log('this is delete action')
          }
        }
      ]
    }
  }

  async updated(changedProps) {
    if (changedProps.has('bizplaceId')) {
      const { records, total } = await this._getContactPoints()
      this.data = {
        records,
        total
      }
    }
  }

  async firstUpdated() {
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
        name: 'email',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.email')
        }
      },
      {
        name: 'fax',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.fax')
        }
      },
      {
        name: 'phone',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.phone')
        }
      },
      {
        name: 'description',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.description')
        }
      }
    ]

    this.config = {
      pagination: {
        infinite: true
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: false
        },
        {
          type: 'string',
          name: 'name',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.name'),
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.description'),
          width: 220
        },
        {
          type: 'string',
          name: 'email',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.email'),
          width: 120
        },
        {
          type: 'string',
          name: 'fax',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.fax'),
          width: 120
        },
        {
          type: 'string',
          name: 'phone',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.phone'),
          width: 120
        },
        {
          type: 'object',
          name: 'updater',
          record: {
            align: 'left',
            editable: false
          },
          header: i18next.t('field.updater'),
          width: 150
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: {
            align: 'left'
          },
          header: i18next.t('field.updated_at'),
          width: 150
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async _getContactPoints(bizplaceId, bizplaceName) {
    const response = await client.query({
      query: gql`
        query {
          contactPoints(${gqlBuilder.buildArgs({
            filters: this._conditionParser()
          })}) {
            items {
              name
              email
              fax
              phone
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

    return {
      total: response.data.contactPoints.total || 0,
      records: response.data.contactPoints.items || []
    }
  }

  _conditionParser() {
    if (!this.searchForm) return []
    const fields = this.searchForm.getFields()
    const conditions = [
      {
        name: 'bizplace_id',
        value: this.bizplaceId,
        operator: 'eq',
        dataType: 'string'
      }
    ]

    fields.forEach(field => {
      if ((field.type === 'text' && field.value) || field.value !== '' || field.type === 'checkbox') {
        conditions.push({
          name: field.name,
          value: field.type === 'checkbox' ? field.checked : field.value,
          operator: field.getAttribute('searchoper'),
          dataType: field.type === 'text' ? 'string' : field.type === 'number' ? 'float' : 'boolean'
        })
      }
    })

    return conditions
  }
}

window.customElements.define('contact-point-list', ContactPointList)
