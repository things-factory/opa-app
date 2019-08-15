import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
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
      limit: Number,
      page: Number,
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
          title: 'delete',
          action: () => {
            this._deleteMenu()
          }
        }
      ]
    }
  }

  constructor() {
    super()
    this.page = 1
    this.limit = 20
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="name"
        @submit=${async () => {
          const { records, total } = await this._getWorkerList()
          this.data = {
            records,
            total
          }
        }}
      ></search-form>

      <div class="grist">
        <data-grist
          id="workers"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          @page-changed=${async e => {
            this.page = e.detail
            this.data = await this._getWorkerList()
          }}
          @record-change="${this._onWorkerChangeHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.name')
        }
      },
      {
        name: 'type',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.type')
        }
      }
    ]
    this.data = { records: [] }

    this.config = {
      pagination: {
        pages: [20, 40, 80, 100]
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
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
        },
        {
          type: 'string',
          name: 'name',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.name'),
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'string',
          name: 'type',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        // {
        //   type: 'select',
        //   name: 'type',
        //   record: {
        //     align: 'center',
        //     editable: true,
        //     options: await this._getWorkerCodes()
        //   },
        //   header: i18next.t('field.type'),
        //   width: 160
        // },
        {
          type: 'object',
          name: 'bizplace',
          record: {
            align: 'center',
            editable: true,
            options: {
              queryName: 'bizplaces',
              basicArgs: {
                filters: [
                  {
                    name: 'name',
                    value: 'o',
                    operator: 'like',
                    dataType: 'string'
                  }
                ]
              }
            }
          },
          header: i18next.t('field.bizplace'),
          width: 200
        },
        {
          type: 'object',
          name: 'updater',
          record: {
            align: 'left',
            editable: false
          },
          header: i18next.t('field.updater'),
          width: (150).buildArgs
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: {
            align: 'left'
          },
          header: i18next.t('field.updated_at'),
          width: 150
        }
      ]
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

  async activated(active) {
    if (active) {
      this.data = await this._getWorkerList()
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async _getWorkerList() {
    const response = await client.query({
      query: gql`
      query {
        workers(${gqlBuilder.buildArgs({
          filters: this._conditionParser()
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

    return {
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
    try {
      const workers = this._getNewWorkers()

      await client.query({
        query: gql`
          mutation {
            createWorker(${gqlBuilder.buildArgs({
              worker: workers[0]
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

      navigate('worker-list')
    } catch (e) {
      this._notify(e.message)
    }
  }

  _getNewWorkers() {
    const workers = this.shadowRoot.querySelector('#workers').dirtyRecords
    if (workers.length === 0) {
      throw new Error(i18next.t('text.list_is_not_completed'))
    } else {
      return workers.map(worker => {
        delete worker.__dirty__
        return worker
      })
    }
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
