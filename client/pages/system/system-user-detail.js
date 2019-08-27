import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemUserDetail extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      userId: String,
      email: String,
      userInfo: Object,
      roleConfig: Object,
      priviledgeConfig: Object,
      _selectedRoleName: String,
      _priviledges: Object
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
            <input name="domain" readonly />

            <label>${i18next.t('label.name')}</label>
            <input name="name" required />

            <label>${i18next.t('label.description')}</label>
            <input name="description" />

            <label>${i18next.t('label.email')}</label>
            <input name="email" required />
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
            .config="${this.priviledgeConfig}"
            .data="${this._priviledges}"
          ></data-grist>
        </div>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._saveUserInfo}">${i18next.t('button.save')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.roleConfig = {
      rows: {
        handlers: {
          click: async (columns, data, column, record, rowIndex) => {
            this._selectedRoleName = record.name
            const priviledges = await this._fetchPriviledges(record.name)
            this._priviledges = {
              records: priviledges,
              total: priviledges.length
            }
          }
        }
      },
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

    this.priviledgeConfig = {
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'category',
          header: i18next.t('field.category'),
          record: {
            editable: false
          },
          width: 150
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
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: false
          },
          width: 250
        }
      ]
    }
  }

  async updated(changedProps) {
    if (changedProps.has('email')) {
      this.userInfo = await this._fetchUserInfo()
      this.dataGrist.fetch()
    }

    if (changedProps.has('userInfo')) {
      this._fillupView()
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async _fetchDomains() {
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

  async fetchHandler() {
    const response = await client.query({
      query: gql`
        query {
          userRoles(${gqlBuilder.buildArgs({
            userId: this.userId
          })}) {
            id
            name
            description
            assigned
          }
        }
      `
    })

    if (!response.errors) {
      return {
        records: response.data.userRoles || [],
        total: response.data.userRoles.length || 0
      }
    }
  }

  async _fetchUserInfo() {
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
    Array.from(this.shadowRoot.querySelectorAll('input')).forEach(input => {
      const userInfo = this.userInfo[input.name]
      input.value =
        userInfo instanceof Object
          ? `${userInfo.name} ${userInfo.description ? `(${userInfo.description})` : ''}`
          : userInfo
    })
  }

  async _fetchPriviledges(name) {
    const response = await client.query({
      query: gql`
        query {
          role(${gqlBuilder.buildArgs({
            name
          })}) {
            priviledges {
              category
              name
              description
            }
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.role.priviledges
    }
  }

  async _saveUserInfo() {
    try {
      const patch = this._getUserInfo()

      const response = await client.query({
        query: gql`
          mutation {
            updateUser(${gqlBuilder.buildArgs({
              email: this.email,
              patch
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

      this.userInfo = { ...response.data.updateUser }
      this.email = this.userInfo.email

      this.dispatchEvent(new CustomEvent('user-updated', { bubbles: true, composed: true, cancelable: true }))
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
    if (this.shadowRoot.querySelector('form').checkValidity()) {
      return {
        name: this._getInputByName('name').value,
        description: this._getInputByName('description').value,
        email: this._getInputByName('email').value,
        roles: this._getChecekedRoles()
      }
    } else {
      throw new Error(i18next.t('text.user_info_not_valid'))
    }
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`input[name=${name}]`)
  }

  _getChecekedRoles() {
    const grist = this.shadowRoot.querySelector('data-grist')
    grist.commit()
    return grist.data.records
      .filter(role => role.assigned)
      .map(role => {
        return { id: role.id }
      })
  }
}

window.customElements.define('system-user-detail', SystemUserDetail)
