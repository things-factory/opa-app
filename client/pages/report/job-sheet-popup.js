import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class JobSheetPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      containerMtDate: String,
      adviseMtDate: String,
      containerSize: String,
      containerNo: String,
      looseItem: Boolean,
      jobSheetNo: String,
      sumPalletQty: String
    }
  }

  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
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

  render() {
    return html`
      <form id="input-form" name="jobSheet" class="single-column-form">
        <fieldset>
          <legend>${i18next.t('title.job_sheet_info')}</legend>
          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" readonly />

          <label>${i18next.t('label.container_size')}</label>
          <input name="containerSize" type="text" readonly />

          <input id="looseItem" type="checkbox" name="looseItem" ?checked="${this._looseItem}" disabled />
          <label for="looseItem">${i18next.t('label.loose_item')}</label>

          <label>${i18next.t('label.advise_mt_date')}</label>
          <input name="adviseMtDate" type="date" />

          <label>${i18next.t('label.container_return_date')}</label>
          <input name="containerMtDate" type="date" />

          <label>${i18next.t('label.total_pallet_qty')}</label>
          <input name="sumPalletQty" />
        </fieldset>
      </form>

      <div class="button-container">
        <button @click="${this._saveJobSheet}">${i18next.t('button.update')}</button>
      </div>
    `
  }

  firstUpdated() {
    this._fillUpForm(this._jobSheetForm, {
      containerNo: this.containerNo,
      containerMtDate: this.containerMtDate,
      looseItem: this.looseItem,
      adviseMtDate: this.adviseMtDate,
      containerSize: this.containerSize,
      sumPalletQty: this.sumPalletQty
    })
  }

  get _jobSheetForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  async _saveJobSheet() {
    try {
      const response = await client.query({
        query: gql`
          mutation {
            updateJobSheet(${gqlBuilder.buildArgs({
              name: this.jobSheetNo,
              patch: { ...this._getJobSheetInfo() }
            })}) {
              id
              name
              description
            }
          }
        `
      })

      if (!response.errors) {
        window.history.back()
        this._showToast({ message: i18next.t('text.job_sheet_has_been_updated') })
        this.dispatchEvent(new CustomEvent('job-sheet-updated'))
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getJobSheetInfo() {
    if (this.shadowRoot.querySelector('form').checkValidity()) {
      return {
        containerMtDate: this._getInputByName('containerMtDate').value,
        adviseMtDate: this._getInputByName('adviseMtDate').value,
        sumPalletQty: parseInt(this._getInputByName('sumPalletQty').value)
      }
    } else {
      throw new Error(i18next.t('text.job_sheet_info_invalid'))
    }
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`textarea[name=${name}], select[name=${name}], input[name=${name}]`)
  }

  _fillUpForm(form, data) {
    for (let key in data) {
      Array.from(form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          if (data[key] instanceof Object) {
            const objectData = data[key]
            field.value = `${objectData.name} ${objectData.description ? `(${objectData.description})` : ''}`
          } else {
            field.value = data[key]
          }
        }
      })
    }
  }

  _showToast({ type, message }) {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          type,
          message
        }
      })
    )
  }
}

window.customElements.define('job-sheet-popup', JobSheetPopup)
