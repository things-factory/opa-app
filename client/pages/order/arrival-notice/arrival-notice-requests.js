import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../constants/order'
import { getCodeByName } from '@things-factory/code-base'

class ArrivalNoticeRequests extends localize(i18next)(PageView) {
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
      `,
    ]
  }

  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object,
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        @submit=${(e) => this.dataGrist.fetch()}
      ></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.arrival_notice_requests'),
      exportable: {
        name: i18next.t('title.arrival_notice_requests'),
        data: this._exportableData.bind(this),
      },
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async pageInitialized() {
    const _orderStatus = await getCodeByName('GAN_REQUESTS_STATUS')
    const _userBizplaces = await this.fetchBizplaces()

    this._searchFields = [
      {
        label: i18next.t('field.gan'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' },
      },
      {
        label: i18next.t('field.customer'),
        name: 'bizplaceId',
        type: 'select',
        options: [
          { value: '' },
          ..._userBizplaces
            .filter((userBizplaces) => !userBizplaces.mainBizplace)
            .map((userBizplace) => {
              return {
                name: userBizplace.name,
                value: userBizplace.id,
              }
            })
            .sort(this._compareValues('name', 'asc')),
        ],
        props: { searchOper: 'eq' },
      },
      {
        label: i18next.t('field.eta'),
        name: 'etaDate',
        type: 'date',
        props: { searchOper: 'eq' },
      },
      {
        label: i18next.t('field.ref_no'),
        name: 'refNo',
        type: 'text',
        props: { searchOper: 'i_like' },
      },
      {
        label: i18next.t('field.import_cargo'),
        name: 'importCargo',
        type: 'checkbox',
        props: { searchOper: 'eq' },
        attrs: ['indeterminate'],
      },
      {
        label: i18next.t('field.own_transport'),
        name: 'ownTransport',
        type: 'checkbox',
        props: { searchOper: 'eq' },
        attrs: ['indeterminate'],
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'select',
        options: [
          { value: '' },
          ..._orderStatus.map((status) => {
            return { name: i18next.t(`label.${status.description}`), value: status.name }
          }),
        ],
        props: { searchOper: 'eq' },
      },
    ]

    this.config = {
      rows: { appendable: false, selectable: { multiple: true } },
      list: {
        fields: ['bizplace', 'status', 'updatedAt'],
      },
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
                navigate(`receive_arrival_notice/${record.name}`) // 1. move to order receiving page
              } else if (status === ORDER_STATUS.INTRANSIT.value) {
                navigate(`check_arrived_notice/${record.name}`) // 2. move to order arriving check page
              } else if (status === ORDER_STATUS.ARRIVED.value) {
                navigate(`assign_buffer_location/${record.name}`) // 3. move to assign buffer location
              } else {
                navigate(`arrival_notice_detail/${record.name}`)
              }
            },
          },
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.gan'),
          record: { align: 'left' },
          sortable: true,
          width: 160,
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 250,
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'left' },
          sortable: true,
          width: 120,
        },
        {
          type: 'date',
          name: 'etaDate',
          header: i18next.t('field.eta'),
          record: { align: 'center' },
          sortable: true,
          width: 100,
        },
        {
          type: 'boolean',
          name: 'importCargo',
          header: i18next.t('field.import_cargo'),
          record: { align: 'center' },
          sortable: true,
          width: 120,
        },
        {
          type: 'boolean',
          name: 'ownTransport',
          header: i18next.t('field.own_transport'),
          record: { align: 'center' },
          sortable: true,
          width: 120,
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'left' },
          sortable: true,
          width: 120,
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'center' },
          sortable: true,
          width: 160,
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'left' },
          sortable: true,
          width: 200,
        },
      ],
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
          arrivalNoticeRequests(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
            pagination: { page, limit },
            sortings: sorters,
          })}) {
            items {
              id
              bizplace {
                name
                description
              }
              name
              etaDate
              refNo
              status
              ownTransport
              importCargo
              updatedAt
              updater {
                name
                description
              }
            }
            total
          }
        }
      `,
    })

    if (!response.errors) {
      return {
        total: response.data.arrivalNoticeRequests.total || 0,
        records: response.data.arrivalNoticeRequests.items || [],
      }
    }
  }

  async fetchBizplaces(bizplace = []) {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: [...bizplace],
            })}) {
              items{
                id
                name
                description
              }
            }
          }
        `,
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

window.customElements.define('arrival-notice-requests', ArrivalNoticeRequests)
