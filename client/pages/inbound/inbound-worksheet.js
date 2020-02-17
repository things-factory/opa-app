import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice, flattenObject } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { WORKSHEET_TYPE } from './constants/worksheet'

class InboundWorksheet extends localize(i18next)(PageView) {
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
      _email: String,
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
      title: i18next.t('title.inbound_worksheet'),
      exportable: {
        name: i18next.t('title.inbound_worksheet'),
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
    const _worksheetTypes = [
      { name: WORKSHEET_TYPE.UNLOADING.name, value: WORKSHEET_TYPE.UNLOADING.value },
      { name: WORKSHEET_TYPE.PUTAWAY.name, value: WORKSHEET_TYPE.PUTAWAY.value }
    ]
    const _worksheetStatus = await getCodeByName('WORKSHEET_STATUS')

    this._searchFields = [
      {
        name: 'arrivalNoticeNo',
        label: i18next.t('field.arrival_notice'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'arrivalNoticeRefNo',
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
        name: 'type',
        label: i18next.t('label.type'),
        type: 'select',
        options: [
          { value: '' },
          ..._worksheetTypes.map(type => {
            return { name: i18next.t(`label.${type.name}`), value: type.value }
          })
        ],
        props: { searchOper: 'eq' }
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
        fields: ['arrivalNotice|name', 'bizplace|name', 'type', 'arrivalNotice|refNo', 'status', 'startedAt', 'endedAt']
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

              // Handle UNLOADING
              if (type === WORKSHEET_TYPE.UNLOADING.value) {
                navigate(`worksheet_unloading/${record.name}`)

                // Handle PUTAWAY
              } else if (type === WORKSHEET_TYPE.PUTAWAY.value) {
                navigate(`worksheet_putaway/${record.name}`)
                // Handle VAS
              } else if (type === WORKSHEET_TYPE.VAS.value) {
                navigate(`worksheet_vas/${record.name}`)
              }
            }
          }
        },
        {
          type: 'string',
          name: 'arrivalNotice|name',
          header: i18next.t('field.arrival_notice'),
          record: { align: 'left' },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'arrivalNotice|refNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'left' },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'bizplace|name',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 250
        },
        {
          type: 'string',
          name: 'type',
          header: i18next.t('field.type'),
          record: { align: 'left' },
          sortable: true,
          width: 120
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
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'left' },
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
    const filters = this.searchForm.queryFilters
    if (!filters.find(filter => filter.name === 'type')) {
      filters.push({
        name: 'type',
        operator: 'in',
        value: [WORKSHEET_TYPE.UNLOADING.value, WORKSHEET_TYPE.PUTAWAY.value]
      })
    }

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
              arrivalNotice {
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
              type
              status
              createdAt
              startedAt
              endedAt
              updater {
                name
                description
              }
              updatedAt
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

window.customElements.define('inbound-worksheet', InboundWorksheet)
