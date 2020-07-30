import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
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

  async pageInitialized() {
    const _orderStatus = await getCodeByName('RO_REQUESTS_STATUS')
    const _userBizplaces = await this.fetchBizplaces()

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
        name: 'bizplaceId',
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
            .sort(this._compareValues('name', 'asc'))
        ],
        props: { searchOper: 'eq' }
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
          ..._orderStatus.map(status => {
            return { name: i18next.t(`label.${status.description}`), value: status.name }
          })
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
              if (status === ORDER_STATUS.PENDING_RECEIVE.value || status === ORDER_STATUS.PENDING_CANCEL.value) {
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
          record: { align: 'left' },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'left' },
          sortable: true,
          width: 160
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 200
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
          name: 'ownTransport',
          header: i18next.t('field.own_transport'),
          record: { align: 'center' },
          sortable: true,
          width: 100
        },
        {
          type: 'boolean',
          name: 'crossDocking',
          header: i18next.t('field.cross_docking'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'object',
          name: 'arrivalNotice',
          header: i18next.t('field.arrival_notice'),
          record: { align: 'center' },
          width: 180
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

  async fetchHandler({ page, limit, sorters = [{ name: 'updatedAt', desc: true }] }) {
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
              refNo
              ownTransport
              crossDocking
              arrivalNotice {
                name
              }
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

  async fetchBizplaces(bizplace = []) {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: [...bizplace]
            })}) {
              items{
                id
                name
                description
              }
            }
          }
        `
    })
    return response.data.bizplaces.items
  }

  _compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0
      }

      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key]
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key]

      let comparison = 0
      if (varA > varB) {
        comparison = 1
      } else if (varA < varB) {
        comparison = -1
      }
      return order === 'desc' ? comparison * -1 : comparison
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
