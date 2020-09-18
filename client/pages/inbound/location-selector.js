import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { LOCATION_TYPE } from '../constants'

export class LocationSelector extends localize(i18next)(LitElement) {
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
          margin-left: auto;
        }
        .button-container > mwc-button {
          padding: 10px;
        }
      `
    ]
  }

  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      warehouseId: String,
      warehouseName: String
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${() => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <h2>${i18next.t('title.location')}: ${this.warehouseName}</h2>
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button
          @click=${() => {
            history.back()
          }}
          >${i18next.t('button.cancel')}</mwc-button
        >
        <mwc-button @click=${this._selectLocation.bind(this)}>${i18next.t('button.confirm')}</mwc-button>
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

    this.config = {
      pagination: { infinite: true },
      rows: {
        selectable: {
          multiple: false
        }
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

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    if (!this.warehouseId) return

    const response = await client.query({
      query: gql`
        query {
          locations(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'warehouse_id',
                operator: 'eq',
                value: this.warehouseId
              },
              {
                name: 'type',
                operator: 'noteq',
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
    const selectedLocation = this.dataGrist.selected[0]
    if (selectedLocation) {
      this.dispatchEvent(new CustomEvent('selected', { detail: this.dataGrist.selected[0] }))
      history.back()
    } else {
      document.dispatchEvent(
        new CustomEvent('notify', { detail: { message: i18next.t('text.location_is_not_selected') } })
      )
    }
  }
}

window.customElements.define('location-selector', LocationSelector)
