import '@things-factory/grist-ui'
import '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { getColumns } from '@things-factory/resource-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import './system-role-detail'
import './system-create-role'

class SystemRole extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      active: String,
      config: Object,
      data: Object,
      backdrop: Boolean,
      direction: String,
      hovering: String,
      _currentPopupName: String,
      page: Number,
      limit: Number
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
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
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
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.role'),
      actions: [
        {
          title: i18next.t('button.add_role'),
          action: this._createRole.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteRole.bind(this)
        }
      ]
    }
  }

  async firstUpdated() {
    this.config = {
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
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._currentPopupName = openPopup(
                html`
                  <system-role-detail .name="${record.name}" style="width: 90vw; height: 70vh;"></system-role-detail>
                `
              ).name
            }
          }
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'delete',
          handlers: {
            click: async (columns, data, column, record, rowIndex) => {
              if (confirm(i18next.t('text.sure_to_delete'))) {
                await this._deleteRole(record.name)
                this.data = await this.fetchHandler()
              }
            }
          }
        }
      ]
    }
  }

  async activated(active) {
    if (active) {
      const response = await getColumns('Role')
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

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          roles(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
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

    this.rawRoleData = response.data.roles.items

    return {
      total: response.data.roles.total || 0,
      records: response.data.roles.items || []
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

  _createRole() {
    this._currentPopupName = openPopup(
      html`
        <system-create-role style="width: 90vw; height: 70vh;"></system-create-role>
      `
    ).name
  }

  async _deleteRole(name) {
    await client.query({
      query: gql`
        mutation {
          deleteRole(${gqlBuilder.buildArgs({
            name
          })}) {
            id
            name
          }
        }
      `
    })
  }

  async stateChanged(state) {
    if (this.active && this._currentPopupName && !state.layout.viewparts[this._currentPopupName]) {
      this.data = await this.fetchHandler()
      this._currentPopupName = null
    }
  }
}

window.customElements.define('system-role', SystemRole)
