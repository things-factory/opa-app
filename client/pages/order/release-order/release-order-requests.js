import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../constants/order'

class ReleaseOrderRequests extends localize(i18next)(PageView) {
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

        data-grist {
          overflow-y: auto;
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

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.release_order_requests'),
      exportable: {
        name: i18next.t('title.release_order_requests'),
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
        label: i18next.t('field.release_order_no'),
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
        label: i18next.t('field.customer'),
        name: 'bizplace',
        type: 'object',
        queryName: 'bizplaces',
        field: 'name'
      },
      {
        label: i18next.t('field.release_date'),
        name: 'releaseDate',
        type: 'date',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.import_cargo'),
        name: 'importCargo',
        type: 'checkbox',
        props: { searchOper: 'eq' },
        attrs: ['indeterminate']
      },
      {
        label: i18next.t('field.shipping_option'),
        name: 'exportOption',
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
          { name: i18next.t(`label.${ORDER_STATUS.PENDING_RECEIVE.name}`), value: ORDER_STATUS.PENDING_RECEIVE.value },
          {
            name: i18next.t(`label.${ORDER_STATUS.READY_TO_PICK.name}`),
            value: ORDER_STATUS.READY_TO_DISPATCH.value
          },
          { name: i18next.t(`label.${ORDER_STATUS.INPROCESS.name}`), value: ORDER_STATUS.INPROCESS.value },
          { name: i18next.t(`label.${ORDER_STATUS.DISPATCHING.name}`), value: ORDER_STATUS.DISPATCHING.value },
          { name: i18next.t(`label.${ORDER_STATUS.DONE.name}`), value: ORDER_STATUS.DONE.value }
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true }, appendable: false },
      list: { fields: ['name', 'bizplace', 'releaseDate', 'status', 'updatedAt'] },
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
              if (status === ORDER_STATUS.PENDING_RECEIVE.value) {
                navigate(`receive_release_order_request/${record.name}`) // 1. move to order receiving page
              } else {
                navigate(`release_order_detail/${record.name}`)
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.release_good_no'),
          record: { align: 'center' },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.refNo'),
          record: { align: 'center' },
          sortable: true,
          width: 180
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'date',
          name: 'releaseDate',
          header: i18next.t('field.release_date'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'boolean',
          name: 'ownTransport',
          header: i18next.t('field.own_transport'),
          record: { align: 'center' },
          sortable: true,
          width: 100
        },
        {
          type: 'boolean',
          name: 'exportOption',
          header: i18next.t('field.export_option'),
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
          releaseGoodRequests(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              bizplace {
                id
                name
                description
              }
              name
              releaseDate
              status
              ownTransport
              exportOption
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
        total: response.data.releaseGoodRequests.total || 0,
        records: response.data.releaseGoodRequests.items || []
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

window.customElements.define('release-order-requests', ReleaseOrderRequests)
