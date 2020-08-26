import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../../constants'

class ReleaseOrderList extends localize(i18next)(PageView) {
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
      data: Object,
      _ownTransport: Boolean,
      _exportOption: Boolean
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
      title: i18next.t('title.release_orders'),
      exportable: {
        name: i18next.t('title.release_orders'),
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
        label: i18next.t('field.release_date'),
        name: 'releaseDate',
        type: 'date',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.ref_no'),
        name: 'refNo',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.export_option'),
        name: 'exportOption',
        type: 'checkbox',
        props: { searchOper: 'eq' },
        attrs: ['indeterminate']
      },
      {
        label: i18next.t('field.own_transport'),
        name: 'ownTransport',
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
          { name: i18next.t(`label.${ORDER_STATUS.PENDING.name}`), value: ORDER_STATUS.PENDING.value },
          { name: i18next.t(`label.${ORDER_STATUS.EDITING.name}`), value: ORDER_STATUS.EDITING.value },
          { name: i18next.t(`label.${ORDER_STATUS.CANCELLED.name}`), value: ORDER_STATUS.CANCELLED.value },
          { name: i18next.t(`label.${ORDER_STATUS.PENDING_RECEIVE.name}`), value: ORDER_STATUS.PENDING_RECEIVE.value },
          { name: i18next.t(`label.${ORDER_STATUS.PENDING_CANCEL.name}`), value: ORDER_STATUS.PENDING_CANCEL.value },
          {
            name: i18next.t(`label.${ORDER_STATUS.READY_TO_EXECUTE.name}`),
            value: ORDER_STATUS.READY_TO_EXECUTE.value
          },
          { name: i18next.t(`label.${ORDER_STATUS.EXECUTING.name}`), value: ORDER_STATUS.EXECUTING.value },
          { name: i18next.t(`label.${ORDER_STATUS.DONE.name}`), value: ORDER_STATUS.DONE.value }
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true }, appendable: false },
      list: { fields: ['name', 'releaseDate', 'status', 'updatedAt'] },
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
                navigate(`rejected_release_order/${record.name}`) // 1. move to rejected detail page
              } else {
                navigate(`release_order_detail/${record.name}`)
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.ro'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'date',
          name: 'releaseDate',
          header: i18next.t('field.release_date'),
          record: { align: 'center' },
          sortable: true,
          width: 120
        },
        {
          type: 'boolean',
          name: 'exportOption',
          header: i18next.t('field.export_option'),
          record: { align: 'center' },
          sortable: true,
          width: 60
        },
        {
          type: 'boolean',
          name: 'ownTransport',
          header: i18next.t('field.own_transport'),
          record: { align: 'center' },
          sortable: true,
          width: 60
        },
        {
          type: 'boolean',
          name: 'crossDocking',
          header: i18next.t('field.cross_docking'),
          record: { align: 'center' },
          width: 60
        },

        {
          type: 'object',
          name: 'arrivalNotice',
          header: i18next.t('field.gan'),
          record: { align: 'center' },
          width: 160
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'left' },
          sortable: true,
          width: 120
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
          record: { align: 'left' },
          sortable: true,
          width: 200
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

  get _columns() {
    return this.config.columns
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'createdAt', desc: true }] }) {
    const response = await client.query({
      query: gql`
        query {
          releaseGoods(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              bizplace {
                id
                name
              }
              ownTransport
              crossDocking
              arrivalNotice {
                name
              }
              refNo
              exportOption
              releaseDate
              status
              createdAt
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
      this._ownTransport = response.data.releaseGoods.ownTransport
      this._exportOption = response.data.releaseGoods.exportOption

      return {
        total: response.data.releaseGoods.total || 0,
        records: response.data.releaseGoods.items || []
      }
    }
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('release-order-list', ReleaseOrderList)
