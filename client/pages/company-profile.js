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
          <label>${i18next.t('label.company_name')}</label>
          <input name="company_name" />

          <label>${i18next.t('label.company_name')}</label>
          <input name="default_delivery" />

          <label>${i18next.t('label.company_name')}</label>
          <input name="default_contact_no" />
        </form>
      </div>

      <div>
        <label>${i18next.t('title.contact_point')}</label>

        <form>
          <label>${i18next.t('label.name')}</label>
          <input name="name" />

          <label>${i18next.t('label.email')}</label>
          <input name="email" />

          <label>${i18next.t('label.phone_no')}</label>
          <input name="phone_no" />
        </form>
      </div>
    `
  }
}

window.customElements.define('company-profile', CompanyProfile)
