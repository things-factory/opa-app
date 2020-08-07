import { i18next, localize } from '@things-factory/i18n-base'
import { css, html, LitElement } from 'lit-element'

class ImageViewer extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      name: String,
      src: String,
      filePath: String,
      downloadable: Boolean
    }
  }

  static get styles() {
    return [
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
        }
        .container {
          display: flex;
          flex-direction: column;
        }
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .img-container > img {
          max-width: 100%;
          max-height: 100%;
          margin: auto;
          display: flex;
        }
        .button-container {
          display: flex;
        }
        .button-container > a {
          margin-left: auto;
        }
      `
    ]
  }

  constructor() {
    super()
    this.filePath = 'attachment'
    this.downloadable = false
  }

  render() {
    return html`
      <div class="container">
        ${this.name ? html` <h2>${this.name}</h2> ` : ''}
        <div class="img-container">
          <img src="${this._fullPath}" />
        </div>
      </div>

      ${this.downloadable
        ? html`
            <div class="button-container">
              <a href="${this._fullPath}" download="${`${this.name ? this.name : 'image'}.${this._exetention}`}"
                ><mwc-button>${i18next.t('button.download')}</mwc-button>
              </a>
            </div>
          `
        : ''}
    `
  }

  get _fullPath() {
    if (this.src) {
      return this.src.startsWith(location.origin) || this.src.startsWith('http')
        ? this.src
        : `${location.origin}/${this.filePath}/${src}`
    } else {
      return ''
    }
  }

  get _exetention() {
    if (this.src) return this.src.substring(this.src.lastIndexOf('.') + 1)
    return ''
  }
}

window.customElements.define('image-viewer', ImageViewer)
