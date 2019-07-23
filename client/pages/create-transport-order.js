import { i18next, localize } from '@things-factory/i18n-base'
import { PageView } from '@things-factory/shell'
import { css, html } from 'lit-element'

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
          <label>${i18next.t('label.customer_company')}</label>
          <input name="customer_company" />

          <label>${i18next.t('label.contact_point')}</label>
          <input name="contact_point" />

          <label>${i18next.t('label.delivery_date')}</label>
          <input name="delivery_date" />

          <label>${i18next.t('label.contact_number')}</label>
          <input name="contact_number" />

          <label>${i18next.t('label.delievery_address')}</label>
          <input name="delievery_address" />

          <label>${i18next.t('label.fleet_spec')}</label>
          <input name="fleet_spec" />
        </form>
      </div>

      <div class="button-container">
        <mwc-button>${i18next.t('button.save')}</mwc-button>
      </div>
    `
  }
}

window.customElements.define('create-transport-order', CreateTransportOrder)
