import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, navigate, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { ScrollbarStyles } from '@things-factory/styles'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { WORKSHEET_TYPE } from '../inbound/constants/worksheet'
import { ORDER_TYPES } from '../order/constants/order'

class VasWorksheetList extends localize(i18next)(PageView) {
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
      title: i18next.t('title.vas_worksheets'),
      exportable: {
        name: i18next.t('title.vas_worksheets'),
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
    const _worksheetStatus = await getCodeByName('WORKSHEET_STATUS')

    this._searchFields = [
      {
        name: 'name',
        label: i18next.t('field.name'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'status',
        label: i18next.t('label.status'),
        type: 'select',
        options: [
          { value: '' },
          ..._worksheetStatus.map(status => {
            return { name: i18next.t(`label.${status.description}`), value: status.name }
          })
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      list: { fields: ['vasOrder', 'bizplace', 'status'] },
      rows: { appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (!record.id) return
              const refOrderType = record.arrivalNotice?.name
                ? ORDER_TYPES.ARRIVAL_NOTICE.value
                : record.releaseGood?.name
                ? ORDER_TYPES.RELEASE_OF_GOODS
                : record.vasOrder?.name
                ? ORDER_TYPES.VAS_ORDER.value
                : null

              if (!refOrderType) return

              // Route to worksheet vas if it's pure VAS
              // worksheet-vas component has flow for activating and inventory assignment
              if (refOrderType === ORDER_TYPES.VAS_ORDER.value) {
                navigate(`worksheet_vas/${record.name}`)
              } else {
                // Route to worksheet ref vas if it's not pure VAS
                // worksheet ref vas component doesn't have flow for activating and inventory assignment
                navigate(`worksheet_ref_vas/${record.name}`)
              }
            }
          }
        },
        {
          type: 'string',
          name: 'orderNo',
          header: i18next.t('field.order_no'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'refOrder',
          header: i18next.t('field.order_type'),
          record: { align: 'left' },
          sortable: true,
          width: 200
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
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'datetime',
          name: 'startedAt',
          header: i18next.t('field.started_at'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'datetime',
          name: 'endedAt',
          header: i18next.t('field.ended_at'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'center' },
          sortable: true,
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

  async fetchHandler({ page, limit, sorters = [{ name: 'createdAt', desc: true }] }) {
    const filters = this.searchForm.queryFilters
    filters.push({
      name: 'type',
      operator: 'in',
      value: [WORKSHEET_TYPE.VAS.value]
    })
    const response = await client.query({
      query: gql`
        query {
          worksheets(${gqlBuilder.buildArgs({
            filters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              bizplace {
                id
                name
                description
              }
              arrivalNotice {
                name
              }
              releaseGood {
                name
              }
              vasOrder {
                name
              }
              name
              type
              status
              startedAt
              endedAt
              createdAt
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

    if (!response.errors) {
      return {
        total: response.data.worksheets.total || 0,
        records: (response.data.worksheets.items || []).map(item => {
          return {
            ...item,
            orderNo:
              (item.arrivalNotice && item.arrivalNotice.name) ||
              (item.releaseGood && item.releaseGood.name) ||
              (item.vasOrder && item.vasOrder.name),
            refOrder: this._getRefOrder(item)
          }
        })
      }
    }
  }

  _getRefOrder(order) {
    if (order.arrivalNotice && order.arrivalNotice.name) {
      return i18next.t(`label.${ORDER_TYPES.ARRIVAL_NOTICE.name}`)
    } else if (order.releaseGood && order.releaseGood.name) {
      return i18next.t(`label.${ORDER_TYPES.RELEASE_OF_GOODS.name}`)
    } else if (order.vasOrder && order.vasOrder.name) {
      return i18next.t(`label.${ORDER_TYPES.VAS_ORDER.name}`)
    }
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('vas-worksheet-list', VasWorksheetList)
