import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import {
  client,
  gqlBuilder,
  isMobileDevice,
  navigate,
  PageView,
  ScrollbarStyles,
  flattenObject
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { WORKSHEET_TYPE } from '../inbound/constants/worksheet'

class OutboundWorksheet extends localize(i18next)(PageView) {
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
      title: i18next.t('title.outbound_worksheet'),
      exportable: {
        name: i18next.t('title.outbound_worksheet'),
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
        name: 'releaseGoodNo',
        label: i18next.t('field.release_good_no'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'releaseGoodRefNo',
        label: i18next.t('field.ref_no'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'bizplaceName',
        label: i18next.t('field.customer'),
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
      list: {
        fields: ['releaseGood|name', 'bizplace|name', 'type', 'releaseGood|refNo', 'status', 'startedAt', 'endedAt']
      },
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
              const type = record.type

              // Handle PICKING
              if (type === WORKSHEET_TYPE.PICKING.value) {
                navigate(`worksheet_picking/${record.name}`)
              } else if (type === WORKSHEET_TYPE.UNLOADING.value) {
                navigate(`worksheet_loading/${record.name}`)
              }
            }
          }
        },
        {
          type: 'string',
          name: 'releaseGood|name',
          header: i18next.t('field.release_good_no'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'releaseGood|refNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'left' },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'bizplace|name',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 240
        },
        {
          type: 'string',
          name: 'type',
          header: i18next.t('field.type'),
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
          width: 100
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
          type: 'string',
          name: 'updater|name',
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
      value: [WORKSHEET_TYPE.PICKING.value]
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
              releaseGood {
                id
                name
                description
                refNo
              }
              bizplace {
                id
                name
                description
              }
              name
              type
              status
              startedAt
              createdAt
              endedAt
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
        records:
          response.data.worksheets.items.map(item => {
            return flattenObject({
              ...item
            })
          }) || {}
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

window.customElements.define('outbound-worksheet', OutboundWorksheet)
