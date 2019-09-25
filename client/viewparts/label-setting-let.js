import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { connect } from 'pwa-helpers'
import { UPDATE_LABEL_SETTINGS } from '../actions/label-settings'
import { LOCATION_LABEL_SETTING_KEY, PALLET_LABEL_SETTING_KEY } from '../label-setting-constants'
import '@things-factory/board-ui'

export class LabelSettingLet extends connect(store)(localize(i18next)(LitElement)) {
  static get styles() {
    return [
      css`
        div.field {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          max-width: 100%;
          margin-bottom: 20px;
          overflow: hidden;
        }

        div.field > * {
          flex: none;
        }

        div.field > div {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 100%;
        }

        div.field > div > img {
          max-height: 250px;
          max-width: 100%;
        }

        .name {
          color: var(--secondary-color, #394e64);
        }

        .description {
          font-size: 0.7rem;
          opacity: 0.7;
          color: var(--secondary-text-color);
        }

        label {
          width: 80px;
          text-align: right;
          padding-right: 10px;

          font-size: 1em;
          text-transform: capitalize;
          color: #666;
        }

        setting-let > form {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        mwc-icon {
          background-color: var(--secondary-color, #394e64);
          margin: 2px 2px 5px 2px;
          padding: 0 5px;
          color: var(--button-color, #fff);
          border-radius: var(--button-radius, 5px);
          border: var(--button-border, 1px solid transparent);
          font-size: 18px;
        }

        mwc-icon:hover,
        mwc-icon:active {
          background-color: var(--button-active-background-color, #22a6a7);
          border: var(--button-active-border);
        }

        @media screen and (max-width: 460px) {
          setting-let > form {
            display: inline-grid;
            grid-template-columns: 1fr;
          }
        }
      `
    ]
  }

  static get properties() {
    return {
      locationLabel: Object,
      palletLabel: Object
    }
  }

  render() {
    return html`
      <setting-let>
        <i18n-msg slot="title" msgid="title.label_setting"></i18n-msg>

        <form slot="content" @submit=${e => this._handleSubmit(e)}>
          ${[
            {
              title: i18next.t('title.location'),
              label: this.locationLabel,
              key: LOCATION_LABEL_SETTING_KEY
            },
            {
              title: i18next.t('title.pallet'),
              label: this.palletLabel,
              key: PALLET_LABEL_SETTING_KEY
            }
          ].map(
            field => html`
              <div class="field">
                <label>${field.title}</i18n-msg></label>
                <div>
                  <div class="name">${field.label.name}</div>
                  <span class="description">${field.label.description}</span>
                  <mwc-icon @click=${e => this.onClickLabelSelector(field.key)}>
                    more_horiz
                  </mwc-icon>
                  ${
                    field.label.id
                      ? html`
                          <a href=${`/board-modeller/${field.label.id}`}>
                            <img
                              src=${field.label.thumbnail ||
                                'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
                            />
                          </a>
                        `
                      : html``
                  }
                </div>
              </div>
            `
          )}
        </form>
      </setting-let>
    `
  }

  stateChanged(state) {
    this.locationLabel = state.labelSettings.locationLabel || {}
    this.palletLabel = state.labelSettings.palletLabel || {}
  }

  onClickLabelSelector(key) {
    var popup = openPopup(
      html`
        <board-selector
          @board-selected=${async e => {
            var board = e.detail.board

            await this.saveSettings({
              key,
              value: board.id
            })

            store.dispatch({
              type: UPDATE_LABEL_SETTINGS,
              locationLabel: key == LOCATION_LABEL_SETTING_KEY ? board : this.locationLabel,
              palletLabel: key == PALLET_LABEL_SETTING_KEY ? board : this.palletLabel
            })

            popup.close()
            this.requestUpdate()
          }}
        ></board-selector>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.label_setting')
      }
    )
  }

  async saveSettings({ key, value }) {
    if (!(key && value)) return

    client.query({
      query: gql`
      mutation {
        updateSetting(${gqlBuilder.buildArgs({
          name: key,
          patch: {
            value
          }
        })}) {
          name
          value
        }
      }`
    })
  }
}

customElements.define('label-setting-let', LabelSettingLet)
