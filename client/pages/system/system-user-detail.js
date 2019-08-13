import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemUserDetail extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      domains: Array,
      config: Object,
      data: Object,
      email: String,
      roles: Array,
      userInfo: Object,
      page: Number,
      limit: Number
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
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
        .button-container {
          display: flex;
        }
        .button-container > mwc-button {
          margin-left: auto;
        }
      `
    ]
  }

  constructor() {
    super()
    this.domains = []
    this.config = {}
    this.data = {}
    this.limit = 50
    this.page = 1
  }

  render() {
    return html`
      <div>
        <h2>${i18next.t('title.user')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.domain')}</label>
            <select name="domain">
              ${this.domains.map(domain => {
                const isSelected = this.userInfo && this.userInfo.domain && this.userInfo.domain.id === domain.id

                return html`
                  <option value="${domain.id}" ?selected="${isSelected}">${domain.name} (${domain.description})</option>
                `
              })}
            </select>

            <label>${i18next.t('label.name')}</label>
            <input name="name" />

            <label>${i18next.t('label.description')}</label>
            <input name="description" />

            <label>${i18next.t('label.email')}</label>
            <input name="email" />

            <label>${i18next.t('label.user_type')}</label>
            <input name="userType" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.role')}</h2>
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config="${this.config}"
          .data="${this.data}"
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._saveUserInfo}">${i18next.t('button.save')}</mwc-button>
      </div>
    `
  }

  async updated(changedProps) {
    if (changedProps.has('email')) {
      this.userInfo = await this._getUserInfo()
      this._fillupView()
    }

    if (changedProps.has('userInfo') || changedProps.has('roles')) {
      this._checkRole()
    }
  }

  async firstUpdated() {
    this.domains = await this._getDomains()
    this.roles = await this._getRoles()

    this.config = {
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: false
          }
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: false
          }
        },
        {
          type: 'boolean',
          name: 'checked',
          header: i18next.t('label.checked'),
          record: {
            editable: true
          }
        }
      ]
    }
  }

  async _getDomains() {
    const response = await client.query({
      query: gql`
        query {
          domains(filters: []) {
            items {
              id
              name
              description
            }
          }
        }
      `
    })

    return response.data.domains.items
  }

  async _getRoles() {
    const response = await client.query({
      query: gql`
        query {
          roles(filters: []) {
            items {
              id
              name
              description
            }
            total
          }
        }
      `
    })

    return response.data.roles.items
  }

  async _getUserInfo() {
    const response = await client.query({
      query: gql`
        query {
          user(${gqlBuilder.buildArgs({
            email: this.email
          })}) {
            id
            name
            description
            email
            userType
            roles {
              id
              name
              description
            }
          }
        }
      `
    })
    return response.data.user
  }

  _fillupView() {
    Array.from(this.shadowRoot.querySelectorAll('input')).forEach(input => {
      input.value = this.userInfo[input.name]
    })
  }

  _checkRole() {
    if (this.userInfo.roles && this.userInfo.roles.length >= 0 && this.roles && this.roles.length) {
      this.data = {
        records: this.roles.map(role => {
          const userRoleIds = this.userInfo.roles.map(userRole => userRole.id)
          return {
            ...role,
            checked: userRoleIds.includes(role.id)
          }
        }),
        total: this.roles.length
      }
    }
  }

  async _saveUserInfo() {
    const userInfo = {
      name: this._getInputByName('name').value,
      description: this._getInputByName('description').value,
      email: this._getInputByName('email').value,
      userType: this._getInputByName('userType').value,
      roles: this._getChecekedRoles().map(role => role.id)
    }

    const response = await client.query({
      query: gql`
        mutation {
          updateUser(${gqlBuilder.buildArgs({
            email: this.email,
            patch: userInfo
          })}) {
            id
            name
            description
            email
            userType
            roles {
              id
              name
              description
            }
          }
        }
      `
    })

    this.userInfo = { ...response.data.updateUser }
    this.email = this.userInfo.email
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`input[name=${name}]`)
  }

  _getChecekedRoles() {
    const grist = this.shadowRoot.querySelector('data-grist')
    grist.commit()
    return grist.data.records.filter(role => role.checked)
  }
}

window.customElements.define('system-user-detail', SystemUserDetail)
