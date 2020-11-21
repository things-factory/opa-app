import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS, WORKSHEET_STATUS, WORKSHEET_TYPE } from '../constants'
import './cycle-count-recheck-popup'

class CycleCountReport extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _worksheetNo: String,
      _reportStatus: String,
      _cycleCountNo: String,
      cycleCountType: String,
      customerId: String,
      inventoryAccuracy: String,
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
      title: i18next.t('title.cycle_count_report'),
      actions: this._actions,
      printable: {
        accept: ['preview'],
        content: this
      },
      exportable: {
        name: this._cycleCountNo,
        data: this._exportableData.bind(this)
      }
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
            <input name="executionDate" readonly />

            <label>${i18next.t('label.inventory_accuracy')}</label>
            <input name="inventoryAccuracy" value="${this.inventoryAccuracy ? this.inventoryAccuracy : ''}" readonly />

            <label>${i18next.t('label.status')}</label>
            <select name="status" disabled>
              ${Object.keys(ORDER_STATUS).map(
                key => html`
                  <option value="${ORDER_STATUS[key].value}">${i18next.t(`label.${ORDER_STATUS[key].name}`)}</option>
                `
              )}
            </select>
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.inventory')}</h2>

        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchWorksheetWithPagination.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  async pageUpdated(changes) {
    if (this.active && (changes.resourceId || this._worksheetNo)) {
      if (changes.resourceId) {
        this._worksheetNo = changes.resourceId
      }
      this.grist.fetch()
      await this.fetchWorksheet()
      this._updateContext()
    }
  }

  pageInitialized() {
    this.config = {
      rows: {
        appendable: false,
        classifier: (record, rowIndex) => {
          return {
            emphasized:
              record.status === WORKSHEET_STATUS.NOT_TALLY.value || record.status === WORKSHEET_STATUS.ADJUSTED.value
          }
        }
      },
      list: {
        fields: [
          'batchId',
          'inspectedBatchNo',
          'palletId',
          'product',
          'packingType',
          'inspectedStatus',
          'inspectedLocation',
          'inspectedQty',
          'inspectedUomValue',
          'status'
        ]
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          imex: { header: i18next.t('field.batch_no'), key: 'batchId', width: 25, type: 'string' },
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'inspectedBatchNo',
          header: i18next.t('field.inspected_batch_no'),
          imex: { header: i18next.t('field.inspected_batch_no'), key: 'inspectedBatchNo', width: 25, type: 'string' },
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          imex: { header: i18next.t('field.pallet_id'), key: 'palletId', width: 25, type: 'string' },
          record: { align: 'left' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          imex: { header: i18next.t('field.product'), key: 'productName', width: 60, type: 'string' },
          record: { align: 'left' },
          width: 350
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          imex: { header: i18next.t('field.packing_type'), key: 'packingType', width: 20, type: 'string' },
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'inspectedStatus',
          header: i18next.t('field.inspected_status'),
          imex: { header: i18next.t('field.inspected_status'), key: 'inspectedStatus', width: 20, type: 'string' },
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.system_location'),
          imex: { header: i18next.t('field.system_location'), key: 'locationName', width: 20, type: 'string' },
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'string',
          name: 'inspectedLocation',
          header: i18next.t('field.inspected_location'),
          imex: { header: i18next.t('field.inspected_location'), key: 'inspectedLocation', width: 20, type: 'string' },
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.system_qty'),
          imex: { header: i18next.t('field.system_qty'), key: 'qty', width: 20, type: 'string' },
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'inspectedQty',
          header: i18next.t('field.inspected_qty'),
          imex: { header: i18next.t('field.inspected_qty'), key: 'inspectedQty', width: 20, type: 'string' },
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'float',
          name: 'uomValue',
          header: i18next.t('field.system_uom_value'),
          imex: { header: i18next.t('field.system_uom_value'), key: 'uomValue', width: 20, type: 'string' },
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'float',
          name: 'inspectedUomValue',
          header: i18next.t('field.inspected_uom_value'),
          imex: {
            header: i18next.t('field.inspected_uom_value'),
            key: 'inspectedUomValue',
            width: 20,
            type: 'string'
          },
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'uom',
          header: i18next.t('field.uom'),
          imex: { header: i18next.t('field.uom'), key: 'uom', width: 20, type: 'string' },
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          imex: { header: i18next.t('field.status'), key: 'status', width: 20, type: 'string' },
          record: { align: 'center' },
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

  async fetchWorksheet() {
    if (!this._worksheetNo) return
    const response = await client.query({
      query: gql`
        query {
          worksheetWithPagination(${gqlBuilder.buildArgs({
            name: this._worksheetNo,
            pagination: {}
          })}) {
            worksheet {
              type
              status
              inventoryCheck {
                name
                executionDate
                status
              }
              bizplace {
                id
                name
              }
            }
            worksheetDetails {
              name
              status
              description
              targetInventory {
                status
                id
                inspectedBatchNo
                inspectedQty
                inspectedUomValue
                inspectedLocation {
                  id
                  name
                  description
                }
                inventory {
                  palletId
                  batchId
                  packingType
                  qty
                  uomValue
                  uom
                  location {
                    id
                    name
                    description
                  }
                  product {
                    name
                    description
                  }
                }
              }
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      const worksheetDetails = response.data.worksheetWithPagination.worksheetDetails
      const tallyInv = worksheetDetails.filter(wd => wd.status === WORKSHEET_STATUS.DONE.value)
      const notTallyInv = worksheetDetails.filter(wd => wd.status === WORKSHEET_STATUS.NOT_TALLY.value)
      const adjustedInv = worksheetDetails.filter(wd => wd.status === WORKSHEET_STATUS.ADJUSTED.value)

      const accuracyInv =
        (tallyInv.length / (tallyInv.length + (notTallyInv.length ? notTallyInv.length : adjustedInv.length))) * 100 +
        `%`

      this.inventoryAccuracy = accuracyInv
    }
  }

  async fetchWorksheetWithPagination({ page, limit }) {
    if (!this._worksheetNo) return
    const response = await client.query({
      query: gql`
        query {
          worksheetWithPagination(${gqlBuilder.buildArgs({
            name: this._worksheetNo,
            pagination: { page, limit }
          })}) {
            worksheet {
              type
              status
              inventoryCheck {
                name
                executionDate
                status
              }
              bizplace {
                id
                name
              }
            }
            worksheetDetails {
              name
              status
              description
              targetInventory {
                status
                id
                originBatchNo
                inspectedBatchNo
                originQty
                inspectedQty
                originUomValue
                inspectedUomValue
                originLocation {
                  id
                  name
                  description
                }
                inspectedLocation {
                  id
                  name
                  description
                }
                inventory {
                  palletId
                  packingType
                  uom
                  product {
                    name
                    description
                  }
                }
              }
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      const worksheet = response.data.worksheetWithPagination.worksheet
      this.cycleCountType = worksheet.type
      this.customerId = worksheet.bizplace.id
      const worksheetDetails = response.data.worksheetWithPagination.worksheetDetails

      this._reportStatus = worksheet.inventoryCheck.status
      this._cycleCountNo = (worksheet.inventoryCheck && worksheet.inventoryCheck.name) || ''

      this._fillupForm({
        ...worksheet,
        cycleCountNo: worksheet.inventoryCheck.name,
        executionDate: worksheet.inventoryCheck.executionDate,
        status: this._reportStatus
      })
      const records = worksheetDetails
        .map(worksheetDetail => {
          return {
            ...worksheetDetail.targetInventory.inventory,
            name: worksheetDetail.name,
            description: worksheetDetail.description,
            productName:
              worksheetDetail.targetInventory.inventory.product.name +
              `(` +
              worksheetDetail.targetInventory.inventory.product.description +
              `)`,
            locationName: worksheetDetail.targetInventory.originLocation.name,
            status: worksheetDetail.status,
            batchId: worksheetDetail.targetInventory.originBatchNo,
            inspectedBatchNo: worksheetDetail.targetInventory.inspectedBatchNo,
            qty: worksheetDetail.targetInventory.originQty,
            inspectedQty: worksheetDetail.targetInventory.inspectedQty,
            uomValue: worksheetDetail.targetInventory.originUomValue,
            inspectedUomValue: worksheetDetail.targetInventory.inspectedUomValue,
            uom:
              worksheetDetail.targetInventory &&
              worksheetDetail.targetInventory.inventory &&
              worksheetDetail.targetInventory.inventory.uom,
            location: worksheetDetail.targetInventory.originLocation,
            inspectedLocation: worksheetDetail.targetInventory.inspectedLocation?.name,
            packingType: worksheetDetail.targetInventory.inventory?.packingType || '',
            inspectedStatus: worksheetDetail.targetInventory.status,
            orderInventoryId: worksheetDetail.targetInventory.id
          }
        })
        .sort(this._compareValues('status', 'desc'))

      this._updateContext()
      const total = response.data.worksheetWithPagination.total
      return { records, total }
    }
  }

  _updateContext() {
    this._actions = []

    if (this._reportStatus === ORDER_STATUS.PENDING_REVIEW.value) {
      this._actions.push({ title: i18next.t('button.adjust_inventory'), action: this._adjustInventory.bind(this) })

      if (this.cycleCountType === WORKSHEET_TYPE.CYCLE_COUNT.value) {
        this._actions.push({
          title: i18next.t('button.reject'),
          action: this.openCycleCountRecheckPopup.bind(this)
        })
      }
    }

    this._actions.push({ title: i18next.t('button.back'), action: () => history.back() })

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
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

  _compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0
      }

      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key]
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key]

      let comparison = 0
      if (varA > varB) {
        comparison = 1
      } else if (varA < varB) {
        comparison = -1
      }
      return order === 'desc' ? comparison * -1 : comparison
    }
  }

  async _adjustInventory() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.inventory_adjustment'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            cycleCountAdjustment(${gqlBuilder.buildArgs({
              cycleCountNo: this._cycleCountNo
            })}) 
          }
        `
      })
      if (!response.errors) {
        this._showToast({ message: i18next.t('text.inventory_has_been_adjusted') })
        await this.grist.fetch()
        this._updateContext()
        navigate(`inventory_check_list`)
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  openCycleCountRecheckPopup() {
    openPopup(
      html`
        <cycle-count-recheck-popup
          .cycleCountNo="${this._cycleCountNo}"
          .customerId="${this.customerId}"
          @completed="${() => this.grist.fetch()}"
        ></cycle-count-recheck-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.cycle_count_recheck')
      }
    )
  }

  async _exportableData() {
    try {
      let header = [
        ...this.grist.config.columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .map(column => {
            return column.imex
          })
      ]

      let data = this.grist.dirtyData.records

      return { header, data }
    } catch (e) {
      this._showToast(e)
    }
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

window.customElements.define('cycle-count-report', CycleCountReport)
