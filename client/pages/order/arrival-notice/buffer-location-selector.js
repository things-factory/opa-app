import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import '@things-factory/import-ui'
import { client } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { LOCATION_TYPE } from '../../constants'

export class BufferLocationSelector extends localize(i18next)(LitElement) {
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

  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      _warehouseName: String
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        @submit=${() => this.warehouseGrist.fetch()}
      ></search-form>

      <div class="grist-container">
        <div class="grist">
          <h2>${i18next.t('title.warehouse')}</h2>
          <data-grist
            id="warehouse"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.warehouseConfig}
            .fetchHandler=${this.fetchWarehouses.bind(this)}
          ></data-grist>
        </div>

        <div class="grist">
          <h2>${i18next.t('title.warehouse_name')}: ${this._warehouseName}</h2>
          <data-grist
            id="location"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.locationConfig}
            .fetchHandler="${this.fetchLocations.bind(this)}"
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
        <button @click=${this._selectLocation.bind(this)}>${i18next.t('button.confirm')}</button>
      </div>
    `
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        label: i18next.t('field.name'),
        type: 'text',
        props: {
          searchOper: 'i_like'
        }
      },
      {
        name: 'description',
        label: i18next.t('field.description'),
        type: 'text',
        props: {
          searchOper: 'i_like'
        }
      }
    ]

    this.warehouseConfig = {
      pagination: { infinite: true },
      rows: {
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            this._warehouseName = record.name
            this._warehouseId = record.id
            this.locationGrist.fetch()
          }
        },
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
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
          name: 'type',
          record: { align: 'center' },
          header: i18next.t('field.type'),
          width: 120
        }
      ]
    }

    this.locationConfig = {
      pagination: { infinite: true },
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
          name: 'row',
          record: { align: 'center' },
          header: i18next.t('field.row'),
          width: 120
        },
        {
          type: 'string',
          name: 'column',
          record: { align: 'center' },
          header: i18next.t('field.column'),
          width: 120
        },
        {
          type: 'string',
          name: 'shelf',
          record: { align: 'center' },
          header: i18next.t('field.shelf'),
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

  get warehouseGrist() {
    return this.shadowRoot.querySelector('data-grist#warehouse')
  }

  get locationGrist() {
    return this.shadowRoot.querySelector('data-grist#location')
  }

  async fetchWarehouses({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          warehouses(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              type
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      return {
        total: response.data.warehouses.total || 0,
        records: response.data.warehouses.items || []
      }
    }
  }

  async fetchLocations({ page, limit, sorters = [] }) {
    if (!this._warehouseId) return

    const response = await client.query({
      query: gql`
        query {
          locations(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'warehouse_id',
                operator: 'eq',
                value: this._warehouseId
              },
              {
                name: 'type',
                operator: 'eq',
                value: LOCATION_TYPE.BUFFER.value
              }
            ],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              row
              column
              shelf
              status
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      return {
        total: response.data.locations.total || 0,
        records: response.data.locations.items || []
      }
    }
  }

  _selectLocation() {
    const selectedLocation = this.locationGrist.selected[0]
    if (selectedLocation) {
      this.dispatchEvent(new CustomEvent('selected', { detail: this.locationGrist.selected[0] }))
      history.back()
    } else {
      document.dispatchEvent(
        new CustomEvent('notify', { detail: { message: i18next.t('text.location_is_not_selected') } })
      )
    }
  }
}

window.customElements.define('buffer-location-selector', BufferLocationSelector)
