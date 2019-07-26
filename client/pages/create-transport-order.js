import { i18next, localize } from '@things-factory/i18n-base'
import { PageView } from '@things-factory/shell'
import { css, html } from 'lit-element'
import { SingleColumnFormStyles } from '../styles'

class CreateTransportOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {}
  }

  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
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
    ]
  }

  get context() {
    return {
      title: i18next.t('title.create_shipping_notice')
    }
  }

  render() {
    return html`
      <div class="form-container">
        <form class="single-column-form">
          <fieldset>
            <legend>${i18next.t('title.information')}</legend>
            <label>${i18next.t('label.customer_company')}</label>
            <input name="customer_company" />

            <label>${i18next.t('label.contact_point')}</label>
            <input name="contact_point" />

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="delivery_date" />

            <label>${i18next.t('label.contact_no')}</label>
            <input name="contact_number" />

            <label>${i18next.t('label.delivery_address')}</label>
            <input name="delivery_address" />

            <label>${i18next.t('label.fleet_spec')}</label>
            <input name="fleet_spec" />
          </fieldset>
        </form>
      </div>

      <div class="button-container">
        <mwc-button>${i18next.t('button.save')}</mwc-button>
      </div>
    `
  }
}

window.customElements.define('create-transport-order', CreateTransportOrder)
