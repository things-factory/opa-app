import { i18next, localize } from '@things-factory/i18n-base'
import { PageView } from '@things-factory/shell'
import { html } from 'lit-element'

class CompanyProfile extends localize(i18next)(PageView) {
  get context() {
    return {
      title: i18next.t('title.company_profile')
    }
  }

  render() {
    return html`
      <div>
        <label>${i18next.t('title.information')}</label>

        <form>
          <input name="company-name" />
          <input name="default-delivery" />
          <input name="default-contact-no" />
        </form>
      </div>

      <div>
        <label>${i18next.t('title.contact_point')}</label>

        <form>
          <input name="name" />
          <input name="email" />
          <input name="phone-no" />
        </form>
      </div>
    `
  }
}

window.customElements.define('company-profile', CompanyProfile)
