import '@things-factory/form-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

export class PrintLocationLabel extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      selectedLocations: Array,
      _config: Object,
      _data: Array
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      ScrollbarStyles,
      css`
        :host {
          padding: 0 15px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
        }
        h2 {
          margin: var(--subtitle-margin);
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
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
        <h2>${i18next.t('title.location_label_format')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.label_format')}</label>
            <select name="labelFormat" @change="${e => this._validateForm(e.currentTarget.value)}">
              <option value="">-- ${i18next.t('text.select_label_format')} --</option>
              <option value="withShelf">01-01-01-01 (${i18next.t('text.full_format')})</option>
              <option value="withoutShelf">01-01-01 (${i18next.t('text.partial_format')})</option>
            </select>
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.print_preview')}</h2>
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this._config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click="${this._printLocations.bind(this)}">${i18next.t('button.print')}</button>
      </div>
    `
  }

  async firstUpdated() {
    this._config = {
      pagination: { pages: [0] },
      columns: [
        {
          type: 'string',
          name: 'name',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.name'),
          width: 250
        },
        {
          type: 'string',
          name: 'indicator',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.indicator'),
          width: 250
        }
      ]
    }

    if (this.selectedLocations && this.selectedLocations.length > 0) {
      this._records = []
      this._total = 0
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async fetchHandler() {
    return {
      records: this._records || [],
      total: this._total || 0
    }
  }

  async _validateForm(selectedFormat) {
    var records = []
    var locations = []

    if (this.selectedLocations && this.selectedLocations.length > 0) {
      records = this.selectedLocations
    } else {
      if (this.warehouseId) {
        switch (selectedFormat) {
          case 'withShelf':
            var filters = [
              {
                name: 'warehouse_id',
                operator: 'eq',
                value: this.warehouseId
              },
              {
                name: 'type',
                operator: 'eq',
                value: 'SHELF'
              }
            ]
            records = await this._fetchLocations(filters)
            break

          case 'withoutShelf':
            var filters = [
              {
                name: 'warehouse_id',
                operator: 'eq',
                value: this.warehouseId
              },
              {
                name: 'shelf',
                operator: 'eq',
                value: '01'
              },
              {
                name: 'type',
                operator: 'eq',
                value: 'SHELF'
              }
            ]
            records = await this._fetchLocations(filters)
            break
        }
      }
    }

    switch (selectedFormat) {
      case 'withShelf':
        locations = records.map(location => {
          location.name =
            location.type === 'BUFFER'
              ? `${location.name}`
              : `${location.zone}-${location.row}-${location.column}-${location.shelf}`
          location.indicator = location.type === 'BUFFER' ? location.zone : location.shelf
          return location
        })

        this._records = locations
        this._total = records.length
        break

      case 'withoutShelf':
        locations = records.map(location => {
          location.name =
            location.type === 'BUFFER' ? `${location.name}` : `${location.zone}-${location.row}-${location.column}`
          location.indicator = location.type === 'BUFFER' ? location.zone : location.column
          return location
        })

        this._records = locations
        this._total = locations.length
        break

      default:
        this._records = []
        this._total = 0
    }

    this._config = {
      ...this._config,
      pagination: { pages: [this._total] }
    }

    this.dataGrist.fetch()
    this._selectedFormat = selectedFormat
    selectedFormat = ''
  }

  async _fetchLocations(filters) {
    const sorters = [{ name: 'name', desc: false }]

    if (this.warehouseId) {
      try {
        this.dataGrist.showSpinner()

        const response = await client.query({
          query: gql`
            query {
              locations(${gqlBuilder.buildArgs({
                filters,
                sortings: sorters
              })}) {
                items {
                  id
                  name
                  zone
                  row
                  type
                  column
                  shelf
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

        if (!response.errors) {
          return response.data.locations.items || []
        }
      } catch (e) {
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              level: error,
              message: e
            }
          })
        )
      } finally {
        this.dataGrist.hideSpinner()
      }
    }
  }

  _printLocations() {
    if (this._records && this._records.length > 0) {
      this.dispatchEvent(new CustomEvent('printing', { detail: this._records }))
      history.back()
    } else {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: `${i18next.t('text.there_is_no_item_to_print')}`
          }
        })
      )
    }
  }
}

window.customElements.define('print-location-label', PrintLocationLabel)
