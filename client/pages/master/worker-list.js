import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getColumns } from '@things-factory/resource-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

class WorkerList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      backdrop: Boolean,
      direction: String,
      hovering: String,
      data: Object
    }
  }

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
          overflow-y: hidden;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.worker_list'),
      actions: [
        {
          title: i18next.t('button.submit'),
          action: this.createWorker.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this.deleteWorkerList.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="name"
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          id="workers"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  async firstUpdated() {
    this.config = {
      pagination: {
        pages: [20, 40, 80, 100]
      },
      rows: {
        selectable: {
          multiple: false
        }
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: false
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'search',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._openContactPoints(record.id, record.name)
            }
          }
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'delete_outline',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.data.records.splice(rowIndex, 1)

              this.data = {
                ...this.data,
                records: [...this.data.records]
              }
            }
          }
        }
      ]
    }
  }

  async activated(active) {
    if (active) {
      const response = await getColumns('Worker')
      this._columns = response.menu.columns
      this._searchFields = this._modifySearchFields(this._columns)

      this.config = {
        ...this.config,
        columns: [...this.config.columns, ...this._modifyGridFields(this._columns)]
      }
    }
  }

  _modifySearchFields(columns) {
    return columns
      .filter(field => field.searchRank && field.searchRank > 0)
      .sort((a, b) => a.searchRank - b.searchRank)
      .map(field => {
        return {
          name: field.name,
          type: field.searchEditor ? field.searchEditor : 'text',
          props: {
            min: field.rangeVal ? field.rangeVal.split(',')[0] : null,
            max: field.rangeVal ? field.rangeVal.split(',')[1] : null,
            searchOper: field.searchOper ? field.searchOper : 'eq',
            placeholder: i18next.t(field.term)
          },
          value: field.searchInitVal
        }
      })
  }

  _modifyGridFields(columns) {
    return columns
      .filter(column => column.gridRank && column.gridRank > 0)
      .sort((a, b) => a.gridRank - b.gridRank)
      .map(column => {
        const type = column.refType == 'Entity' || column.refType == 'Menu' ? 'object' : column.colType
        return {
          type,
          name: column.name,
          header: i18next.t(column.term),
          record: {
            editable: column.gridEditor !== 'readonly',
            align: column.gridAlign || 'left'
          },
          sortable: true,
          width: column.gridWidth || 100
        }
      })
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
        workers(${gqlBuilder.buildArgs({
          filters: this._conditionParser(),
          pagination: { page, limit },
          sortings: sorters
        })}) {
          items {
            name
            description
            type
            updatedAt
            updater{
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

    this.rawWorkerData = response.data.workers.items

    return {
      // total: this._parseOrderData(response.data.workers.items),
      total: response.data.workers.total || 0,
      records: response.data.workers.items || []
    }
  }

  _conditionParser() {
    if (!this.searchForm) return []
    const fields = this.searchForm.getFields()
    const conditionFields = fields.filter(
      field => (field.type !== 'checkbox' && field.value && field.value !== '') || field.type === 'checkbox'
    )
    const conditions = []

    conditionFields.forEach(field => {
      conditions.push({
        name: field.name,
        value: field.type === 'text' ? field.value : field.type === 'checkbox' ? field.checked : field.value,
        operator: field.getAttribute('searchOper'),
        dataType: field.type === 'text' ? 'string' : field.type === 'number' ? 'float' : 'boolean'
      })
    })
    return conditions
  }

  async _onWorkerChangeHandler(e) {
    const before = e.detail.before || {}
    const after = e.detail.after
    let record = this.data.records[e.detail.row]
    if (!record) {
      record = { ...after }
      this.data.records.push(record)
    } else if (record !== after) {
      record = Object.assign(record, after)
    }
  }

  async createWorker() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(workers => {
        workers.cuFlag = workers.__dirty__
        delete workers.__dirty__
        return workers
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleWorker(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
              description
              type
              updatedAt
              updater
              {
                id
                name
                description
              }
            }
          }
        
        `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }

  async deleteWorkerList() {
    let confirmDelete = confirm('Are you sure?')
    if (confirmDelete) {
      try {
        const selectedWorker = this.rawWorkerData.find(
          workerData => workerData.name === this.dataGrist.selected[0].name
        )
        await client.query({
          query: gql`
            mutation {
              deleteWorker(${gqlBuilder.buildArgs({ name: selectedWorker.name })}){
                name{
                  true
                }
              }
            }
          `
        })

        this.dataGrist.fetch()
      } catch (e) {
        this._notify(e.message)
      }
    }
  }

  async _getWorkerCodes() {
    const response = await client.query({
      query: gql`
        query {
          commonCode(${gqlBuilder.buildArgs({
            name: 'WORKER_TYPE'
          })}) {
            name
            details {
              name
            }
          }
        }
      `
    })

    return response.data.commonCode.details.map(worker => worker.name)
  }

  _notify(message, level = '') {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          level,
          message
        }
      })
    )
  }
}

window.customElements.define('worker-list', WorkerList)
