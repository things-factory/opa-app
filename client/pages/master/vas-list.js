import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../utils/custom-alert'
import '../components/import-pop-up'

class VasList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      config: Object,
      data: Object,
      importHandler: Object
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

        data-grist {
          overflow-y: auto;
          flex: 1;
        }
      `
    ]
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
      title: i18next.t('title.vas'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveVas.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteVas.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.vas'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
    }
  }

  pageInitialized() {
    this._searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.description'),
        name: 'description',
        type: 'text',
        props: { searchOper: 'i_like' }
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
          imex: { header: i18next.t('field.name'), key: 'name', width: 50, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'left' },
          imex: { header: i18next.t('field.description'), key: 'description', width: 50, type: 'string' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'operationGuideType',
          header: i18next.t('field.operation_guide_type'),
          record: { editable: true, align: 'center' },
          imex: {
            header: i18next.t('field.operation_guide_type'),
            key: 'operationGuideType',
            width: 50,
            type: 'string'
          },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'operationGuide',
          header: i18next.t('field.operation_guide'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.operation_guide'), key: 'operationGuide', width: 50, type: 'string' },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'currency',
          header: i18next.t('field.currency'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.currency'), key: 'currency', width: 50, type: 'string' },
          sortable: true,
          width: 80
        },
        {
          type: 'float',
          name: 'defaultPrice',
          header: i18next.t('field.default_price'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.default_price'), key: 'defaultPrice', width: 50, type: 'float' },
          sortable: true,
          width: 60
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
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

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  _importableData(records) {
    setTimeout(() => {
      openPopup(
        html`
          <import-pop-up
            .records=${records}
            .config=${{
              rows: this.config.rows,
              columns: [...this.config.columns.filter(column => column.imex !== undefined)]
            }}
            .importHandler="${this.importHandler.bind(this)}"
          ></import-pop-up>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.import')
        }
      )
    }, 500)
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          vass(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              defaultPrice
              currency
              operationGuideType
              operationGuide
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
      total: response.data.vass.total || 0,
      records: response.data.vass.items || []
    }
  }

  async importHandler(patches) {
    patches.map(vas => {
      if (vas.defaultPrice) {
        vas.defaultPrice = parseFloat(vas.defaultPrice)
      }
    })
    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleVas(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
    })

    if (!response.errors) {
      history.back()
      this.dataGrist.fetch()
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            message: i18next.t('text.data_imported_successfully')
          }
        })
      )
    }
  }

  async _saveVas() {
    var patches = this.dataGrist.exportPatchList({ flagName: 'cuFlag' })
    if (patches && patches.length) {
      patches.map(vas => {
        if (vas.defaultPrice) {
          vas.defaultPrice = parseFloat(vas.defaultPrice)
        }
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleVas(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.data_updated_successfully')
            }
          })
        )
      }
    }
  }

  async _deleteVas() {
    CustomAlert({
      title: i18next.t('text.are_you_sure'),
      text: i18next.t('text.you_wont_be_able_to_revert_this'),
      type: 'warning',
      confirmButton: { text: i18next.t('button.delete'), color: '#22a6a7' },
      cancelButton: { text: 'cancel', color: '#cfcfcf' },
      callback: async result => {
        if (result.value) {
          const names = this.dataGrist.selected.map(record => record.name)
          if (names && names.length > 0) {
            const response = await client.query({
              query: gql`
              mutation {
                deleteVass(${gqlBuilder.buildArgs({ names })})
              }
            `
            })

            if (!response.errors) {
              this.dataGrist.fetch()
              document.dispatchEvent(
                new CustomEvent('notify', {
                  detail: {
                    message: i18next.t('text.data_deleted_successfully')
                  }
                })
              )
            }
          }
        }
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

    var headerSetting = this.dataGrist._config.columns
      .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
      .map(column => {
        return column.imex
      })

    var data = records.map(item => {
      return {
        id: item.id,
        ...this._columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .reduce((record, column) => {
            record[column.imex.key] = column.imex.key
              .split('.')
              .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
            return record
          }, {})
      }
    })

    return { header: headerSetting, data: data }
  }
}

window.customElements.define('vas-list', VasList)
