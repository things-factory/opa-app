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

class TransportVehiclesPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      _searchFields: Array,
      vehiclesConfig: Object,
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
        @submit=${() => this.transportVehiclesGrist.fetch()}
      ></search-form>

      <div class="grist-container">
        <div class="grist">
          <h2>${i18next.t('label.lorry_no')}</h2>
          <data-grist
            id="transportVehicles"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.vehiclesConfig}
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
        <button @click=${this._selectVehicle.bind(this)}>${i18next.t('button.confirm')}</button>
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
        label: i18next.t('label.lorry_no'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.size'),
        name: 'size',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.vehiclesConfig = {
      rows: {
        selectable: {
          multiple: false
        },
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
          width: 180
        },
        {
          type: 'string',
          name: 'description',
          record: { align: 'left' },
          header: i18next.t('field.description'),
          width: 220
        },
        {
          type: 'string',
          name: 'size',
          record: { align: 'center' },
          header: i18next.t('field.size'),
          width: 120
        },
        {
          type: 'string',
          name: 'status',
          record: { align: 'center' },
          header: i18next.t('field.status'),
          width: 120
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get transportVehiclesGrist() {
    return this.shadowRoot.querySelector('data-grist#transportVehicles')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          transportVehicles(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: [{ name: 'name' }]
          })}) {
            items {
              id
              name
              regNumber
              description
              size
              status
              updatedAt
              updater{
                id
                name
                description
              }
            }
            total
          }
        }
      `
    })

    return {
      total: response.data.transportVehicles.total || 0,
      records: response.data.transportVehicles.items || []
    }
  }

  _selectVehicle() {
    const selectedVehicle = this.transportVehiclesGrist.selected[0]
    if (selectedVehicle) {
      this.dispatchEvent(new CustomEvent('selected', { detail: this.transportVehiclesGrist.selected[0] }))
      history.back()
    } else {
      document.dispatchEvent(
        new CustomEvent('notify', { detail: { message: i18next.t('text.vehicle_is_not_selected') } })
      )
    }
  }
}

window.customElements.define('transport-vehicles-popup', TransportVehiclesPopup)
