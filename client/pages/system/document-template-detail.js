import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class DocumentUploadTemplate extends localize(i18next)(LitElement) {
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
        .input-container {
          display: flex;
        }
        .button-container {
          padding: 10px 0 12px 0;
          text-align: center;
        }
        .button-container > button {
          background-color: var(--button-background-color);
          border: var(--button-border);
          border-radius: var(--button-border-radius);
          margin: var(--button-margin);
          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container > button:hover,
        .button-container > button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  static get properties() {
    return {
      templateTypes: Array
    }
  }

  constructor() {
    super()
    this.templateTypes = []
  }

  render() {
    return html`
      <div>
        <form id="input-form" class="single-column-form">
          <fieldset>
            <legend>${i18next.t('title.template_info')}</legend>
            <label>${i18next.t('label.upload_template')}</label>
            <file-uploader custom-input id="uploadTemplate" name="attachments"></file-uploader>

            <label>${i18next.t('label.category')}</label>
            <select name="category" required>
              <option value="">${i18next.t('label.please_select_template_type')}</option>
              ${(this.templateTypes || []).map(
                templateType =>
                  html`
                    <option value="${templateType && templateType.name}"
                      >${templateType && templateType.name}
                      ${templateType && templateType.description
                        ? ` (${templateType && templateType.description})`
                        : ''}</option
                    >
                  `
              )}
            </select>

            <label>${i18next.t('label.description')}</label>
            <input name="description" />
          </fieldset>
        </form>
      </div>

      <div class="button-container">
        <mwc-button @click="${this._createAttachment}">${i18next.t('button.create')}</mwc-button>
      </div>
    `
  }

  get _template() {
    return this.shadowRoot.querySelector('#uploadTemplate')
  }

  async _createAttachment() {
    try {
      const attachment = this._getAttachmentInfo()
      const response = await client.query({
        query: gql`
          mutation($attachment: NewAttachment!) {
            createAttachment(attachment: $attachment) {
              id
              name
              path
            }
          }
        `,
        variables: {
          attachment
        },
        context: {
          hasUpload: true
        }
      })

      if (!response.errors) {
        history.back()
        this.dispatchEvent(new CustomEvent('template-uploaded', { bubbles: true, composed: true, cancelable: true }))
      }
    } catch (e) {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: e.message
          }
        })
      )
    }
  }

  async firstUpdated() {
    this.templateTypes = await getCodeByName('TEMPLATE_TYPES')
  }

  _getAttachmentInfo() {
    if (this.shadowRoot.querySelector('form').checkValidity()) {
      return {
        file: this._template.files[0],
        category: this._getInputByName('category').value,
        description: this._getInputByName('description').value
      }
    } else {
      throw new Error(i18next.t('text.attachment_info_not_valid'))
    }
  }

  _getInputByName(name) {
    return this.shadowRoot.querySelector(`select[name=${name}], input[name=${name}]`)
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

window.customElements.define('document-upload-template', DocumentUploadTemplate)
