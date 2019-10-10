import '@material/mwc-button/mwc-button'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import { css, html, LitElement } from 'lit-element'

class ImportPopUp extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      importHandler: Object,
      config: Object,
      _config: Object,
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
        <data-grist .mode=${isMobileDevice() ? 'LIST' : 'GRID'} .config=${this._config}></data-grist>
      </div>

      <div class="button-container">
        <mwc-button
          @click=${() => {
            if (this.importHandler && typeof this.importHandler === 'function') {
              this.importHandler(this.getCurrentRecord())
            }
          }}
          >${i18next.t('button.import')}</mwc-button
        >
        <mwc-button @click=${e => history.back()}>${i18next.t('button.cancel')}</mwc-button>
      </div>
    `
  }

  updated(changedProps) {
    if (changedProps.has('config')) {
      this.config.columns.splice(0, 0, { type: 'gutter', gutterName: 'row-selector', multiple: true })

      this._config = {
        ...this.config,
        pagination: { infinite: true },
        columns: this.config.columns
      }
    }
  }

  async firstUpdated() {
    this.dataGrist.data = {
      records: this.records,
      total: this.records.length
    }
  }

  getCurrentRecord() {
    const grist = this.shadowRoot.querySelector('data-grist')
    grist.commit()
    //patches is array of records

    return grist.selected.map(record => {
      var selectedRecords = {
        ...record,
        cuFlag: '+'
      }

      delete selectedRecords.__seq__
      delete selectedRecords.__dirty__
      delete selectedRecords.__selected__
      delete selectedRecords.__changes__
      delete selectedRecords.__dirtyfields__
      delete selectedRecords.__origin__

      return selectedRecords
    })
  }
}

window.customElements.define('import-pop-up', ImportPopUp)
