import { LitElement, html, css } from 'lit-element'
import { i18next, localize } from '@things-factory/i18n-base'

export class FileUploader extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          padding: 15px;
        }

        label {
          font: normal 14px var(--theme-font);
          color: var(--secondary-color);
          text-transform: capitalize;
        }
        
        [fileupload-content] {
          text-align: center;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        :host > * {
          display: block;
          margin: auto;
        }
        
        input{
          position:relative;
          z-index:1;
          width:150px;
          opacity:0;
        }
        
        button{
          position:relative;
          margin-top:-20px;
          padding:10px 20px
          z-index:0;
          width:150px;
        }
        
        ul{
          max-width:500px;
        }
        
        ul mwc-icon{
          font:normal 14px var(--mdc-icon-font, "Material Icons");
          float:right
        }
    `
    ]
  }

  render() {
    return html`
      <div fileupload-content>
        <mwc-icon>post_add</mwc-icon>
        <span>add file or drop files here</span>
        <input type="file" />
        <button>upload file</button>
        <ul>
          <li>
            - file name.fileformat
            <mwc-icon>delete_outline</mwc-icon>
            <mwc-icon>save_alt</mwc-icon>
          </li>
        </ul>
      </div>
    `
  }
}

customElements.define('file-uploader', FileUploader)
