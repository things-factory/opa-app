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
    this._bizplaces = [...(await this._fetchBizplaceList())]

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
        fields: ['releaseGood', 'bizplace', 'type', 'releaseRefNo', 'status', 'startedAt', 'endedAt']
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
              } else if (type === WORKSHEET_TYPE.LOADING.value) {
                navigate(`worksheet_loading/${record.name}`)
              } else if (type === WORKSHEET_TYPE.RETURN.value) {
                navigate(`worksheet_return/${record.name}`)
              }
            }
          }
        },
        {
          type: 'object',
          name: 'releaseGood',
          header: i18next.t('field.release_good_no'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'releaseRefNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'left' },
          sortable: true,
          width: 180
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
      value: [WORKSHEET_TYPE.PICKING.value, WORKSHEET_TYPE.LOADING.value, WORKSHEET_TYPE.RETURN.value]
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
                crossDocking
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
            return { ...item, releaseRefNo: item.releaseGood.refNo || '', crossDocking: item.releaseGood.crossDocking }
          }) || {}
      }
    }
  }

  get _columns() {
    return this.config.columns
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

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('outbound-worksheet', OutboundWorksheet)
