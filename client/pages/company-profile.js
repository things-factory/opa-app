import { i18next, localize } from '@things-factory/i18n-base'
import { PageView, ScrollbarStyles } from '@things-factory/shell'
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
      ScrollbarStyles,
      css``,
      css`
        :host {
        }
        fieldset {
          border: var(--fieldset-border);
          max-width: var(--fieldset-max-width);
          margin: var(--fieldset-margin);
        }
        fieldset div {
          padding: var(--fieldset-div-padding);
        }
        fieldset legend {
          margin: auto;
          text-transform: capitalize;

          padding: var(--legend-padding);
          font: var(--legend-font);
          color: var(--legend-text-color);
          border-bottom: var(--legend-border-bottom);
        }
        fieldset label {
          display: inline-block;
          width: 30%;
          text-align: right;

          padding: var(--label-padding);
          color: var(--label-color);
          font: var(--label-font);
        }
        fieldset input {
          min-width: 35%;
          min-height: 25px;

          border: var(--input-field-border);
          border-radius: var(--input-field-border-radius);
          padding: var(--input-field-padding);
          font: var(--input-field-font);
        }
        input:focus {
          outline: none;
          border: 1px solid var(--focus-background-color);
        }
      `
    ]
  }

  render() {
    return html`
      <form>
        <fieldset>
          <legend>${i18next.t('title.information')}</legend>
          <div>
            <label>${i18next.t('label.company_name')}</label>
            <input name="company_name" />
          </div>

          <div>
            <label>${i18next.t('label.company_name')}</label>
            <input name="default_delivery" />
          </div>

          <div>
            <label>${i18next.t('label.company_name')}</label>
            <input name="default_contact_no" />
          </div>
        </fieldset>

        <fieldset>
          <legend>${i18next.t('title.contact_point')}</legend>

          <div>
            <label>${i18next.t('label.name')}</label>
            <input name="name" />
          </div>

          <div>
            <label>${i18next.t('label.email')}</label>
            <input name="email" />
          </div>

          <div>
            <label>${i18next.t('label.phone_no')}</label>
            <input name="phone_no" />
          </div>
        </fieldset>
      </form>
    `
  }
}

window.customElements.define('company-profile', CompanyProfile)
