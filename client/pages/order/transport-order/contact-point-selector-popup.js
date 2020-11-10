import '@things-factory/grist-ui'
import '@things-factory/import-ui'
import '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class ContactPointSelectorPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      _searchFields: Array,
      contactPointConfig: Object,
      data: Object,
      bizplace: Object
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
        @submit=${() => this.contactPointGrist.fetch()}
      ></search-form>

      <div class="grist-container">
        <div class="grist">
          <data-grist
            id="contactPoint"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.contactPointConfig}
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
        <button @click=${this._selectContactPoint.bind(this)}>${i18next.t('button.confirm')}</button>
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
        label: i18next.t('label.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.address'),
        name: 'address',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.email'),
        name: 'email',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.contactPointConfig = {
      rows: {
        selectable: { multiple: false },
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: false },
        {
          type: 'string',
          name: 'id',
          hidden: true
        },
        {
          type: 'string',
          name: 'name',
          record: { align: 'left' },
          header: i18next.t('field.name'),
          width: 180
        },
        {
          type: 'string',
          name: 'email',
          record: { align: 'left' },
          header: i18next.t('field.email'),
          width: 180
        },
        {
          type: 'string',
          name: 'address',
          record: { align: 'left' },
          header: i18next.t('field.address'),
          width: 320
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get contactPointGrist() {
    return this.shadowRoot.querySelector('data-grist#contactPoint')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const filters = this.searchForm.queryFilters
    filters.push({
      name: 'bizplace',
      operator: 'eq',
      value: this.bizplace.id
    })

    const response = await client.query({
      query: gql`
        query {
          contactPoints(${gqlBuilder.buildArgs({
            filters,
            pagination: { page, limit },
            sortings: [{ name: 'name' }]
          })}) {
            items {
              id
              name
              email
              address
            }
            total
          }
        }
      `
    })

    return {
      total: response.data.contactPoints.total || 0,
      records: response.data.contactPoints.items || []
    }
  }

  _selectContactPoint() {
    const selectedCP = this.contactPointGrist.selected[0]
    if (selectedCP) {
      this.dispatchEvent(new CustomEvent('selected', { detail: this.contactPointGrist.selected[0] }))
      history.back()
    } else {
      document.dispatchEvent(
        new CustomEvent('notify', { detail: { message: i18next.t('text.destination_is_not_selected') } })
      )
    }
  }
}

window.customElements.define('contact-point-selector-popup', ContactPointSelectorPopup)
