import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { EventEmitter } from 'events'

class SystemUserBizplacesDetail extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      email: String,
      userInfo: Object,
      config: Object
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

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
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
            <input name="name" readonly />

            <label>${i18next.t('label.description')}</label>
            <input name="description" readonly />

            <label>${i18next.t('label.email')}</label>
            <input name="email" readonly />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.bizplace')}</h2>
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config="${this.config}"
          .fetchHandler="${this.fetchHandler.bind(this)}"
          @record-change="${event => {
            if (event.detail.column.name !== 'mainBizplace') return
            this.dataGrist.data = {
              ...this.dataGrist.data,
              records: this.dataGrist.data.records.map((record, idx) => {
                return {
                  ...record,
                  mainBizplace: event.detail.row === idx
                }
              })
            }
          }}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._saveUserBizplaces}">${i18next.t('button.update')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this.config = {
      pagination: { infinite: true },
      rows: { appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { align: 'left' },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { align: 'left' },
          sortable: true,
          width: 230
        },
        {
          type: 'boolean',
          name: 'assigned',
          header: i18next.t('field.assigned'),
          record: { editable: true },
          width: 80
        },
        {
          type: 'boolean',
          name: 'mainBizplace',
          header: i18next.t('field.main_bizplace'),
          record: { editable: true },
          width: 80
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

  async fetchHandler() {
    const response = await client.query({
      query: gql`
        query {
          userBizplaces(${gqlBuilder.buildArgs({
            email: this.email
          })}) {
            id
            name
            description
            assigned
            mainBizplace
          }
        }
      `
    })

    if (!response.errors) {
      return {
        records: response.data.userBizplaces || [],
        total: response.data.userBizplaces.length || 0
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

  async _saveUserBizplaces() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            updateUserBizplaces(${gqlBuilder.buildArgs({
              email: this.email,
              bizplaceUsers: this._getCheckedBizplaces()
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
        history.back()
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.user_bizplaces_updated')
            }
          })
        )
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

  _getCheckedBizplaces() {
    this.grist.commit()
    return this.grist.data.records
      .filter(item => item.assigned)
      .map(item => {
        return {
          bizplace: { id: item.id },
          mainBizplace: item.mainBizplace
        }
      })
  }
}

window.customElements.define('system-user-bizplaces-detail', SystemUserBizplacesDetail)
