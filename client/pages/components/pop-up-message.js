import '@material/mwc-button/mwc-button'
import { html, LitElement } from 'lit-element'

class PopUpMessage extends LitElement {
  static get properties() {
    return {
      icon: String,
      title: String,
      message: String,
      buttons: Array
    }
  }

  render() {
    return html`
      <div id="header">
        <div class="icon">${this.icon}</div>
        <h2 class="title">${this.title}</h2>
      </div>

      <div id="message">
        <slot>${this.message}</slot>
      </div>

      ${[
        ...this.buttons,
        {
          title: i18next.t('button.close'),
          handler: () => {
            history.back()
          }
        }
      ].map(button => {
        return html`
          <mwc-button
            @click="${() => {
              button.handler()
            }}"
            >${button.title}</mwc-button
          >
        `
      })}
    `
  }
}

window.customElements.define('pop-up-message', PopUpMessage)
