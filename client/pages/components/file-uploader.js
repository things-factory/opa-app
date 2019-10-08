import { LitElement, html, css } from 'lit-element'
import { i18next, localize } from '@things-factory/i18n-base'

export class FileUploader extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          border-radius: var(--border-radius);
          text-align: center;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background-color: #f4f7fb;
          padding-bottom: 5px !important;
          font: normal 12px/20px var(--theme-font) !important;
          color: var(--secondary-color);
          text-transform: capitalize;
        }

        :host > * {
          display: block;
          margin: auto;
        }
        :host > mwc-icon {
          color: var(--primary-color);
        }
        input {
          position: relative;
          z-index: 1;
          width: 150px;
          opacity: 0;
          cursor: pointer;
        }

        button {
          position: relative;
          margin-top: -20px !important;
          padding: 3px 20px;
          z-index: 0;
          width: 150px;
          border: none;
          border-radius: var(--border-radius);
          background-color: var(--secondary-color);
          color: #fff;
          font: normal 12px var(--theme-font) !important;
          text-transform: capitalize;
        }

        ul {
          max-width: 500px;
          list-style: none;
          padding: 0;
        }
        li {
          padding: 2px 5px 0px 5px;
          border-bottom: 1px dotted rgba(0, 0, 0, 0.1);
          text-align: left;
        }
        li mwc-icon {
          margin: 2px 0 2px 5px;
          float: right;
          font: normal 15px var(--mdc-icon-font, 'Material Icons');
          cursor: pointer;
        }
        li mwc-icon:hover,
        li mwc-icon:active {
          color: var(--primary-color);
        }
      `
    ]
  }

  render() {
    return html`
      <mwc-icon>post_add</mwc-icon>
      <span>add file or drop files here!</span>
      <input type="file" />
      <button>upload file</button>
      <ul>
        <li>
          - file name.fileformat
          <mwc-icon>delete_outline</mwc-icon>
          <mwc-icon>save_alt</mwc-icon>
        </li>
        <li>
          - file name.fileformat
          <mwc-icon>delete_outline</mwc-icon>
          <mwc-icon>save_alt</mwc-icon>
        </li>
      </ul>
    `
  }
}

customElements.define('file-uploader', FileUploader)
