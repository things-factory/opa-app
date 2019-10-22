import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getCodeByName } from '@things-factory/code-base'
import { connect } from 'pwa-helpers/connect-mixin'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import { PALLET_LABEL_SETTING_KEY } from '../../setting-constants'
import { CustomAlert } from '../../utils/custom-alert'
import gql from 'graphql-tag'
import { USBPrinter } from '@things-factory/barcode-base'
import { css, html } from 'lit-element'
import { openPopup } from '@things-factory/layout-base'
import '../components/import-pop-up'

class InventoryAdjustment extends connect(store)(localize(i18next)(PageView)) {
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
      _email: String,
      config: Object,
      data: Object,
      _palletLabel: Object
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

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
      title: i18next.t('title.inventory_adjustment'),
      actions: [
        {
          title: i18next.t('button.pallet_label_print'),
          action: this._printPalletLabel.bind(this)
        },
        {
          title: i18next.t('button.save'),
          action: this._saveInventories.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteInventories.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.inventory_adjustment'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
    }
  }

  async pageInitialized() {
    this.bizplace = await this.fetchBizplace()
    this.product = await this.fetchProduct()
    this.location = await this.fetchLocation()

    this.packingType = await getCodeByName('PACKING_TYPES')
    this.config = {
      list: {
        fields: ['palletId', 'product', 'bizplace', 'location']
      },
      rows: {
        selectable: {
          multiple: true
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
          imex: { header: i18next.t('field.pallet_id'), key: 'palletId', width: 25, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: {
            editable: true,
            align: 'center'
          },
          imex: { header: i18next.t('field.batch_no'), key: 'batchId', width: 30, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'bizplaces'
            }
          },
          imex: {
            header: i18next.t('field.customer'),
            key: 'bizplace.name',
            width: 50,
            type: 'array',
            arrData: this.bizplace
          },
          sortable: true,
          width: 200
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            editable: true,
            align: 'left',
            options: {
              queryName: 'products'
            }
          },
          imex: {
            header: i18next.t('field.product'),
            key: 'product.name',
            width: 50,
            type: 'array',
            arrData: this.product
          },
          sortable: true,
          width: 500
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: true,
            align: 'center',
            codeName: 'PACKING_TYPES'
          },
          imex: {
            header: i18next.t('field.packing_type'),
            key: 'packingType',
            width: 25,
            type: 'array',
            arrData: this.packingType.map(packingType => {
              return {
                name: packingType.name,
                id: packingType.name
              }
            })
          },
          width: 150
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { editable: true, align: 'center' },
          sortable: true,
          imex: {
            header: i18next.t('field.qty'),
            key: 'qty',
            width: 10,
            type: 'float'
          },
          width: 80
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
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'locations',
              select: [
                { name: 'id', hidden: true },
                { name: 'description', hidden: true },
                { name: 'name', header: i18next.t('field.name'), sortable: true, record: { align: 'center' } },
                { name: 'zone', header: i18next.t('field.zone'), sortable: true, record: { align: 'center' } },
                { name: 'row', header: i18next.t('field.row'), sortable: true, record: { align: 'center' } }
              ],
              list: { fields: ['z', 'product', 'batchId', 'location'] }
            },
            list: { fields: ['location'] }
          },
          imex: {
            header: i18next.t('field.location'),
            key: 'location.name',
            width: 15,
            type: 'array',
            arrData: this.location
          },
          sortable: true,
          width: 150
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

    const _userBizplaces = await this._fetchUserBizplaces()

    this._searchFields = [
      {
        label: i18next.t('field.customer'),
        name: 'bizplaceName',
        type: 'select',
        options: [
          { value: '' },
          ..._userBizplaces
            .filter(userBizplaces => !userBizplaces.mainBizplace)
            .map(userBizplace => {
              return {
                name: userBizplace.name,
                value: userBizplace.name
              }
            })
        ],
        props: { searchOper: 'i_like' },
        attrs: ['custom']
      },
      {
        label: i18next.t('field.zone'),
        name: 'zone',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.location'),
        name: 'locationName',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.pallet_id'),
        name: 'palletId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.batch_no'),
        name: 'batchId',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.product'),
        name: 'productName',
        type: 'text',
        props: { searchOper: 'i_like' }
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
              id
              palletId
              batchId
              packingType
              bizplace {
                id
                name
                description
              }
              product {
                id
                name
                description
              }
              qty
              warehouse {
                id
                name
                description
              }
              zone
              location {
                id
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

  async _saveInventories() {
    var patches = this.dataGrist.exportPatchList({ flagName: 'cuFlag' })
    patches.map(x => {
      if (x.bizplace) {
        delete x.bizplace['__seq__']
        delete x.bizplace['__origin__']
        delete x.bizplace['__selected__']
      }
      if (x.location) {
        delete x.location['row']
        delete x.location['zone']
        delete x.location['__seq__']
        delete x.location['__origin__']
        delete x.location['__selected__']
      }
      if (x.product) {
        delete x.product['__seq__']
        delete x.product['__origin__']
        delete x.product['__selected__']
      }
    })
    if (patches && patches.length) {
      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleInventory(${gqlBuilder.buildArgs({
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

  async _deleteInventories() {
    CustomAlert({
      title: i18next.t('text.are_you_sure'),
      text: i18next.t('text.you_wont_be_able_to_revert_this'),
      type: 'warning',
      confirmButton: { text: i18next.t('button.delete'), color: '#22a6a7' },
      cancelButton: { text: 'cancel', color: '#cfcfcf' },
      callback: async result => {
        if (result.value) {
          const id = this.dataGrist.selected.map(record => record.id)
          if (id && id.length > 0) {
            const response = await client.query({
              query: gql`
                mutation {
                  deleteInventories(${gqlBuilder.buildArgs({ id })})
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

  async importHandler(patches) {
    patches.map(itm => {
      itm.qty = parseFloat(itm.qty)
    })

    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleInventory(${gqlBuilder.buildArgs({
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

  _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = this.dataGrist.data.records
    }
    // data structure // { //    header: {headerName, fieldName, type = string, arrData = []} //    data: [{fieldName: value}] // }

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
    // return this.dataGrist.exportRecords()
  }

  stateChanged(state) {
    let palletLabelSetting = state.dashboard[PALLET_LABEL_SETTING_KEY]
    this._palletLabel = (palletLabelSetting && palletLabelSetting.board) || {}
    this._email = state.auth && state.auth.user && state.auth.user.email
  }

  async fetchBizplace() {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: []
            })}) {
              items {
                id
                name
              }
            }
          }
        `
    })
    return response.data.bizplaces.items
  }

  async _fetchUserBizplaces() {
    if (!this._email) return
    const response = await client.query({
      query: gql`
        query {
          userBizplaces(${gqlBuilder.buildArgs({
            email: this._email
          })}) {
            id
            name
            description
            mainBizplace
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.userBizplaces
    }
  }

  async fetchProduct() {
    const response = await client.query({
      query: gql`
          query {
            products(${gqlBuilder.buildArgs({
              filters: []
            })}) {
              items {
                id
                name
              }
            }
          }
        `
    })
    return response.data.products.items
  }

  async fetchLocation() {
    const response = await client.query({
      query: gql`
          query {
            locations(${gqlBuilder.buildArgs({
              filters: []
            })}) {
              items {
                id
                name
              }
            }
          }
        `
    })
    return response.data.locations.items
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

window.customElements.define('inventory-adjustment', InventoryAdjustment)
