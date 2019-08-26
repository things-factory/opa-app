import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

export class ContactPointList extends localize(i18next)(LitElement) {
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
          display: flex;
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
      bizplaceId: String,
      bizplaceName: String,
      _searchFields: Array,
      config: Object
    }
  }

  render() {
    return html`
      <h2>${i18next.t('title.contact_poinat')} ${this.bizplaceName}</h2>

      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler=${this.fetchHandler.bind(this)}
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click=${this._saveContactPoints}>${i18next.t('button.save')}</mwc-button>
        <mwc-button @click=${this._deleteContactPoints}>${i18next.t('button.delete')}</mwc-button>
      </div>
    `
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.name')
        }
      },
      {
        name: 'email',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.email')
        }
      },
      {
        name: 'fax',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.fax')
        }
      },
      {
        name: 'phone',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.phone')
        }
      },
      {
        name: 'description',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.description')
        }
      }
    ]

    this.config = {
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'dirty'
        },
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: true
        },
        {
          type: 'string',
          name: 'name',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.name'),
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.description'),
          width: 220
        },
        {
          type: 'string',
          name: 'email',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.email'),
          width: 120
        },
        {
          type: 'string',
          name: 'fax',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.fax'),
          width: 120
        },
        {
          type: 'string',
          name: 'phone',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.phone'),
          width: 120
        },
        {
          type: 'object',
          name: 'updater',
          record: {
            align: 'left',
            editable: false
          },
          header: i18next.t('field.updater'),
          width: 150
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: {
            align: 'left'
          },
          header: i18next.t('field.updated_at'),
          width: 150
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
    let filters = []
    if (this.bizplaceId) {
      filters.push({
        name: 'bizplace_id',
        operator: 'eq',
        value: this.bizplaceId
      })
    }

    const response = await client.query({
      query: gql`
        query {
          contactPoints(${gqlBuilder.buildArgs({
            filters: [...filters, ...this._conditionParser()],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              email
              fax
              phone
              description
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
      total: response.data.contactPoints.total || 0,
      records: response.data.contactPoints.items || []
    }
  }

  _conditionParser() {
    return this.searchForm
      .getFields()
      .filter(field => (field.type !== 'checkbox' && field.value && field.value !== '') || field.type === 'checkbox')
      .map(field => {
        return {
          name: field.name,
          value:
            field.type === 'text'
              ? field.value
              : field.type === 'checkbox'
              ? field.checked
              : field.type === 'number'
              ? parseFloat(field.value)
              : field.value,
          operator: field.getAttribute('searchOper')
        }
      })
  }

  async _saveContactPoints() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(contactPoint => {
        contactPoint.cuFlag = contactPoint.__dirty__
        contactPoint.bizplace = { id: this.bizplaceId }
        delete contactPoint.__dirty__
        return contactPoint
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleContactPoint(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }

  async _deleteContactPoints() {
    const names = this.dataGrist.selected.map(record => record.name)
    if (names && names.length > 0) {
      const response = await client.query({
        query: gql`
            mutation {
              deleteContactPoints(${gqlBuilder.buildArgs({ names })})
            }
          `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }
}

window.customElements.define('contact-point-list', ContactPointList)
