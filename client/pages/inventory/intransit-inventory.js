import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import { connect } from 'pwa-helpers/connect-mixin'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class IntransitInventory extends connect(store)(localize(i18next)(PageView)) {
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
          overflow-y: auto;
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
      _email: String,
      _searchFields: Array,
      config: Object,
      data: Object,
      _palletLabel: Object
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

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
      title: i18next.t('title.intransit_inventory'),
      actions: [],
      exportable: {
        name: i18next.t('title.intransit_inventory'),
        data: this._exportableData.bind(this)
      }
    }
  }

  async pageInitialized() {
    this.config = {
      list: {
        fields: ['palletId', 'product', 'bizplace', 'location']
      },
      rows: {
        selectable: {
          multiple: true
        },
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'warehouse',
          header: i18next.t('field.warehouse'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          record: { align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          sortable: true,
          width: 80
        },

        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        }
      ]
    }

    const _userBizplaces = await this._fetchUserBizplaces()

    this._searchFields = [
      {
        label: i18next.t('field.customer'),
        name: 'bizplace',
        type: 'select',
        options: [
          { value: '' },
          ..._userBizplaces
            .filter(userBizplaces => !userBizplaces.mainBizplace)
            .map(userBizplace => {
              return {
                name: userBizplace.name,
                value: userBizplace.id
              }
            })
        ],
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.product'),
        name: 'product',
        type: 'object',
        queryName: 'products',
        field: 'name'
      },
      {
        label: i18next.t('field.batch_no'),
        name: 'batchId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.pallet_id'),
        name: 'palletId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.warehouse'),
        name: 'warehouse',
        type: 'object',
        queryName: 'warehouses',
        field: 'name'
      },
      {
        label: i18next.t('field.location'),
        name: 'location',
        type: 'object',
        queryName: 'locations',
        field: 'name'
      },
      {
        label: i18next.t('field.zone'),
        name: 'zone',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
        query {
          inventories(${gqlBuilder.buildArgs({
            filters: [...filters, { name: 'status', operator: 'eq', value: 'INTRANSIT' }],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              palletId
              batchId
              bizplace {
                name
                description
              }
              product {
                name
                description
              }
              qty
              warehouse {
                name
                description
              }
              zone
              location {
                name
                description
              }
              updatedAt
              updater {
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
      total: response.data.inventories.total || 0,
      records: response.data.inventories.items || []
    }
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }

  async _fetchUserBizplaces() {
    if (!this._email) return
    const response = await client.query({
      query: gql`
        query {
          userBizplaces(${gqlBuilder.buildArgs({
            email: this._email
          })}) {
            id
            name
            description
            mainBizplace
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.userBizplaces
    }
  }

  stateChanged(state) {
    this._email = state.auth && state.auth.user && state.auth.user.email
  }

  _showToast({ type, message }) {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          type,
          message
        }
      })
    )
  }
}

window.customElements.define('intransit-inventory', IntransitInventory)
