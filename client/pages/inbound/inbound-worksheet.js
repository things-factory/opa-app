import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, navigate, PageView } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { WORKSHEET_TYPE } from '../constants'

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
    this._bizplaces = [...(await this._fetchBizplaceList())]

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
        name: 'bizplaceId',
        label: i18next.t('field.customer'),
        type: 'select',
        options: [
          { value: '' },
          ...this._bizplaces
            .map(bizplaceList => {
              return {
                name: bizplaceList.name,
                value: bizplaceList.id
              }
            })
            .sort(this._compareValues('name', 'asc'))
        ],
        props: { searchOper: 'eq' }
      },
      {
        name: 'type',
        label: i18next.t('label.type'),
        type: 'select',
        options: [
          { value: '' },
          ..._worksheetTypes.map(type => {
            return { name: i18next.t(`${type.name}`), value: type.value }
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
      },
      {
        label: i18next.t('field.cross_docking'),
        name: 'crossDocking',
        type: 'checkbox',
        props: { searchOper: 'eq' },
        attrs: ['indeterminate']
      }
    ]

    this.config = {
      list: {
        fields: ['arrivalNotice', 'bizplace', 'type', 'arrivalRefNo', 'status', 'startedAt', 'endedAt']
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
          type: 'object',
          name: 'arrivalNotice',
          header: i18next.t('field.arrival_notice'),
          record: { align: 'left' },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'arrivalRefNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'left' },
          sortable: true,
          width: 120
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
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 200
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
          type: 'object',
          name: 'updater',
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
                crossDocking
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
            return {
              ...item,
              arrivalRefNo: item.arrivalNotice.refNo || '',
              crossDocking: item.arrivalNotice.crossDocking
            }
          }) || {}
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

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('inbound-worksheet', InboundWorksheet)
