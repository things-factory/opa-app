import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemCreateUser extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      bizplaces: Array,
      roleConfig: Object,
      userTypes: Array
    }
  }

  constructor() {
    super()
    this.userTypes = []
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
          overflow-y: auto;
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
        <h2>${i18next.t('title.create_user')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.customer')}</label>
            <select name="bizplace">
              ${(this.bizplaces || []).map(
                bizplace =>
                  html`
                    <option value="${bizplace.domain.id}"
                      >${bizplace.name} ${bizplace.description ? ` (${bizplace.description})` : ''}</option
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
            <input name="password" type="password" required />

            <label>${i18next.t('label.confirm_password')}</label>
            <input name="confirm_password" type="password" required />

            <label>${i18next.t('label.user_type')}</label>
            <select name="userType">
              ${(this.userTypes || []).map(
                userType =>
                  html`
                    <option value="${userType && userType.name}"
                      >${userType && userType.name}
                      ${userType && userType.description ? ` (${userType && userType.description})` : ''}</option
                    >
                  `
              )}
            </select>
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.role')}</h2>
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config="${this.roleConfig}"
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._createUser}">${i18next.t('button.create')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.bizplaces = await this._fetchBizplaces()
    this.userTypes = await getCodeByName('USER_TYPES')

    this.roleConfig = {
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
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
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: false
          },
          width: 250
        },
        {
          type: 'boolean',
          name: 'assigned',
          header: i18next.t('label.assigned'),
          record: {
            editable: true
          },
          width: 80
        }
      ]
    }
  }

  async _fetchBizplaces() {
    const response = await client.query({
      query: gql`
        query {
          bizplaces(${gqlBuilder.buildArgs({ filters: [] })}) {
            items {
              id
              name
              description
              domain {
                id
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.bizplaces.items || []
    }
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
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      return {
        records: response.data.roles.items || [],
        total: response.data.roles.total || 0
      }
    }
  }

  async _createUser() {
    try {
      const user = this._getUserInfo()
      const response = await client.query({
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

      if (!response.errors) {
        history.back()
        this.dispatchEvent(new CustomEvent('user-created', { bubbles: true, composed: true, cancelable: true }))
      }
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
    if (this.shadowRoot.querySelector('form').checkValidity() && this._validatePassword()) {
      return {
        name: this._getInputByName('name').value,
        domain: { id: this._getInputByName('bizplace').value },
        description: this._getInputByName('description').value,
        password: this._getInputByName('password').value,
        email: this._getInputByName('email').value,
        roles: this._getCheckedRoles(),
        userType: this._getInputByName('userType').value
      }
    } else {
      throw new Error(i18next.t('text.user_info_not_valid'))
    }
  }

  _validatePassword() {
    const password = this._getInputByName('password').value
    const confirmPassword = this._getInputByName('confirm_password').value
    return password === confirmPassword
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`select[name=${name}], input[name=${name}]`)
  }

  _getCheckedRoles() {
    const grist = this.shadowRoot.querySelector('data-grist')
    grist.commit()
    return grist.data.records
      .filter(role => role.assigned)
      .map(role => {
        return { id: role.id }
      })
  }
}

window.customElements.define('system-create-user', SystemCreateUser)
