import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../constants/order'

class CollectionOrderList extends localize(i18next)(PageView) {
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
      actions: [],
      title: i18next.t('title.collection_orders'),
      exportable: {
        name: i18next.t('title.collection_orders'),
        data: this._exportableData.bind(this)
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  pageInitialized() {
    this._searchFields = [
      {
        label: i18next.t('field.co_no'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.ref_no'),
        name: 'refNo',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.collect_from'),
        name: 'from',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.collection_date'),
        name: 'collectionDate',
        type: 'date',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.cargo_type'),
        name: 'cargoType',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.urgency'),
        name: 'urgency',
        type: 'checkbox',
        props: { searchOper: 'eq' },
        attrs: ['indeterminate']
      },
      {
        label: i18next.t('field.loose_item'),
        name: 'looseItem',
        type: 'checkbox',
        props: { searchOper: 'eq' },
        attrs: ['indeterminate']
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'select',
        options: [
          { value: '' },
          ...Object.keys(ORDER_STATUS).map(key => {
            const status = ORDER_STATUS[key]
            return { name: i18next.t(`label.${status.name}`), value: status.value }
          })
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true }, appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const status = record.status
              if (status === ORDER_STATUS.REJECTED.value) {
                navigate(`rejected_collection_order/${record.name}`) // 1. move to rejected detail page
              } else if (status === ORDER_STATUS.EDITING.value) {
                navigate(`edit_collection_order/${record.name}`)
              } else {
                navigate(`collection_order_detail/${record.name}`) // 2. move to order detail page
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.co_no'),
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'from',
          header: i18next.t('field.collect_from'),
          sortable: true,
          width: 250
        },
        {
          type: 'date',
          name: 'collectionDate',
          header: i18next.t('field.collection_date'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'cargoType',
          header: i18next.t('field.cargo_type'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'boolean',
          name: 'urgency',
          header: i18next.t('field.urgency'),
          record: { align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'boolean',
          name: 'looseItem',
          header: i18next.t('field.loose_item'),
          record: { align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'integer',
          name: 'loadWeight',
          header: i18next.t('label.load_weight'),
          record: { align: 'center' },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'center' },
          sortable: true,
          width: 160
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
          collectionOrders(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              from
              telNo
              collectionDate
              status
              refNo
              cargoType
              urgency
              loadWeight
              looseItem
              updatedAt
              updater {
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
      return {
        total: response.data.collectionOrders.total || 0,
        records: response.data.collectionOrders.items || []
      }
    }
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('collection-order-list', CollectionOrderList)
