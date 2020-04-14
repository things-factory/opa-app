import { i18next, localize } from '@things-factory/i18n-base'
import { css, html, LitElement } from 'lit-element'

class PopupNote extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      title: String,
      value: String,
      readonly: Boolean
    }
  }

  static get styles() {
    return [
      css`
        :host {
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
          padding: 5px;
          margin: 10px;
          outline: none;
        }
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }
        h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
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

  get textarea() {
    return this.shadowRoot.querySelector('textarea')
  }

  firstUpdated() {
    if (!this.readonly) {
      setTimeout(() => this.textarea.focus(), 100)
    }
  }

  updated(changedProps) {
    if (changedProps.has('value')) {
      this.textarea.value = this.value
    }
  }

  render() {
    return html`
      <div class="container">
        <h2><mwc-icon>list_alt</mwc-icon>${this.title}</h2>
        <textarea ?readonly="${this.readonly}"></textarea>
      </div>

      ${this.readonly
        ? ''
        : html`
            <div class="button-container">
              <button
                @click="${() => {
                  this.dispatchEvent(new CustomEvent('submit', { detail: { value: this.textarea.value } }))
                  history.back()
                }}"
              >
                ${i18next.t('button.confirm')}
              </button>
            </div>
          `}
    `
  }
}

window.customElements.define('popup-note', PopupNote)
