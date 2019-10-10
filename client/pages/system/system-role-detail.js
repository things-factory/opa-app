import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemRoleDetail extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      roleId: String,
      name: String,
      roleInfo: Object,
      priviledgeConfig: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          padding: 0 15px;
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
        <h2>${i18next.t('title.role')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.name')}</label>
            <input name="name" required />

            <label>${i18next.t('label.description')}</label>
            <input name="description" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.priviledge')}</h2>
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config="${this.priviledgeConfig}"
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._saveRoleInfo}">${i18next.t('button.update')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.priviledgeConfig = {
      list: { fields: ['assigned', 'description', 'category'] },
      pagination: { infinite: true },
      rows: { appendable: false },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.priviledges'),
          record: {
            editable: false
          },
          width: 200
        },
        {
          type: 'string',
          name: 'category',
          header: i18next.t('field.category'),
          record: {
            editable: false
          },
          width: 200
        },
        {
          type: 'boolean',
          name: 'assigned',
          header: i18next.t('label.assigned'),
          record: {
            editable: true
          },
          width: 100
        }
      ]
    }
  }

  async updated(changedProps) {
    if (changedProps.has('name')) {
      this.roleInfo = await this._fetchRoleInfo()
    }

    if (changedProps.has('roleInfo')) {
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
          rolePriviledges(${gqlBuilder.buildArgs({
            roleId: this.roleId
          })}) {
            id
            name
            category
            description
            assigned
          }
        }
      `
    })

    if (!response.errors) {
      return {
        records: response.data.rolePriviledges || [],
        total: response.data.rolePriviledges.length || 0
      }
    }
  }

  async _fetchRoleInfo() {
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
      const roleInfo = this.roleInfo[input.name]
      input.value =
        roleInfo instanceof Object
          ? `${roleInfo.name} ${roleInfo.description ? `(${roleInfo.description})` : ''}`
          : roleInfo
    })
  }

  async _saveRoleInfo() {
    try {
      const patch = this._getRoleInfo()

      const response = await client.query({
        query: gql`
          mutation {
            updateRole(${gqlBuilder.buildArgs({
              name: this.name,
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

      this.roleInfo = { ...response.data.updateRole }
      this.name = this.roleInfo.name

      this.dispatchEvent(new CustomEvent('role-updated', { bubbles: true, composed: true, cancelable: true }))
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
    if (this.shadowRoot.querySelector('form').checkValidity()) {
      return {
        name: this._getInputByName('name').value,
        description: this._getInputByName('description').value,
        priviledges: this._getCheckedPriviledges()
      }
    } else {
      throw new Error(i18next.t('text.role_info_not_valid'))
    }
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`input[name=${name}]`)
  }

  _getCheckedPriviledges() {
    const grist = this.shadowRoot.querySelector('data-grist')
    grist.commit()
    return grist.data.records
      .filter(priviledge => priviledge.assigned)
      .map(priviledge => {
        return { id: priviledge.id }
      })
  }
}

window.customElements.define('system-role-detail', SystemRoleDetail)
