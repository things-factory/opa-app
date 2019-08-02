import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, store } from '@things-factory/shell'
import '@things-factory/grist-ui'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

class SystemMenuColumn extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _menuName: String,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        overflow-x: auto;
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
      .button-container {
        margin-left: auto;
      }
    `
  }

  get context() {
    return {
      title: i18next.t('title.system_menu_column'),
      exportable: {
        name: i18next.t('title.system_menu_column'),
        data: this._exportableData.bind(this)
      }
    }
  }

  _exportableData() {
    if (!this.data.records || !(this.data.records instanceof Array) || this.data.records.length == 0) {
      this.data.records = [{}]
    }

    return this.data.records.map(item => {
      return this.config.columns
        .filter(c => c.type !== 'gutter')
        .reduce((record, column) => {
          record[column.term || column.name] = item[column.name]
          delete record.id
          return record
        }, {})
    })
  }

  render() {
    return html`
      <div class="grist">
        <label>${i18next.t('title.group_menu')}</label>

        <data-grist .mode=${isMobileDevice() ? 'LIST' : 'GRID'} .config=${this.config} .data=${this.data}></data-grist>

        <div class="button-container">
          <mwc-button
            @click="${() => {
              this.data = {
                ...this.data,
                records: [
                  ...this.data.records,
                  {
                    name: '',
                    colType: 'string',
                    sortRank: 10,
                    gridRank: 10,
                    colSize: 64,
                    reverseSort: false,
                    uniqRank: 0,
                    searchRank: 10,
                    searchOper: 'eq',
                    term: '',
                    gridWidth: 80,
                    refType: '',
                    refName: '',
                    nullable: false
                  }
                ]
              }
            }}"
            >${i18next.t('button.add')}</mwc-button
          >
        </div>
      </div>
    `
  }

  firstUpdated() {
    this.config = {
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'edit',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const textarea = document.createElement('textarea')
              textarea.style.width = '600px'
              textarea.style.height = '400px'
              delete record.__typename
              this.columnId = record.id
              delete record.id
              textarea.value = JSON.stringify(record, null, 2)
              const isCreate = !record.name
              openPopup(
                html`
                  <div style="background-color: white; display: flex; flex-direction: column; padding: 10px;">
                    ${textarea}
                    <div style="margin-left: auto;">
                      <mwc-button
                        @click="${() => {
                          if (isCreate) {
                            this._createColumn(JSON.parse(textarea.value))
                          } else {
                            this._updateColumn(JSON.parse(textarea.value))
                          }
                        }}"
                        >save</mwc-button
                      >
                    </div>
                  </div>
                `,
                {
                  backdrop: true
                }
              )
            }
          }
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'delete',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._deleteColumn(record.id)
            }
          }
        },
        {
          type: 'string',
          name: 'id',
          header: i18next.t('field.id'),
          record: {
            align: 'left'
          },
          width: 0
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            align: 'left'
          },
          width: 200
        },
        {
          type: 'select',
          name: 'colType',
          header: i18next.t('field.col_type'),
          record: {
            align: 'center',
            options: ['string', 'integer', 'float', 'datetime'],
            editable: true
          },
          width: 100
        },
        {
          type: 'int',
          name: 'sortRank',
          header: i18next.t('field.sort_rank'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'int',
          name: 'gridRank',
          header: i18next.t('field.grid_rank'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'int',
          name: 'colSize',
          header: i18next.t('field.col_size'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'boolean',
          name: 'reverseSort',
          header: i18next.t('field.reverse_sort'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'int',
          name: 'uniqRank',
          header: i18next.t('field.uniq_rank'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'int',
          name: 'searchRank',
          header: i18next.t('field.search_rank'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'select',
          name: 'searchOper',
          header: i18next.t('field.search_oper'),
          record: {
            align: 'center',
            options: ['eq', 'like'],
            editable: true
          },
          width: 80
        },
        {
          type: 'string',
          name: 'term',
          header: i18next.t('field.term'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'int',
          name: 'gridWidth',
          header: i18next.t('field.grid_width'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'select',
          name: 'refType',
          header: i18next.t('field.grid_width'),
          record: {
            align: 'center',
            options: ['Entity', 'Menu'],
            editable: true
          },
          width: 80
        },
        {
          type: 'string',
          name: 'refName',
          header: i18next.t('field.ref_name'),
          record: {
            align: 'left',
            editable: true
          },
          width: 80
        },
        {
          type: 'boolean',
          name: 'nullable',
          header: i18next.t('field.nullable'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        }
      ]
    }
  }

  stateChanged(state) {
    if (JSON.parse(this.active)) {
      this._menuName = state.route.resourceId
    }
  }

  updated(changedProps) {
    if (changedProps.has('_menuName')) {
      this._getMenuColumns()
    }
  }

  async _getMenuColumns() {
    const response = await client.query({
      query: gql`
        query {
          menu(${gqlBuilder.buildArgs({
            name: this._menuName
          })}) {
            columns {
              id
              name
              colType
              sortRank
              gridRank
              colSize
              reverseSort
              uniqRank
              searchRank
              searchOper
              term
              gridWidth
              refType
              refName
              nullable
            }
          }
        }
      `
    })

    this.data = {
      records: response.data.menu.columns.sort((a, b) => a.gridRank - b.gridRank)
    }
  }

  async _createColumn(record) {
    record.menu = this._menuName
    await client.query({
      query: gql`
        mutation {
          createMenuColumn(${gqlBuilder.buildArgs({
            menuColumn: record
          })}) {
            name
          }
        }
      `
    })

    history.back()
    this._getMenuColumns()
  }

  async _updateColumn(record) {
    await client.query({
      query: gql`
        mutation {
          updateMenuColumn(${gqlBuilder.buildArgs({
            id: this.columnId,
            patch: record
          })}) {
            name
          }
        }
      `
    })

    history.back()
    this._getMenuColumns()
  }

  async _deleteColumn(columnId) {
    let deleteConfirm = confirm('Are you sure?')
    if (deleteConfirm) {
      await client.query({
        query: gql`
          mutation {
            deleteMenu(${gqlBuilder.buildArgs({
              id: columnId
            })}) {
              name
            }
          }
        `
      })

      this._getMenuColumns()
    }
  }
}

window.customElements.define('system-menu-column', SystemMenuColumn)
