import '@things-factory/form-ui'
import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import './upload-delivery-note'

class DeliveryOrderList extends localize(i18next)(PageView) {
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
      title: i18next.t('title.delivery_orders'),
      exportable: {
        name: i18next.t('title.delivery_orders'),
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
    const _deliveryStatus = await getCodeByName('DELIVERY_STATUS')
    this._bizplaces = [...(await this._fetchBizplaceList())]

    this._searchFields = [
      {
        name: 'name',
        label: i18next.t('field.do_no'),
        type: 'text',
        props: { searchOper: 'eq' }
      },
      {
        name: 'releaseGoodNo',
        label: i18next.t('field.release_good_no'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'bizplaceName',
        label: i18next.t('field.customer'),
        type: 'select',
        options: [
          { value: '' },
          ...this._bizplaces
            .map(bizplaceList => {
              return {
                name: bizplaceList.name,
                value: bizplaceList.name
              }
            })
            .sort(this._compareValues('name', 'asc'))
        ],
        props: { searchOper: 'eq' }
      },
      {
        name: 'status',
        label: i18next.t('label.status'),
        type: 'select',
        options: [
          { value: '' },
          ..._deliveryStatus.map(status => {
            return { name: i18next.t(`label.${status.description}`), value: status.name }
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
          icon: 'post_add',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.id) this._uploadDeliveryNote(record.name, record.id)
            }
          }
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              navigate(`print_delivery_note/${record.name}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.do_no'),
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.attachments[0] && record.attachments[0].path) {
                window.open(`/attachment/${record.attachments[0].path}`)
              }
            }
          },
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
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 250
          width: 200
        },
        {
          type: 'date',
          name: 'deliveryDate',
          header: i18next.t('field.delivery_date'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'boolean',
          name: 'ownCollection',
          header: i18next.t('field.own_collection'),
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

  async fetchHandler({ page, limit, sorters = [{ name: 'createdAt', desc: true }] }) {
    const filters = this.searchForm.queryFilters
    const response = await client.query({
      query: gql`
        query {
          deliveryOrders(${gqlBuilder.buildArgs({
            filters: [...filters, { name: 'status', operator: 'notin', value: ['CANCELLED'] }],
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
              attachments {
                id
                name
                refBy
                path
              }
              to
              deliveryDate
              status
              releaseGood {
                id
                name
                description
                refNo
              }
              ownCollection
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
      return {
        total: response.data.deliveryOrders.total || 0,
        records: response.data.deliveryOrders.items.map(item => {
          return {
            ...item,
            refNo: item.releaseGood.refNo
          }
        })
      }
    }
  }

  async _fetchBizplaceList() {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: []
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

    if (!response.errors) {
      return response.data.bizplaces.items
    }
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

  _uploadDeliveryNote(dnName, dnId) {
    openPopup(
      html`
        <upload-delivery-note
          .dnName="${dnName}"
          .dnId="${dnId}"
          .callback="${this.dataGrist.fetch.bind(this.dataGrist)}"
        ></upload-delivery-note>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.upload_signed_gdn')
      }
    )
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('delivery-order-list', DeliveryOrderList)
