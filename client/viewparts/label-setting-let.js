import { LitElement, html, css } from 'lit-element'

import { localize, i18next } from '@things-factory/i18n-base'
import '@things-factory/setting-base'
import { openPopup } from '@things-factory/layout-base'
import './label-selector-popup'

export class LabelSettingLet extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      css`
        div.field {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          max-width: 100%;
          padding: 5px 0;
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

        div.field > div > .name {
        }

        div.field > div > .description {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        label {
          width: 100px;
          text-align: right;
          padding-right: 10px;

          font-size: 1em;
          text-transform: capitalize;
          color: rgba(0, 0, 0, 0.6);
        }

        input {
          flex: auto;
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom-color: #32526a;
          border-bottom-width: 1px;
          height: 30px;
        }

        ::placeholder {
          font-size: 0.8rem;
          text-transform: capitalize;
        }

        button {
          text-transform: uppercase;
        }

        setting-let > form {
          display: grid;
          grid-template-columns: 1fr 1fr;
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

  constructor() {
    super()

    this.locationLabel = {}
    this.palletLabel = {}
  }

  render() {
    return html`
      <setting-let>
        <i18n-msg slot="title" msgid="title.label_setting"></i18n-msg>

        <form slot="content" @submit=${e => this._handleSubmit(e)}>
          <div class="field">
            <label>location</label>
            <div>
              <div class="name">${this.locationLabel.name}</div>
              <span class="description">${this.locationLabel.description}</span>
              <mwc-icon
                @click=${e => {
                  var popup = openPopup(html`
                    <label-selector-popup
                      @label-selected=${e => {
                        var label = e.detail.label
                        this.locationLabel = label
                        popup.close()
                        this.requestUpdate()
                      }}
                    ></label-selector-popup>
                  `)
                }}
              >
                more_horiz
              </mwc-icon>
              <img src=${this.locationLabel.thumbnail} ?hidden="${this.locationLabel.thumbnail ? false : true}" />
            </div>
          </div>
          <div class="field">
            <label>pallet</label>
            <div>
              <div class="name">${this.palletLabel.name}</div>
              <span class="description">${this.palletLabel.description}</span>
              <mwc-icon
                @click=${e => {
                  var popup = openPopup(html`
                    <label-selector-popup
                      @label-selected=${e => {
                        var label = e.detail.label
                        this.palletLabel = label
                        popup.close()
                        this.requestUpdate()
                      }}
                    ></label-selector-popup>
                  `)
                }}
              >
                more_horiz
              </mwc-icon>
              <img src=${this.palletLabel.thumbnail} ?hidden="${this.palletLabel.thumbnail ? false : true}" />
            </div>
          </div>
        </form>
      </setting-let>
    `
  }

  firstUpdated() {
    console.log('first!!!')
  }
}

customElements.define('label-setting-let', LabelSettingLet)
