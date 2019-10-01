import '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { store, client, gqlBuilder, navigate, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { getRenderer, getEditor } from '@things-factory/grist-ui'
import { fetchBoardSettings } from '../../viewparts/fetch-board-settings'
import { UPDATE_OPA_APP_SETTINGS } from '../../actions/opa-app-settings'

class SystemSetting extends localize(i18next)(PageView) {
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
          overflow-y: auto;
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
      title: i18next.t('title.setting'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveSetting.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteSetting.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.setting'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: () => {}
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  pageInitialized() {
    this._searchFields = [
      {
        name: 'name',
        label: i18next.t('field.name'),
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        name: 'description',
        label: i18next.t('field.description'),
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        name: 'category',
        label: i18next.t('field.category'),
        type: 'text',
        props: { searchOper: 'like' }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'code',
          name: 'category',
          header: i18next.t('field.category'),
          record: { editable: true, align: 'center', codeName: 'SETTING_CATEGORIES' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'value',
          header: i18next.t('field.value'),
          record: {
            editor: function(value, column, record, rowIndex, field) {
              return getEditor(record.category)(value, column, record, rowIndex, field)
            },
            renderer: function(value, column, record, rowIndex, field) {
              return getRenderer(record.category)(value, column, record, rowIndex, field)
            },
            editable: true,
            align: 'left'
          },
          sortable: true,
          width: 180
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'edit',
          handlers: {
            click: function(columns, data, column, record, rowIndex, field) {
              var { category, value } = record

              if (category == 'board' && value) {
                navigate(`board-modeller/${value}`)
              }
            }
          }
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'left' },
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

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          settings(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              category
              value
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
      total: response.data.settings.total || 0,
      records: response.data.settings.items || []
    }
  }

  async _saveSetting() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(setting => {
        let patchField = setting.id ? { id: setting.id } : {}
        const dirtyFields = setting.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.cuFlag = setting.__dirty__

        return patchField
      })

      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleSetting(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this._loadOpaAppSettings()
      }
    }
  }

  async _deleteSetting() {
    const names = this.dataGrist.selected.map(record => record.name)
    if (names && names.length > 0) {
      const response = await client.query({
        query: gql`
            mutation {
              deleteSettings(${gqlBuilder.buildArgs({ names })})
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this._loadOpaAppSettings()
      }
    }
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

  async _loadOpaAppSettings() {
    var settings = await fetchBoardSettings()

    store.dispatch({
      type: UPDATE_OPA_APP_SETTINGS,
      settings: settings.reduce((settings, setting) => {
        settings[setting.name] = setting
        return settings
      }, {})
    })
  }
}

window.customElements.define('system-setting', SystemSetting)
