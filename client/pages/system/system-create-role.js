import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class SystemCreateRole extends localize(i18next)(LitElement) {
  static get properties() {
    return {
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
          flex: 1;
          flex-direction: column;
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
        <h2>${i18next.t('title.create_role')}</h2>
        <form class="multi-column-form">
          <fieldset>
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
        <mwc-button @click="${this._createRole}">${i18next.t('button.create')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.priviledgeConfig = {
      pagination: { infinite: true },
      list: { fields: ['name', 'description', 'assigned'] },
      rows: { appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
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
            editable: false,
            align: 'center'
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

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          priviledges(${gqlBuilder.buildArgs({
            filters: [],
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
              name
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
