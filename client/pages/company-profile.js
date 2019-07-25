import { i18next, localize } from '@things-factory/i18n-base'
import { PageView } from '@things-factory/shell'
import { css, html } from 'lit-element'

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
      css``,
      css`
        :host {
          overflow: auto;
        }

        form {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-gap: 12px 5px;
          grid-auto-rows: minmax(24px, auto);
          max-width: var(--form-max-width);
          margin: var(--form-margin);
        }
        fieldset {
          display: contents;
        }
        legend {
          grid-column: span 12;
          text-transform: capitalize;

          padding: var(--legend-padding);
          font: var(--legend-font);
          color: var(--legend-text-color);
          border-bottom: var(--legend-border-bottom);
        }

        fieldset > label {
          grid-column: span 3;
          text-align: right;
          text-transform: capitalize;

          color: var(--label-color);
          font: var(--label-font);
        }

        fieldset > input,
        fieldset > table,
        fieldset > select,
        fieldset > textarea {
          grid-column: span 8;

          border: var(--input-field-border);
          border-radius: var(--input-field-border-radius);
          padding: var(--input-field-padding);
          font: var(--input-field-font);
        }

        fieldset > input[type='checkbox'],
        fieldset > input[type='radio'] {
          justify-self: end;
          align-self: start;
          grid-column: span 3 / auto;
        }

        fieldset > input[type='checkbox'] + label,
        fieldset > input[type='radio'] + label {
          text-align: left;
          grid-column: span 9 / auto;

          font: var(--form-sublabel-font);
          color: var(--form-sublabel-color);
        }

        input:focus {
          outline: none;
          border: 1px solid var(--focus-background-color);
        }

        .profile-brand {
          background: url('../assets/images/brand.png') center center no-repeat;
          width: var(--profile-brand-width);
          height: var(--profile-brand-height);
          margin: var(--profile-brand-padding);
        }

        @media screen and (max-width: 400px) {
          form{
            max-width:90%;
            grid-gap: 5px;
          }
          fieldset > label {
            grid-column: span 12;
            text-align: left;
            align-self: end
          }
          fieldset > input,
          fieldset > table,
          fieldset > select,
          fieldset > textarea {
            grid-column: span 12;
          }
          fieldset > input[type='checkbox'],
          fieldset > input[type='radio'] {
            justify-self: start;
            align-self: center;
            grid-column: span 1 / auto;
          }

          fieldset > input[type='checkbox'] + label,
          fieldset > input[type='radio'] + label {
            grid-column: span 11 / auto;
            align-self: center
          }
      `
    ]
  }

  render() {
    return html`
      <div class="profile-brand"></div>

      <form>
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
