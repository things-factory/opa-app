import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { WORKSHEET_STATUS, WORKSHEET_TYPE } from './constants/worksheet'

class WorksheetList extends localize(i18next)(PageView) {
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
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        data-grist {
          overflow-y: hidden;
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
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.worksheet'),
      exportable: {
        name: i18next.t('title.worksheet'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: () => {}
      }
    }
  }

  activated(active) {
    if (JSON.parse(active) && this.dataGrist) {
      this.dataGrist.fetch()
    }
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.name') }
      },
      {
        name: 'type',
        type: 'select',
        options: [
          { value: '' },
          ...Object.keys(WORKSHEET_TYPE).map(key => {
            const types = WORKSHEET_TYPE[key]
            return { name: i18next.t(`label.${types.name}`), value: types.value }
          })
        ],
        props: { searchOper: 'eq', placeholder: i18next.t('label.type') }
      },
      {
        name: 'status',
        type: 'select',
        options: [
          { value: '' },
          ...Object.keys(WORKSHEET_STATUS).map(key => {
            const status = WORKSHEET_STATUS[key]
            return { name: i18next.t(`label.${status.name}`), value: status.value }
          })
        ],
        props: { searchOper: 'eq', placeholder: i18next.t('label.status') }
      }
    ]

    this.config = {
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (
                record.id &&
                record.type === WORKSHEET_TYPE.UNLOADING.value &&
                record.status === WORKSHEET_STATUS.DEACTIVATED.value
              ) {
                navigate(`worksheet_unloading/${record.name}`)
              } else if (
                record.id &&
                record.type === WORKSHEET_TYPE.PUTAWAY.value &&
                record.status === WORKSHEET_STATUS.DEACTIVATED.value
              ) {
                navigate(`worksheet_putaway/${record.name}`)
              } else if (
                record.id &&
                record.type === WORKSHEET_TYPE.VAS.value &&
                record.status === WORKSHEET_STATUS.DEACTIVATED.value
              ) {
                navigate(`worksheet_vas/${record.name}`)
              } else if (record.id && record.status === WORKSHEET_STATUS.EXECUTING.value) {
                document.dispatchEvent(
                  new CustomEvent('notify', {
                    detail: { message: 'Showing status of current worksheet' }
                  })
                )
              }
            }
          }
        },
        {
          type: 'object',
          name: 'arrivalNotice',
          header: i18next.t('field.arrival_notice'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.bizplace'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { align: 'left' },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'type',
          header: i18next.t('field.type'),
          record: { align: 'center' },
          sortable: true,
          width: 160
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

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          worksheets(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              arrivalNotice {
                id
                name
                description
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
              endedAt
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      return {
        total: response.data.worksheets.total || 0,
        records: response.data.worksheets.items || []
      }
    }
  }

  _conditionParser() {
    return this.searchForm
      .getFields()
      .filter(field => (field.type !== 'checkbox' && field.value && field.value !== '') || field.type === 'checkbox')
      .map(field => {
        return {
          name: field.name,
          value:
            field.type === 'text'
              ? field.value
              : field.type === 'checkbox'
              ? field.checked
              : field.type === 'number'
              ? parseFloat(field.value)
              : field.value,
          operator: field.getAttribute('searchOper')
        }
      })
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = this.dataGrist.data.records
    }

    return records.map(item => {
      return this._columns
        .filter(column => column.type !== 'gutter')
        .reduce((record, column) => {
          record[column.name] = item[column.name]
          return record
        }, {})
    })
  }
}

window.customElements.define('worksheet-list', WorksheetList)
