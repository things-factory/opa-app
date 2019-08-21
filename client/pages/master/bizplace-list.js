import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getColumns } from '@things-factory/resource-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import { connect } from 'pwa-helpers/connect-mixin'
import gql from 'graphql-tag'
import { openPopup } from '@things-factory/layout-base'
import { css, html } from 'lit-element'
import './contact-point-list'

class BizplaceList extends connect(store)(localize(i18next)(PageView)) {
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
      _companyId: String,
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
      title: i18next.t('title.bizplace'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveBizplaces.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteBizplaces.bind(this)
        }
      ]
    }
  }

  async firstUpdated() {
    const response = await getColumns('Bizplace')
    this._columns = response.menu.columns
    this._searchFields = this._modifySearchFields(this._columns)

    this.config = {
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'dirty'
        },
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: true
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._openContactPoints(record.id, record.name)
            }
          }
        },
        ...this._modifyGridFields(this._columns)
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('_companyId')) {
      this.dataGrist.fetch()
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
    if (!this._companyId) return
    const response = await client.query({
      query: gql`
        query {
          bizplaces(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'company_id',
                operator: 'eq',
                value: this._companyId
              },
              ...this._conditionParser()
            ],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              company {
                name
              }
              name
              description
              address
              postalCode
              status
              latlng
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

    if (!response.errors) {
      return {
        total: response.data.bizplaces.total || 0,
        records: response.data.bizplaces.items || []
      }
    }
  }

  _openContactPoints(bizplaceId, bizplaceName) {
    openPopup(html`
      <contact-point-list
        style="width: 80vw; height: 80vh"
        .bizplaceId="${bizplaceId}"
        .bizplaceName="${bizplaceName}"
      ></contact-point-list>
    `)
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

  async _saveBizplaces() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(bizplace => {
        bizplace.cuFlag = bizplace.__dirty__
        bizplace.company = { id: this._companyId }
        delete bizplace.__dirty__
        return bizplace
      })

      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleBizplace(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }

  async _deleteBizplaces() {
    const names = this.dataGrist.selected.map(record => record.name)
    if (names && names.length > 0) {
      const response = await client.query({
        query: gql`
            mutation {
              deleteBizplaces(${gqlBuilder.buildArgs({ names })})
            }
          `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }

  stateChanged(state) {
    if (this.active) {
      this._companyId = state && state.route && state.route.resourceId
    }
  }
}

window.customElements.define('bizplace-list', BizplaceList)
