import { i18next, localize } from '@things-factory/i18n-base'
import {
  client,
  gqlBuilder,
  isMobileDevice,
  PageView,
  PullToRefreshStyles,
  ScrollbarStyles
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '@things-factory/grist-ui'

class SystemUser extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      _fields: Array,
      config: Object,
      data: Object,
      page: Number,
      limit: Number
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      PullToRefreshStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        data-grist {
          flex: 1;
          overflow-y: auto;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.user')
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields="${this._searchFields}"
        initFocus="description"
        @submit="${this.getUsers}"
      ></search-form>

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
    `
  }

  async activated(active) {
    if (active) {
      this.data = await this.getUsers()
    }
  }

  firstUpdated() {
    this._searchFields = [
      {
        name: 'domain',
        type: 'text',
        props: {
          placeholder: i18next.t('field.domain'),
          searchOper: 'like'
        }
      },
      {
        name: 'name',
        type: 'text',
        props: {
          placeholder: i18next.t('field.name'),
          searchOper: 'like'
        }
      },
      {
        name: 'description',
        type: 'text',
        props: {
          placeholder: i18next.t('field.description'),
          searchOper: 'like'
        }
      },
      {
        name: 'email',
        type: 'text',
        props: {
          placeholder: i18next.t('field.email'),
          searchOper: 'like'
        }
      },
      {
        name: 'user_type',
        type: 'text',
        props: {
          placeholder: i18next.t('field.user_type'),
          searchOper: 'like'
        }
      }
    ]

    this.config = {
      columns: [
        {
          type: 'object',
          name: 'domain',
          header: i18next.t('field.domain'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'domains',
              basicArgs: {
                filters: [
                  {
                    name: 'system_flag',
                    operator: 'eq',
                    value: 'true',
                    dataType: 'boolean'
                  }
                ]
              }
            }
          },
          width: 250
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: true
          },
          width: 150
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: true
          },
          width: 200
        },
        {
          type: 'string',
          name: 'email',
          header: i18next.t('field.email'),
          record: {
            editable: true
          },
          width: 150
        },
        {
          type: 'string',
          name: 'user_type',
          header: i18next.t('field.user_type'),
          record: {
            editable: true
          },
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: {
            editable: false
          },
          width: 180
        },
        {
          type: 'datetime',
          name: 'updated_at',
          header: i18next.t('field.updated_at'),
          record: {
            editable: false
          },
          width: 180
        }
      ]
    }
  }

  async getUsers() {
    const response = await client.query({
      query: gql`
        query {
          users(${gqlBuilder.buildArgs({
            filters: this._parseFilters(),
            pagination: {
              page: this.page || 1,
              limit: this.limit || 30
            }
          })}) {
            items {
              id
              domain {
                id
                name
                description
              }
              name
              description
              email
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

    return {
      records: response.data.users.items,
      total: response.data.users.total
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  _parseFilters() {
    const fields = this.searchForm.getFields()
    const filters = fields.map(field => {
      const value =
        field.type === 'text' ? field.value : field.type === 'checkbox' ? JSON.stringify(field.checked) : field.value
      if (value) {
        return {
          name: field.name,
          value: field.value,
          operator: field.getAttribute('searchoper'),
          dataType: field.type === 'text' ? 'string' : field
        }
      }
    })
  }
}

window.customElements.define('system-user', SystemUser)
