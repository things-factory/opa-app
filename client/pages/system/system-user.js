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
        .fetchHandler=${this.fetchHandler.bind(this)}
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
              openPopup(
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
            align: 'center'
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

  async fetchHandler({}) {
    const response = await client.query({
      query: gql`
        query {
          users(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
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

  _createUser() {
    openPopup(
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
