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
      description: Object,
      assigned: Boolean,
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
          flex: 1;
          overflow-y: auto;
        }
        .grist-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
        h2 {
          margin: var(--subtitle-margin);
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .button-container {
          padding: var(--button-container-padding);
          margin: var(--button-container-margin);
          text-align: var(--button-container-align);
          background-color: var(--button-container-background);
          height: var(--button-container-height);
        }
        .button-container button {
          background-color: var(--button-container-button-background-color);
          border-radius: var(--button-container-button-border-radius);
          height: var(--button-container-button-height);
          border: var(--button-container-button-border);
          margin: var(--button-container-button-margin);

          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container button:hover,
        .button-container button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  get priviledgeGrist() {
    return this.shadowRoot.querySelector('data-grist#priviledge-grist')
  }

  get partnerGrist() {
    return this.shadowRoot.querySelector('data-grist#partner-grist')
  }

  render() {
    return html`
      <div>
        <h2>${i18next.t('title.role')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.name')}</label>
            <input name="name" readonly value="${this.name}" />

            <label>${i18next.t('label.description')}</label>
            <input name="description" readonly value="${this.description}" />

            <input type="checkbox" ?checked="${this.assigned}" />
            <label>${i18next.t('label.assigned')}</label>
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <div class="grist-column">
          <h2>${i18next.t('title.priviledge')}</h2>
          <data-grist
            id="priviledge-grist"
            .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
            .config="${this.priviledgeConfig}"
            .fetchHandler="${this.priviledgeFetchHandler.bind(this)}"
          ></data-grist>
        </div>

        <div class="grist-column">
          <h2>${i18next.t('title.partners')}</h2>
          <data-grist
            id="partner-grist"
            .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
            .config="${this.partnerConfig}"
            .fetchHandler="${this.partnerFetchHandler.bind(this)}"
          ></data-grist>
        </div>
      </div>

      <div class="button-container">
        <button @click="${this.save}">${i18next.t('button.update')}</button>
      </div>
    `
  }

  firstUpdated() {
    this.priviledgeConfig = {
      list: { fields: ['description', 'category', 'assigned'] },
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

    this.partnerConfig = {
      list: { fields: ['partnerBizplace', 'type', 'assigned'] },
      pagination: { infinite: true },
      rows: { appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'partnerBizplace',
          header: i18next.t('field.partner'),
          width: 250
        },
        {
          type: 'string',
          name: 'type',
          header: i18next.t('field.type'),
          record: { editable: false },
          width: 200
        },
        {
          type: 'boolean',
          name: 'assigned',
          header: i18next.t('label.assigned'),
          record: { editable: true },
          width: 100
        }
      ]
    }
  }

  async priviledgeFetchHandler() {
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

  async partnerFetchHandler() {
    const response = await client.query({
      query: gql`
        query {
          bizplaceRoleAssignment(${gqlBuilder.buildArgs({
            role: { id: this.roleId }
          })}) {
            partners {
              partnerBizplace {
                id
                name
                description
              }
              type
              assigned
            }
            assigned
          }
        }
      `
    })

    if (!response.errors) {
      this.assigned = response.data.bizplaceRoleAssignment.assigned
      return {
        records: [...response.data.bizplaceRoleAssignment.partners]
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

    const roleInfo = response.data.role
    this.name = roleInfo.name
    this.description = roleInfo.description
  }

  async save() {
    try {
      await this._saveRolePriviledges()
      await this._savePartnerAssignement()
      this.dispatchEvent(new CustomEvent('role-updated', { bubbles: true, composed: true, cancelable: true }))
    } catch (e) {
      this.showToast(e.message)
    }
  }

  async _saveRolePriviledges() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            updateRolePriviledges($${gqlBuilder.buildArgs({
              id: this.roleId,
              patch: {
                priviledges: this.getCheckedPriviledges()
              }
            })})
          }
        `
      })
    } catch (e) {
      throw e
    }
  }

  async _savePartnerAssignement() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            updateAssignedRole(${gqlBuilder.buildArgs({})})
          }
        `
      })
    } catch (e) {
      throw e
    }
  }

  getCheckedPriviledges() {
    this.priviledgeGrist.dirtyRecords
  }

  showToast(message, level = 'error') {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: { level, message }
      })
    )
  }
}

window.customElements.define('system-role-detail', SystemRoleDetail)
