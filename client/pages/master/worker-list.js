import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getColumns } from '@things-factory/resource-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class WorkerList extends localize(i18next)(PageView) {
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
      data: Object,
      backdrop: Boolean,
      direction: String,
      hovering: String
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${async () => {
          const { records, total } = await this._getWorkers()
          this.data = {
            records,
            total
          }
        }}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.worker'),
      actions: [
        {
          title: i18next.t('button.add'),
          action: () => {
            console.log('this is save action')
          }
        },
        {
          title: 'save',
          action: () => {
            console.log('this is save action')
          }
        },
        {
          title: 'delete',
          action: () => {
            console.log('this is delete action')
          }
        }
      ]
    }
  }

  async updated(changedProps) {
    if (changedProps.has('bizplaceId')) {
      const { records, total } = await this._getContactPoints()
      this.data = {
        records,
        total
      }
    }
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

    this.config = {
      pagination: {
        infinite: true
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
          icon: 'delete_outline',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._deleteMenu(record.name)
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
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.description'),
          width: 220
        },
        {
          type: 'select',
          name: 'type',
          record: {
            align: 'center',
            editable: true,
            options: await this._getWorkerCodes()
          },
          header: i18next.t('field.type'),
          width: 160
        },
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
          width: 150
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

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async _getWorkers(workerId, workerName) {
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

  async _deleteMenu(menuName) {
    let deleteConfirm = confirm('Are you sure?')
    if (deleteConfirm) {
      await client.query({
        query: gql`
          mutation {
            deleteMenu(${gqlBuilder.buildArgs({
              name: menuName
            })}) {
              name
            }
          }
        `
      })
    }
    this._getGroupMenus()
    this._getScreens()
  }

  _conditionParser() {
    const fields = this.searchForm.getFields()
    const conditionFields = fields.filter(
      field =>
        (field.type !== 'checkbox' && field.value && field.value !== '') ||
        field.type === 'checkbox' ||
        field.type === 'select'
    )
    const conditions = []

    conditionFields.forEach(field => {
      conditions.push({
        name: field.name,
        value:
          field.type === 'text'
            ? field.value
            : field.type === 'select'
            ? field.value
            : field.type === 'checkbox'
            ? field.checked
            : field.value,
        operator: field.getAttribute('searchOper'),
        dataType:
          field.type === 'text'
            ? 'string'
            : field.type === 'select'
            ? 'string'
            : field.type === 'number'
            ? 'float'
            : 'boolean'
      })
    })
    return conditions
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
}

window.customElements.define('worker-list', WorkerList)
