import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemRoleDetail extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      domains: Array,
      config: Object,
      data: Object,
      name: String,
      priviledges: Array,
      roleInfo: Object,
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
        <h2>${this.name}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.domain')}</label>
            <select name="domain">
              ${this.domains.map(domain => {
                const isSelected = this.roleInfo && this.roleInfo.domain && this.roleInfo.domain.id === domain.id

                return html`
                  <option value="${domain.id}" ?selected="${isSelected}">${domain.name} (${domain.description})</option>
                `
              })}
            </select>

            <label>${i18next.t('label.name')}</label>
            <input name="name" />

            <label>${i18next.t('label.description')}</label>
            <input name="description" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.priviledge')}</h2>
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
        <mwc-button @click="${this._saveRoleInfo}">${i18next.t('button.save')}</mwc-button>
      </div>
    `
  }

  async updated(changedProps) {
    if (changedProps.has('name')) {
      this.roleInfo = await this._getRoleInfo()
      this._fillupView()
    }

    if (changedProps.has('roleInfo') || changedProps.has('priviledges')) {
      this._checkPriviledge()
    }
  }

  async firstUpdated() {
    this.domains = await this._getDomains()
    this.priviledges = await this._getPriviledges()

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

  async _getPriviledges() {
    const response = await client.query({
      query: gql`
        query {
          priviledges(filters: []) {
            items {
              id
              name
              category
              description
            }
            total
          }
        }
      `
    })

    return response.data.priviledges.items
  }

  async _getRoleInfo() {
    const response = await client.query({
      query: gql`
        query {
          role(${gqlBuilder.buildArgs({
            name: this.name
          })}) {
            id
            name
            description
            priviledges {
              id
              name
              category
              description
            }
          }
        }
      `
    })
    return response.data.role
  }

  _fillupView() {
    Array.from(this.shadowRoot.querySelectorAll('input')).forEach(input => {
      input.value = this.roleInfo[input.name]
    })
  }

  _checkPriviledge() {
    if (
      this.roleInfo.priviledges &&
      this.roleInfo.priviledges.length >= 0 &&
      this.priviledges &&
      this.priviledges.length
    ) {
      this.data = {
        records: this.priviledges.map(priviledge => {
          const rolePriviledgesIds = this.roleInfo.priviledges.map(rolePriviledge => rolePriviledge.id)
          return {
            ...priviledge,
            checked: rolePriviledgesIds.includes(priviledge.id)
          }
        }),
        total: this.priviledges.length
      }
    }
  }

  async _saveRoleInfo() {
    const roleInfo = {
      name: this._getInputByName('name').value,
      description: this._getInputByName('description').value,
      priviledge: this._getChecekedPriviledges().map(priviledge => priviledge.id)
    }

    const response = await client.query({
      query: gql`
        mutation {
          updateRole(${gqlBuilder.buildArgs({
            name: this.name,
            patch: roleInfo
          })}) {
            id
            name
            description
            priviledges {
              id
              name
              category
            }
          }
        }
      `
    })

    this.roleInfo = { ...response.data.updateRole }
    this.name = this.roleInfo.name
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`input[name=${name}]`)
  }

  _getCheckedPriviledges() {
    const grist = this.shadowRoot.querySelector('data-grist')
    grist.commit()
    return grist.data.records.filter(priviledge => priviledge.checked)
  }
}

window.customElements.define('system-role-detail', SystemRoleDetail)
