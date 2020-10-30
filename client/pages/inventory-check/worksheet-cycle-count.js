import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { WORKSHEET_STATUS } from '../constants'

class WorksheetCycleCount extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _worksheetNo: String,
      _worksheetStatus: String,
      _cycleCountNo: String,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
        }
        .form-container {
          display: flex;
        }
        .form-container > form {
          flex: 1;
        }
        barcode-tag {
          width: 100px;
          height: 100px;
          margin: 10px;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .grist h2 {
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }

        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }

        h2 + data-grist {
          padding-top: var(--grist-title-with-grid-padding);
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.worksheet_cycle_count'),
      actions: this._actions,
      printable: {
        accept: ['preview'],
        content: this
      }
      // exportable: {
      //   name: i18next.t('title.worksheet_cycle_count'),
      //   data: this._exportableData.bind(this)
      // }
    }
  }

  render() {
    return html`
      <div class="form-container">
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.cycle_count')}</legend>
            <label>${i18next.t('label.customer')}</label>
            <input name="bizplace" readonly />

            <label>${i18next.t('label.cycle_count_no')}</label>
            <input name="cycleCountNo" readonly />

            <label>${i18next.t('label.execute_date')}</label>
            <input type="date" name="executionDate" readonly />

            <label>${i18next.t('label.status')}</label>
            <select name="status" disabled>
              ${Object.keys(WORKSHEET_STATUS).map(
                key => html` <option value="${WORKSHEET_STATUS[key].value}">${WORKSHEET_STATUS[key].name}</option> `
              )}
            </select>
          </fieldset>
        </form>

        <barcode-tag bcid="qrcode" .value=${this._cycleCountNo}></barcode-tag>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.inventory')}</h2>

        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchWorksheet.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  pageUpdated(changes) {
    if (this.active && (changes.resourceId || this._worksheetNo)) {
      if (changes.resourceId) {
        this._worksheetNo = changes.resourceId
      }
      this.grist.fetch()
      this._updateGristConfig()
    }
  }

  updated(changedProps) {
    if (changedProps.has('_worksheetStatus')) {
      this._updateContext()
    }
  }

  pageInitialized() {
    this.preConfig = {
      rows: { appendable: false },
      list: {
        fields: [
          'batchId',
          'palletId',
          'product',
          'location',
          'inspectedLocation',
          'inspectedQty',
          'inspectedWeight',
          'inspectedBatchNo',
          'status'
        ]
      },
      // pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          imex: { header: i18next.t('field.batch_no'), key: 'batchId', width: 100, type: 'string' },
          width: 100
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          imex: { header: i18next.t('field.pallet_id'), key: 'palletId', width: 150, type: 'string' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          imex: {
            header: i18next.t('field.product'),
            key: 'product.name',
            width: 50,
            type: 'string'
          },
          width: 350
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          imex: {
            header: i18next.t('field.location'),
            key: 'location.name',
            width: 15,
            type: 'string'
          },
          width: 80
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.packing_type'), key: 'packingType', width: 100, type: 'string' },
          width: 100
        },
        {
          type: 'object',
          name: 'inspectedLocation',
          header: i18next.t('field.inspected_location'),
          record: { align: 'center' },
          imex: {
            header: i18next.t('field.inspected_location'),
            key: 'inspectedLocation.name',
            width: 15,
            type: 'string'
          },
          width: 120
        },
        {
          type: 'string',
          name: 'inspectedBatchNo',
          header: i18next.t('field.inspected_batch_no'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.inspected_batch_no'), key: 'inspectedBatchNo', width: 100, type: 'string' },
          width: 100
        },
        {
          type: 'integer',
          name: 'inspectedQty',
          header: i18next.t('field.inspected_qty'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.inspected_qty'), key: 'inspectedQty', width: 100, type: 'number' },
          width: 100
        },
        {
          type: 'float',
          name: 'inspectedWeight',
          header: i18next.t('field.inspected_weight'),
          record: { align: 'center' },
          imex: { header: i18next.t('field.inspected_weight'), key: 'inspectedWeight', width: 100, type: 'number' },
          width: 100
        }
      ]
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async fetchWorksheet({ page, limit }) {
    if (!this._worksheetNo) return
    const response = await client.query({
      query: gql`
        query {
          worksheetWithPagination(${gqlBuilder.buildArgs({
            name: this._worksheetNo,
            pagination: { page, limit }
          })}) {
            worksheet {
              status
              inventoryCheck {
                name
                executionDate
              },
              bizplace {
                name
              }
            }
            worksheetDetails {
              name
              description
              status
              targetInventory {
                inventory {
                  batchId
                  palletId
                  packingType
                  location {
                    name
                    description
                  }
                  product {
                    name
                    description
                  }
                },
                inspectedLocation {
                  name
                  description
                }
                inspectedBatchNo
                inspectedQty
                inspectedWeight
              }
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      const { worksheet, worksheetDetails, total } = response.data.worksheetWithPagination
      this._worksheetStatus = worksheet.status
      this._cycleCountNo = (worksheet.inventoryCheck && worksheet.inventoryCheck.name) || ''

      this._fillupForm({
        ...worksheet,
        cycleCountNo: worksheet.inventoryCheck.name,
        executionDate: worksheet.inventoryCheck.executionDate
      })

      const records = worksheetDetails.map(worksheetDetail => {
        return {
          ...worksheetDetail.targetInventory.inventory,
          name: worksheetDetail.name,
          description: worksheetDetail.description,
          status: worksheetDetail.status,
          inspectedLocation: worksheetDetail.targetInventory.inspectedLocation,
          inspectedQty: worksheetDetail.targetInventory.inspectedQty,
          inspectedWeight: worksheetDetail.targetInventory.inspectedWeight,
          inspectedBatchNo: worksheetDetail.targetInventory.inspectedBatchNo,
          packingType: worksheetDetail.targetInventory.inventory.packingType
        }
      })

      return { records, total }
    }
  }

  _updateContext() {
    this._actions = []

    if (this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value) {
      this._actions = [{ title: i18next.t('button.activate'), action: this._activateWorksheet.bind(this) }]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _updateGristConfig() {
    const statusColumnConfig = {
      type: 'string',
      name: 'status',
      header: i18next.t('field.status'),
      record: { align: 'center' },
      width: 100
    }

    this.preConfig.columns.map(column => {
      if (column.name === 'description') {
        column.record = { ...column.record, editable: this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value }
      }
    })

    if (
      !this.preConfig.columns.some(e => e.name === 'status') &&
      this._worksheetStatus !== WORKSHEET_STATUS.DEACTIVATED.value
    ) {
      this.preConfig.columns = [...this.preConfig.columns, statusColumnConfig]
    } else if (
      this.preConfig.columns.some(e => e.name === 'status') &&
      this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value
    ) {
      this.preConfig.columns.splice(this.preConfig.columns.map(e => e.name).indexOf('status'))
    }

    this.config = { ...this.preConfig }
  }

  _fillupForm(data) {
    for (let key in data) {
      Array.from(this.form.querySelectorAll('input, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key) {
          if (data[key] instanceof Object) {
            const objectData = data[key]
            field.value = `${objectData.name} ${objectData.description ? `(${objectData.description})` : ''}`
          } else {
            field.value = data[key]
          }
        }
      })
    }
  }

  async _activateWorksheet() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.activate_cycle_count_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      CustomAlert({
        title: i18next.t('text.please_wait'),
        text: i18next.t('text.activate_cycle_count_worksheet'),
        allowOutsideClick: false,
        allowEscapeKey: false
      })

      const response = await client.query({
        query: gql`
          mutation {
            activateCycleCount(${gqlBuilder.buildArgs({
              worksheetNo: this._worksheetNo,
              cycleCountWorksheetDetails: this._getCycleCountWSD()
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) {
        await CustomAlert({
          title: i18next.t('label.activated'),
          text: i18next.t('text.complete_x', { state: { x: i18next.t('text.activating_cycle_count_worksheet') } }),
          confirmButton: { text: i18next.t('button.confirm') }
        })
        await this.grist.fetch()
        this._updateContext()
        navigate(`inventory_check_list`)
      } else {
        CustomAlert({
          title: i18next.t('title.error'),
          text: i18next.t('text.x_error', { state: { x: i18next.t('text.activate') } }),
          confirmButton: { text: i18next.t('button.confirm') }
        })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getCycleCountWSD() {
    return this.grist.dirtyData.records.map(worksheetDetail => {
      return {
        name: worksheetDetail.name,
        description: worksheetDetail.description
      }
    })
  }

  // async _exportableData() {
  //   try {
  //     let records = []
  //     let data = []

  //     var headerSetting = [
  //       ...this.dataGrist._config.columns
  //         .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
  //         .map(column => {
  //           return column.imex
  //         })
  //     ]

  //     const bizplaceFilters = (await this.searchForm.getQueryFilters()).filter(x => x.name === 'bizplaceId')

  //     if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
  //       records = this.dataGrist.selected
  //       data = records
  //     } else {
  //       data = await this.fetchWorksheetDetailForExport()
  //     }

  //     let bizplace = await this.fetchBizplaces(bizplaceFilters)

  //     let product = await this.fetchProduct(bizplaceFilters)

  //     headerSetting = headerSetting.map(column => {
  //       switch (column.key) {
  //         case 'bizplace.name':
  //           column.arrData = bizplace
  //           break
  //         case 'product.name':
  //           column.arrData = product
  //           break
  //         default:
  //           break
  //       }
  //       return column
  //     })

  //     data = data.map(item => {
  //       return {
  //         id: item.id,
  //         ...this._columns
  //           .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
  //           .reduce((record, column) => {
  //             record[column.imex.key] = column.imex.key
  //               .split('.')
  //               .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
  //             return record
  //           }, {})
  //       }
  //     })

  //     return { header: headerSetting, data: data }
  //   } catch (e) {
  //     this._showToast(e)
  //   }
  // }

  // async fetchWorksheetDetailForExport() {
  //   const filters = await this.searchForm.getQueryFilters()
  //   const response = await client.query({
  //     query: gql`
  //       query {
  //         inventories(${gqlBuilder.buildArgs({
  //           filters: [...filters],
  //           pagination: { page: 1, limit: 9999999 },
  //           sortings: []
  //         })}) {
  //           items {
  //             id
  //             palletId
  //             batchId
  //             packingType
  //             weight
  //             bizplace {
  //               id
  //               name
  //               description
  //             }
  //             product {
  //               id
  //               name
  //             }
  //             qty
  //             warehouse {
  //               id
  //               name
  //               description
  //             }
  //             zone
  //             location {
  //               id
  //               name
  //               description
  //             }
  //             updatedAt
  //             updater {
  //               name
  //               description
  //             }
  //           }
  //           total
  //         }
  //       }
  //     `
  //   })

  //   return response.data.inventories.items || []
  // }

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

window.customElements.define('worksheet-cycle-count', WorksheetCycleCount)
