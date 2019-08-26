import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemCreateUser extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      domains: Array,
      config: Object,
      data: Object,
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
        <h2>${i18next.t('title.create_user')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.bizplace')}</label>
            <select name="domain">
              ${this.domains.map(
                domain =>
                  html`
                    <option value="${domain.id}"
                      >${domain.name} ${domain.description ? ` (${domain.description})` : ''}</option
                    >
                  `
              )}
            </select>

            <label>${i18next.t('label.name')}</label>
            <input name="name" required />

            <label>${i18next.t('label.description')}</label>
            <input name="description" />

            <label>${i18next.t('label.email')}</label>
            <input name="email" type="email" required />

            <label>${i18next.t('label.password')}</label>
            <input name="password" type="password" />

            <label>${i18next.t('label.confirm_password')}</label>
            <input name="confirm_password" type="password" />
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
        <mwc-button @click="${this._createUser}">${i18next.t('button.submit')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.domains = await this._getDomains()
    const roles = await this._getRoles()
    this.data = {
      records: roles,
      total: roles.length
    }

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

  async _createUser() {
    try {
      const user = this._getUserInfo()
      await client.query({
        query: gql`
          mutation {
            createUser(${gqlBuilder.buildArgs({
              user
            })}) {
              name
            }
          }
        `
      })

      history.back()
    } catch (e) {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: e.message
          }
        })
      )
    }
  }

  _getUserInfo() {
    const password = this._getValidPassword()
    if (this.shadowRoot.querySelector('form').checkValidity() && password) {
      return {
        name: this._getInputByName('name').value,
        domain: { id: this._getInputByName('domain').value },
        description: this._getInputByName('description').value,
        password,
        email: this._getInputByName('email').value,
        roles: this._getChecekedRoles().map(role => role.id)
      }
    } else {
      throw new Error(i18next.t('text.user_info_not_valid'))
    }
  }

  _getValidPassword() {
    const password = this._getInputByName('password').value
    const confirmPassword = this._getInputByName('confirm_password').value

    if (password === confirmPassword) {
      return password
    }
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`select[name=${name}], input[name=${name}]`)
  }

  _getChecekedRoles() {
    const grist = this.shadowRoot.querySelector('data-grist')
    grist.commit()
    return grist.data.records.filter(role => role.checked)
  }
}

window.customElements.define('system-create-user', SystemCreateUser)
