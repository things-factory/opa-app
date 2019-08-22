import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import './system-create-user'
import './system-user-detail'

class SystemUser extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      active: String,
      _searchFields: Array,
      _fields: Array,
      config: Object,
      data: Object,
      page: Number,
      limit: Number,
      _currentPopupName: String
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

        data-grist {
          flex: 1;
          overflow-y: auto;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.user'),
      actions: [
        {
          title: i18next.t('button.create_user'),
          action: this._createUser.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields="${this._searchFields}"
        initFocus="description"
        @submit="${async () => {
          this.data = await this._getUsers()
        }}"
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
      this.data = await this._getUsers()
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
      }
    ]

    this.config = {
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._currentPopupName = openPopup(
                html`
                  <system-user-detail .email="${record.email}" style="width: 90vw; height: 70vh;"></system-user-detail>
                `
              ).name
            }
          }
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'delete',
          handlers: {
            click: async (columns, data, column, record, rowIndex) => {
              if (confirm(i18next.t('text.sure_to_delete'))) {
                await this._deleteUser(record.email)
                this.data = await this._getUsers()
              }
            }
          }
        },
        {
          type: 'object',
          name: 'domain',
          header: i18next.t('field.domain'),
          record: {
            editable: false,
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
            editable: false
          },
          width: 150
        },
        {
          type: 'string',
          name: 'email',
          header: i18next.t('field.email'),
          record: {
            editable: false
          },
          width: 150
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: false
          },
          width: 200
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
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: {
            editable: false
          },
          width: 180
        }
      ]
    }
  }

  async _getUsers() {
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

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  _parseFilters() {
    let filters = []
    if (!this.searchForm) return filters
    const fields = this.searchForm.getFields()
    filters = fields.map(field => {
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

    return filters
  }

  _createUser() {
    this._currentPopupName = openPopup(
      html`
        <system-create-user style="width: 90vw; height: 70vh;"></system-create-user>
      `
    ).name
  }

  async _deleteUser(email) {
    await client.query({
      query: gql`
        mutation {
          deleteUser(${gqlBuilder.buildArgs({
            email
          })}) {
            id
            name
          }
        }
      `
    })
  }

  async stateChanged(state) {
    if (this.active && this._currentPopupName && !state.layout.viewparts[this._currentPopupName]) {
      this.data = await this._getUsers()
      this._currentPopupName = null
    }
  }
}

window.customElements.define('system-user', SystemUser)
