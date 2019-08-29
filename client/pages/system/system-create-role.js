import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemCreateRole extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      bizplaces: Array,
      priviledgeConfig: Object
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

  render() {
    return html`
      <div>
        <h2>${i18next.t('title.create_role')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.bizplace')}</label>
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
          .config="${this.priviledgeConfig}"
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._createRole}">${i18next.t('button.submit')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.bizplaces = await this._fetchBizplaces()

    this.priviledgeConfig = {
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
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
          priviledges(${gqlBuilder.buildArgs({
            filters: [],
            pagination: { page, limit },
            sortings: sorters
          })}) {
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

    if (!response.errors) {
      return {
        records: response.data.priviledges.items || [],
        total: response.data.priviledges.total || 0
      }
    }
  }

  async _createRole() {
    try {
      const role = this._getRoleInfo()
      const response = await client.query({
        query: gql`
          mutation {
            createRole(${gqlBuilder.buildArgs({
              role
            })}) {
              id
              domain {
                id 
                name
              }
              name
              description
              priviledges {
                id
                name
                category
                description
              }
              creator{
                id
                name
              }
              createdAt
            }
          }
        `
      })

      if (!response.errors) {
        history.back()
        this.dispatchEvent(new CustomEvent('role-created', { bubbles: true, composed: true, cancelable: true }))
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

  _getRoleInfo() {
    if (this.shadowRoot.querySelector('form').checkValidity()) {
      return {
        name: this._getInputByName('name').value,
        domain: { id: this._getInputByName('bizplace').value },
        description: this._getInputByName('description').value,
        priviledges: this._getCheckedPriviledges()
      }
    } else {
      throw new Error(i18next.t('text.role_info_not_valid'))
    }
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`select[name=${name}], input[name=${name}]`)
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

window.customElements.define('system-create-role', SystemCreateRole)
