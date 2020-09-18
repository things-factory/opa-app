import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import '@things-factory/import-ui'
import { client, CustomAlert, PageView, store } from '@things-factory/shell'
import { connect } from 'pwa-helpers/connect-mixin'
import { css, html } from 'lit-element'
import { getCodeByName } from '@things-factory/code-base'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { REUSABLE_PALLET_LABEL_SETTING_KEY } from '../constants'
import { USBPrinter } from '@things-factory/barcode-base'
import gql from 'graphql-tag'

class PalletList extends connect(store)(localize(i18next)(PageView)) {
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
      title: i18next.t('title.pallets'),
      actions: [
        {
          title: i18next.t('button.print_label'),
          action: this._printPalletLabel.bind(this)
        },
        {
          title: i18next.t('button.save'),
          action: this._savePallet.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deletePallet.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.pallet'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async pageInitialized() {
    const _palletStatus = await getCodeByName('PALLET_STATUS')

    this._searchFields = [
      {
        label: i18next.t('field.ref_no'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'select',
        options: [
          { value: '' },
          ..._palletStatus.map(status => {
            return {
              name: status.name,
              value: status.name
            }
          })
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      list: {
        fields: ['name', 'owner', 'holder', 'status']
      },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.ref_no'),
          imex: { header: i18next.t('field.name'), key: 'name', width: 50, type: 'string' },
          record: {
            editable: true,
            align: 'left'
          },
          sortable: true,
          width: 100
        },
        {
          type: 'object',
          name: 'owner',
          header: i18next.t('field.owner'),
          imex: { header: i18next.t('field.owner'), key: 'owner.name', width: 50, type: 'string' },
          record: {
            editable: true,
            align: 'left',
            options: {
              queryName: 'bizplaces'
            }
          },
          sortable: true,
          width: 250
        },
        {
          type: 'object',
          name: 'holder',
          header: i18next.t('field.holder'),
          imex: { header: i18next.t('field.holder'), key: 'holder.name', width: 50, type: 'string' },
          record: {
            editable: true,
            align: 'left',
            options: {
              queryName: 'bizplaces'
            }
          },
          sortable: true,
          width: 250
        },
        {
          type: 'code',
          name: 'status',
          header: i18next.t('field.status'),
          imex: { header: i18next.t('field.status'), key: 'status', width: 50, type: 'string' },
          record: {
            editable: true,
            align: 'left',
            codeName: 'PALLET_STATUS'
          },
          sortable: true,
          width: 130
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: {
            editable: false,
            align: 'left'
          },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: {
            editable: false,
            align: 'left'
          },
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
          pallets(${gqlBuilder.buildArgs({
            filters: [...this.searchForm.queryFilters],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name              
              owner{
                id
                name
                description
              }
              holder{
                id
                name
                description
              }
              status
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
      total: response.data.pallets.total || 0,
      records: response.data.pallets.items || []
    }
  }

  async importHandler(patches) {
    this.dataGrist.showSpinner()
    const response = await client.query({
      query: gql`
          mutation {
            updateMultiplePallet(${gqlBuilder.buildArgs({
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
    this.dataGrist.hideSpinner()
  }

  async _savePallet() {
    let patches = this.dataGrist.exportPatchList({ flagName: 'cuFlag' })
    if (patches && patches.length) {
      this.dataGrist.showSpinner()
      const response = await client.query({
        query: gql`
          mutation {
            updateMultiplePallet(${gqlBuilder.buildArgs({
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
      this.dataGrist.hideSpinner()
    }
  }

  async _deletePallet() {
    CustomAlert({
      title: i18next.t('text.are_you_sure'),
      text: i18next.t('text.you_wont_be_able_to_revert_this'),
      type: 'warning',
      confirmButton: { text: i18next.t('button.delete'), color: '#22a6a7' },
      cancelButton: { text: 'cancel', color: '#cfcfcf' },
      callback: async result => {
        if (result.value) {
          this.dataGrist.showSpinner()
          const id = this.dataGrist.selected.map(record => record.id)
          if (id && id.length > 0) {
            const response = await client.query({
              query: gql`
              mutation {
                deletePallets(${gqlBuilder.buildArgs({ id })})
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
          this.dataGrist.hideSpinner()
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

  async _printPalletLabel() {
    var labelId = this._palletLabel && this._palletLabel.id
    let items = []

    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      items = this.dataGrist.selected
    }

    if (!labelId) {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: `${i18next.t('text.no_label_setting_was_found')}. ${i18next.t('text.please_check_your_setting')}`
          }
        })
      )
    } else {
      if (items.length <= 0) {
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              level: 'error',
              message: `${i18next.t('text.theres_no_pallet_selected')}`
            }
          })
        )
      }

      for (var item of items) {
        var searchParams = new URLSearchParams()

        /* for pallet record mapping */
        searchParams.append('pallet', item.name)

        try {
          const response = await fetch(`/label-command/${labelId}?${searchParams.toString()}`, {
            method: 'GET'
          })

          if (response.status !== 200) {
            throw `Error: Can't get label command from server (response: ${response.status})`
          }

          var command = await response.text()

          if (!this.printer) {
            this.printer = new USBPrinter()
          }

          await this.printer.connectAndPrint(command)
        } catch (ex) {
          document.dispatchEvent(
            new CustomEvent('notify', {
              detail: {
                level: 'error',
                message: ex,
                ex
              }
            })
          )

          delete this.printer
          break
        }
      }
    }
  }

  stateChanged(state) {
    var palletLabelSetting = state.dashboard[REUSABLE_PALLET_LABEL_SETTING_KEY]
    this._palletLabel = (palletLabelSetting && palletLabelSetting.board) || {}
  }
}

window.customElements.define('pallet-list', PalletList)
