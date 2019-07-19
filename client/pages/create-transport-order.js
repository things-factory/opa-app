∏import { i18next, localize } from '@things-factory/i18n-base'
import { PageView } from '@things-factory/shell'
import { html, css } from 'lit-element'

class CreateTransportOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {}
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
      }
      .form-container {
        flex: 1;
      }
      .button-container {
        display: flex;
        margin-left: auto;
      }
    `
  }

  get context() {
    return {
      title: i18next.t('title.create-shipping-notice')
    }
  }

  render() {
    return html`
      <div class="form-container">
        <label>${i18next.t('title.transport_order')}</label>

        <form>
          <input name="customer-company" />
          <input name="contact-point" />
          <input name="delivery-date" />
          <input name="contact-number" />
          <input name="delievery-address" />
          <input name="fleet-spec" />
        </form>
      </div>

      <div class="button-container">
        <mwc-button>${i18next.t('button.save')}</mwc-button>
      </div>
    `
  }
}

window.customElements.define('create-transport-order', CreateTransportOrder)
