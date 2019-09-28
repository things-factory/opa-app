import { i18next, localize } from '@things-factory/i18n-base'
import { css, html, LitElement } from 'lit-element'

class PopupNote extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      title: String
    }
  }

  static get styles() {
    return [
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
        }
        .container {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .container > textarea {
          flex: 1;
          resize: none;
          border-color: var(--primary-color);
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

  get remarkTextarea() {
    return this.shadowRoot.querySelector('textarea')
  }

  render() {
    return html`
      <div class="container">
        <h2>${this.title}</h2>
        <textarea></textarea>
      </div>

      <div class="button-container">
        <mwc-button
          @click="${() => {
            this.dispatchEvent(
              new CustomEvent('submit', {
                detail: {
                  value: this.remarkTextarea.value
                }
              })
            )

            history.back()
          }}"
          >${i18next.t('button.confirm')}</mwc-button
        >
      </div>
    `
  }
}

window.customElements.define('popup-note', PopupNote)
