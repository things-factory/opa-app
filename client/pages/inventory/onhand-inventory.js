import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { connect } from 'pwa-helpers/connect-mixin'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import { PALLET_LABEL_SETTING_KEY } from '../../setting-constants'
import gql from 'graphql-tag'
import { USBPrinter } from '@things-factory/barcode-base'
import { css, html } from 'lit-element'

class OnhandInventory extends connect(store)(localize(i18next)(PageView)) {
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
      data: Object,
      _palletLabel: Object
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
      title: i18next.t('title.onhand_inventory'),
      actions: [
        {
          title: i18next.t('button.pallet_label_print'),
          action: this._printPalletLabel.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.onhand_inventory'),
        data: this._exportableData.bind(this)
      }
    }
  }

  pageInitialized() {
    this.config = {
      list: {
        fields: ['palletId', 'product', 'bizplace', 'location']
      },
      rows: {
        selectable: {
          mulitple: true
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'warehouse',
          header: i18next.t('field.warehouse'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'zone',
          header: i18next.t('field.zone'),
          record: { align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'center' },
          sortable: true,
          width: 150
        }
      ]
    }

    this._searchFields = [
      {
        label: i18next.t('field.customer'),
        name: 'bizplaceName',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.warehouse'),
        name: 'warehouseName',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.zone'),
        name: 'zone',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.location'),
        name: 'locationName',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.pallet_id'),
        name: 'palletId',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.batch_id'),
        name: 'batchId',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.product'),
        name: 'productName',
        type: 'text',
        props: { searchOper: 'eq' }
      }
    ]
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    let inventory = {}
    this.searchForm.queryFilters.forEach(filter => {
      inventory[filter.name] = filter.value
    })
    const response = await client.query({
      query: gql`
        query {
          onhandInventories(${gqlBuilder.buildArgs({
            inventory,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              palletId
              batchId
              bizplace {
                name
                description
              }
              product {
                name
                description
              }
              qty
              warehouse {
                name
                description
              }
              zone
              location {
                name
                description
              }
              updatedAt
              updater {
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
      total: response.data.onhandInventories.total || 0,
      records: response.data.onhandInventories.items || []
    }
  }

  get _columns() {
    return this.config.columns
  }

  async _printPalletLabel() {
    const records = this.dataGrist.selected
    var labelId = this._palletLabel && this._palletLabel.id

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
      for (var record of records) {
        var searchParams = new URLSearchParams()

        /* for pallet record mapping */
        searchParams.append('pallet', record.palletId)
        searchParams.append('batch', record.batchId)
        searchParams.append('product', record.product.name)

        try {
          const response = await fetch(`/label-command/${labelId}?${searchParams.toString()}`, {
            method: 'GET'
          })

          if (response.status !== 200) {
            throw `Error : Can't get label command from server (response: ${response.status})`
          }

          var command = await response.text()

          if (!this.printer) {
            this.printer = new USBPrinter()
          }

          await this.printer.connectAndPrint(command)
        } catch (e) {
          this._showToast(e)

          delete this.printer
          break
        }
      }
    }
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

  stateChanged(state) {
    let palletLabelSetting = state.dashboard[PALLET_LABEL_SETTING_KEY]
    this._palletLabel = (palletLabelSetting && palletLabelSetting.board) || {}
  }

  _showToast({ type, message }) {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          type,
          message
        }
      })
    )
  }
}

window.customElements.define('onhand-inventory', OnhandInventory)
