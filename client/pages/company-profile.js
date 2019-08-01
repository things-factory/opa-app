import { i18next, localize } from '@things-factory/i18n-base'
import { PageView } from '@things-factory/shell'
import { css, html } from 'lit-element'
import { SingleColumnFormStyles } from '@things-factory/form-ui'

class CompanyProfile extends localize(i18next)(PageView) {
  get context() {
    return {
      title: i18next.t('title.company_profile'),
      actions: [
        {
          title: 'reset',
          action: function() {
            alert('reset')
          }
        },
        {
          title: 'submit',
          action: function() {
            alert('submit')
          }
        }
      ]
    }
  }

  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          background-color: var(--main-section-background-color);
        }
        .profile-brand {
          background: url('../assets/images/brand.png') center center no-repeat;
          width: var(--profile-brand-width);
          height: var(--profile-brand-height);
          margin: var(--profile-brand-padding);
        }
      `
    ]
  }

  render() {
    return html`
      <div class="profile-brand"></div>

      <form class="single-column-form">
        <fieldset>
          <legend>${i18next.t('title.information')}</legend>
          <label>${i18next.t('label.company_name')}</label>
          <input name="company_name" />

          <label>${i18next.t('label.company_name')}</label>
          <input name="default_delivery" />

          <label>${i18next.t('label.company_name')}</label>
          <input name="default_contact_no" />
        </fieldset>

        <fieldset>
          <legend>${i18next.t('title.contact_point')}</legend>

          <label>${i18next.t('label.name')}</label>
          <input name="name" />

          <label>${i18next.t('label.email')}</label>
          <input name="email" />
          <input type="checkbox" name="email" checked /> <label>I agree to receive event mail.</label>

          <label>${i18next.t('label.phone_no')}</label>
          <input name="phone_no" />
        </fieldset>
      </form>
    `
  }
}

window.customElements.define('company-profile', CompanyProfile)
