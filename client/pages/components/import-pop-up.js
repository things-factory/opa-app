import '@material/mwc-button/mwc-button'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import { css, html, LitElement } from 'lit-element'

class ImportPopUp extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      config: Object,
      records: Array
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }

        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .button-container {
          display: flex;
          margin-left: auto;
        }
        .button-container > mwc-button {
          padding: 10px;
        }
      `
    ]
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <h2>${i18next.t('title.import_new_data')}</h2>

      <div class="grist">
        <data-grist .mode=${isMobileDevice() ? 'LIST' : 'GRID'} .config=${this.config}></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click=${this.importHandler}>${i18next.t('button.import')}</mwc-button>
        <mwc-button @click=${e => history.back()}>${i18next.t('button.cancel')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    const extraColumns = []
    for (let key in this.records[0]) {
      const record = this.records[0]
      const type = typeof record[key]
      extraColumns.push({
        type: type === 'number' ? 'float' : type === 'boolean' ? 'boolean' : 'string',
        name: key,
        record: {
          editable: true
        },
        header: key,
        width: 200
      })
    }
    this.config = {
      rows: { selectable: { multiple: true } },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        ...extraColumns
      ]
    }

    this.dataGrist.data = {
      records: this.records,
      total: this.records.length
    }
  }
}

window.customElements.define('import-pop-up', ImportPopUp)
