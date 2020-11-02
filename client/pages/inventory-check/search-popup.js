import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@material/mwc-button/mwc-button'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { css, html, LitElement } from 'lit-element'
import gql from 'graphql-tag'

class SearchPopup extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
        }
        .grist {
          background-color: var(--main-section-background-color);
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
      complete: Function
    }
  }

  render() {
    return html`
      <h2>${i18next.t('label.customer')}</h2>
      <search-form id="search-form" .fields=${this._searchFields} @submit=${() => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <data-grist
          .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
          .config="${this.config}"
          .fetchHandler="${this.fetchBizplaces.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click="${this.confirmSelectedCustomer.bind(this)}">${i18next.t('button.confirm')}</button>
        <button @click="${() => history.back()}">${i18next.t('button.cancel')}</button>
      </div>
    `
  }

  firstUpdated() {
    this.config = {
      list: {
        fields: ['name', 'description']
      },
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
          width: 300
        },
        {
          type: 'string',
          name: 'description',
          record: { align: 'left' },
          header: i18next.t('field.description'),
          width: 350
        }
      ]
    }

    this._searchFields = [
      {
        label: i18next.t('label.customer'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async fetchBizplaces({ page, limit, sorters = [] }) {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: [...filters],
              pagination: { page, limit },
              sortings: sorters
            })}) {
              items{
                id
                name
                description
              }
              total
            }
          }
        `
    })

    return {
      total: response.data.bizplaces.total || 0,
      records: response.data.bizplaces.items || []
    }
  }

  async confirmSelectedCustomer() {
    const selectedCustomer = this.dataGrist.selected[0]

    if (selectedCustomer) {
      window.history.back()
      this.complete(selectedCustomer)
    } else {
    }
  }
}

window.customElements.define('search-popup', SearchPopup)
