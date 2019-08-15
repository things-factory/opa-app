import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { getColumns } from '@things-factory/resource-base'
import {
  client,
  gqlBuilder,
  isMobileDevice,
  PageView,
  PullToRefreshStyles,
  ScrollbarStyles,
  store
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

class SystemRole extends connect(store)(localize(i18next)(PageView)) {
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

  static get styles() {
    return [
      ScrollbarStyles,
      PullToRefreshStyles,
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

  get context() {
    return {
      title: i18next.t('title.role'),
      actions: [
        {
          title: i18next.t('button.add_role'),
          action: this._addRole.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit="${async () => {
          this.data = await this._getRoles()
        }}"
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

  firstUpdated() {
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
              this._openRoles(record.id, record.name)
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
                this.data = await this._getUsers()
              }
            }
          }
        }
      ]
    }
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
              domain {
                id
                name
                description
              }
              name
              description
              
              updater {
                id
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

    return {
      total: response.data.roles.total || 0,
      records: response.data.roles.items || []
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
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

  _conditionParser() {
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

  _openRoles(roleId, roleName) {
    openPopup(html`
      <system-edit-role style="height: 400px;" .roleId="${roleId}" .roleName="${roleName}"></system-edit-role>
    `)
  }

  async _deleteRole(name) {
    await client.query({
      query: gql`
        mutation {
          deleteUser(${gqlBuilder.buildArgs({
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
      this.data = await this._getUsers()
      this._currentPopupName = null
    }
  }
}

window.customElements.define('system-role', SystemRole)
