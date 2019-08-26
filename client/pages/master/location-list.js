import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class LocationList extends localize(i18next)(PageView) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        search-form {
          overflow: visible;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object
    }
  }

  render() {
    return html`
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
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.location'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveLocation.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteLocation.bind(this)
        }
      ]
    }
  }

  activated(active) {
    if (JSON.parse(active) && this.dataGrist) {
      this.dataGrist.fetch()
    }
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.name') }
      },
      {
        name: 'warehouse',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.warehouse') }
      },
      {
        name: 'zone',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.zone') }
      },
      {
        name: 'section',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.section') }
      },
      {
        name: 'unit',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.unit') }
      },
      {
        name: 'shelf',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.shelf') }
      },
      {
        name: 'state',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.state') }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'warehouse',
          header: i18next.t('field.warehouse'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'section',
          header: i18next.t('field.section'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'shelf',
          header: i18next.t('field.shelf'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'state',
          header: i18next.t('field.state'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 80
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
    const response = await client.query({
      query: gql`
        query {
          locations(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              name
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

    this.rawLocationData = response.data.locations.items

    return {
      total: response.data.locations.total || 0,
      records: response.data.locations.items || []
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

  async _saveLocation() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(locations => {
        locations.cuFlag = locations.__dirty__
        delete locations.__dirty__
        return locations
      })

      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleLocation(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
                description
                type
                updatedAt
                updater{
                  id
                  name
                  description
                }
              }
            }
          `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }

  async _deleteLocation() {
    let confirmDelete = confirm('Are you sure?')
    if (confirmDelete) {
      try {
        const selectedLocation = this.rawLocationData.find(
          locationData => locationData.name === this.dataGrist.selected[0].name
        )
        await client.query({
          query: gql`
            mutation {
              deleteLocation(${gqlBuilder.buildArgs({ name: selectedLocation.name })})
            }
          `
        })

        this.dataGrist.fetch()
      } catch (e) {
        this._notify(e.message)
      }
    }
  }
}

window.customElements.define('location-list', LocationList)
