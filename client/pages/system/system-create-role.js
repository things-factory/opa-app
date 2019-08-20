import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemCreateRole extends localize(i18next)(LitElement) {
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
        <h2>${i18next.t('title.create_role')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.domain')}</label>
            <select name="domain">
              ${this.domains.map(
                domain =>
                  html`
                    <option value="${domain.id}">${domain.name} (${domain.description})</option>
                  `
              )}
            </select>

            <label>${i18next.t('label.role_name')}</label>
            <input name="name" required />

            <label>${i18next.t('label.role_description')}</label>
            <input name="description" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.assign_priviledge')}</h2>
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
        <mwc-button @click="${this._createRole}">${i18next.t('button.submit')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.domains = await this._getDomains()
    const priviledges = await this._getPriviledges()
    this.data = {
      records: priviledges,
      total: priviledges.length
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
          type: 'string',
          name: 'category',
          header: i18next.t('field.category'),
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

  async _createRole() {
    try {
      const user = this._getRoleInfo()
      await client.query({
        query: gql`
          mutation {
            createRole(${gqlBuilder.buildArgs({
              role
            })}) {
              id
              domain
              name
              description
              priviledges {
                id
                name
                category
                description
              }
              creatorId
              createdAt
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

  _getRoleInfo() {
    const password = this._getValidPassword()
    if (this.shadowRoot.querySelector('form').checkValidity() && password) {
      return {
        name: this._getInputByName('name').value,
        description: this._getInputByName('description').value,
        priviledges: this._getCheckedPriviledge().map(priviledge => priviledge.id)
      }
    } else {
      throw new Error(i18next.t('text.role_info_not_valid'))
    }
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`input[name=${name}]`)
  }

  _getCheckedPriviledge() {
    const grist = this.shadowRoot.querySelector('data-grist')
    grist.commit()
    return grist.data.records.filter(priviledge => priviledge.checked)
  }
}

window.customElements.define('system-create-role', SystemCreateRole)
