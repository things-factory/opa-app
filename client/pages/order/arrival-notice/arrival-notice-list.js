import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../../constants'

class ArrivalNoticeList extends localize(i18next)(PageView) {
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
      title: i18next.t('title.arrival_notices'),
      exportable: {
        name: i18next.t('title.arrival_notices'),
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
    const _orderStatus = await getCodeByName('ORDER_STATUS')
    this._searchFields = [
      {
        label: i18next.t('field.gan'),
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
        label: i18next.t('field.eta'),
        name: 'etaDate',
        type: 'date',
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.import_cargo'),
        name: 'importCargo',
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
          ..._orderStatus.map(status => {
            return {
              name: i18next.t(`label.${status.description}`),
              value: status.name
            }
          })
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      list: { fields: ['name', 'etaDate', 'importCargo', 'ownTransport', 'crossDocking', 'updatedAt', 'updater'] },
      rows: { appendable: false, selectable: { multiple: true } },
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
                navigate(`rejected_arrival_notice/${record.name}`) // 1. move to rejected detail page
              } else {
                navigate(`arrival_notice_detail/${record.name}`)
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.gan'),
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
          width: 150
        },
        {
          type: 'date',
          name: 'etaDate',
          header: i18next.t('field.eta'),
          record: { align: 'center' },
          sortable: true,
          width: 120
        },
        {
          type: 'boolean',
          name: 'importCargo',
          header: i18next.t('field.import_cargo'),
          record: { align: 'center' },
          sortable: true,
          width: 100
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
          name: 'releaseGood',
          header: i18next.t('field.release_good'),
          record: { align: 'center' },
          width: 180
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

  async fetchHandler({ page, limit, sorters = [{ name: 'createdAt', desc: true }] }) {
    const response = await client.query({
      query: gql`
        query {
          arrivalNotices(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              etaDate
              status
              refNo
              ownTransport
              crossDocking
              releaseGood {
                name
              }
              importCargo
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
        total: response.data.arrivalNotices.total || 0,
        records: response.data.arrivalNotices.items || []
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

window.customElements.define('arrival-notice-list', ArrivalNoticeList)
