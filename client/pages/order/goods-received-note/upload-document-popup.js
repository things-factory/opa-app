import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class UploadDocumentPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      grnNo: String
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
      <div>
        <form id="input-form" class="single-column-form">
          <fieldset>
            <legend>${i18next.t('title.upload_document')} - ${this.grnNo}</legend>
            <label>${i18next.t('label.upload_grn')}</label>
            <file-uploader custom-input id="uploadDocument" name="attachments"></file-uploader>
          </fieldset>
        </form>
      </div>

      <div class="button-container">
        <button @click="${this._uploadDocument}">${i18next.t('button.upload')}</button>
      </div>
    `
  }

  get _document() {
    return this.shadowRoot.querySelector('#uploadDocument')
  }

  async _uploadDocument() {
    const file = this._document.files[0]
    try {
      const response = await client.query({
        query: gql`
          mutation ($file: Upload!){
            submitGoodsReceivalNote(${gqlBuilder.buildArgs({
              name: this.grnNo
            })}, file:$file) {
              id
              name
              description
            }
          }
        `,
        variables: {
          file
        },
        context: {
          hasUpload: true
        }
      })

      if (!response.errors) {
        this.dispatchEvent(new CustomEvent('document-uploaded'))
        history.back()
      }
    } catch (e) {
      this._showToast(e)
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

window.customElements.define('upload-document-popup', UploadDocumentPopup)
