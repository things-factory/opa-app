import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemUserDetail extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      domains: Array,
      roleConfig: Object,
      priviledgeConfig: Object,
      email: String,
      roles: Array,
      _selectedRoleName: String,
      _priviledges: Object,
      userInfo: Object
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
          flex: 1;
          overflow-y: auto;
        }
        .grist-column {
          flex: 1;
          display: flex;
          flex-direction: column;
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

  render() {
    return html`
      <div>
        <h2>${i18next.t('title.user')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.domain')}</label>
            <select name="domain">
              ${(this.domains || []).map(domain => {
                const isSelected = this.userInfo && this.userInfo.domain && this.userInfo.domain.id === domain.id

                return html`
                  <option value="${domain.id}" ?selected="${isSelected}"
                    >${domain.name} ${domain.description ? `(${domain.description})` : ''}</option
                  >
                `
              })}
            </select>

            <label>${i18next.t('label.name')}</label>
            <input name="name" />

            <label>${i18next.t('label.description')}</label>
            <input name="description" />

            <label>${i18next.t('label.email')}</label>
            <input name="email" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <div class="grist-column">
          <h2>${i18next.t('title.role')}</h2>
          <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config="${this.roleConfig}"
            .fetchHandler="${this.fetchHandler.bind(this)}"
          ></data-grist>
        </div>

        <div class="grist-column">
          <h2>${i18next.t('title.priviledge')}: ${this._selectedRoleName}</h2>
          <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .data="${this._priviledges}"
            .config="${this.priviledgeConfig}"
          ></data-grist>
        </div>
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

    this.roleConfig = {
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._selectedRoleName = record.name
              this._priviledges = {
                records: record.priviledges,
                total: record.priviledges.length
              }
            }
          }
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

    this.priviledgeConfig = {
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'category',
          header: i18next.t('field.category'),
          record: {
            editable: false
          }
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

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          roles(${gqlBuilder.buildArgs({
            filters: [],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              priviledges {
                id
                category
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
        total: response.data.roles.total || 0,
        records: response.data.roles.items || []
      }
    }
  }

  async _getUserInfo() {
    const response = await client.query({
      query: gql`
        query {
          user(${gqlBuilder.buildArgs({
            email: this.email
          })}) {
            id
            domain {
              id
              name
              description
            }
            name
            description
            email
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
    Array.from(this.shadowRoot.querySelectorAll('input, select')).forEach(input => {
      input.value =
        this.userInfo[input.name] instanceof Object ? this.userInfo[input.name].name : this.userInfo[input.name]
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
    const patch = {
      name: this._getInputByName('name').value,
      description: this._getInputByName('description').value,
      email: this._getInputByName('email').value,
      roles: this._getChecekedRoles().map(role => {
        return { id: role.id }
      })
    }

    const response = await client.query({
      query: gql`
        mutation {
          updateUser(${gqlBuilder.buildArgs({
            email: this.email,
            patch
          })}) {
            id
            name
            description
            email
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
