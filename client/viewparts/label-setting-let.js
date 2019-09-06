import { LitElement, html, css } from 'lit-element'

import { localize, i18next } from '@things-factory/i18n-base'
import '@things-factory/setting-base'

export class LabelSettingLet extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      css`
        input {
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom-color: #32526a;
          border-bottom-width: 1px;
          width: 100%;
          height: 30px;
        }

        div.field {
          padding-bottom: 10px;
        }

        ::placeholder {
          font-size: 0.8rem;
          text-transform: capitalize;
        }

        button {
          text-transform: uppercase;
        }
      `
    ]
  }

  render() {
    return html`
      <setting-let>
        <i18n-msg slot="title" msgid="title.label_setting"></i18n-msg>

        <form slot="content" @submit=${e => this._handleSubmit(e)}>
          <div class="field">
            <input
              type="text"
              name="location_label"
              placeholder=${i18next.t('field.label_id_for_location')}
              .value=${localStorage.getItem('label_id_for_location')}
              @change=${e => {
                localStorage.setItem('label_id_for_location', e.target.value)
              }}
            />
          </div>
          <div class="field">
            <input
              type="text"
              name="location_label"
              placeholder=${i18next.t('field.label_id_for_pallet')}
              .value=${localStorage.getItem('label_id_for_pallet')}
              @change=${e => {
                localStorage.setItem('label_id_for_pallet', e.target.value)
              }}
            />
          </div>
        </form>
      </setting-let>
    `
  }
}

customElements.define('label-setting-let', LabelSettingLet)
