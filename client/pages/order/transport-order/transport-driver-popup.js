import '@things-factory/barcode-ui'
import '@things-factory/grist-ui'
import '@things-factory/import-ui'
import '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class TransportDriverPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      _searchFields: Array,
      driverConfig: Object,
      data: Object
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

        search-form {
          overflow: visible;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .grist-container {
          overflow-y: hidden;
          display: flex;
          flex: 1;
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
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        @submit=${() => this.transportDriverGrist.fetch()}
      ></search-form>

      <div class="grist-container">
        <div class="grist">
          <data-grist
            id="transportDriver"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.driverConfig}
            .fetchHandler="${this.fetchHandler.bind(this)}"
          ></data-grist>
        </div>
      </div>

      <div class="button-container">
        <button
          @click=${() => {
            history.back()
          }}
        >
          ${i18next.t('button.cancel')}
        </button>
        <button @click=${this._selectDriver.bind(this)}>${i18next.t('button.confirm')}</button>
      </div>
    `
  }

  Updated(changes) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  firstUpdated() {
    this._searchFields = [
      {
        label: i18next.t('field.driver'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.driver_code'),
        name: 'driverCode',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.driverConfig = {
      rows: {
        selectable: { multiple: false },
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: false },
        {
          type: 'string',
          name: 'name',
          record: { align: 'left' },
          header: i18next.t('field.name'),
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          record: { align: 'left' },
          header: i18next.t('field.description'),
          width: 120
        },
        {
          type: 'string',
          name: 'driverCode',
          record: { align: 'center' },
          header: i18next.t('field.driver_code'),
          width: 100
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get transportDriverGrist() {
    return this.shadowRoot.querySelector('data-grist#transportDriver')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          transportDrivers(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: [{ name: 'name' }]
          })}) {
            items {
              id
              name
              description
              driverCode
            }
            total
          }
        }
      `
    })

    return {
      total: response.data.transportDrivers.total || 0,
      records: response.data.transportDrivers.items || []
    }
  }

  _selectDriver() {
    const selectedDriver = this.transportDriverGrist.selected[0]
    if (selectedDriver) {
      this.dispatchEvent(new CustomEvent('selected', { detail: this.transportDriverGrist.selected[0] }))
      history.back()
    } else {
      document.dispatchEvent(
        new CustomEvent('notify', { detail: { message: i18next.t('text.driver_is_not_selected') } })
      )
    }
  }
}

window.customElements.define('transport-driver-popup', TransportDriverPopup)
