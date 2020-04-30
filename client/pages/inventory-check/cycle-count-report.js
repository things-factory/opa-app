import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { WORKSHEET_STATUS } from '../inbound/constants/worksheet'
import { ORDER_STATUS } from '../order/constants/order'

class CycleCountReport extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _worksheetNo: String,
      _reportStatus: String,
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
      }
    }
  }

  render() {
    return html`
      <div class="form-container">
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.cycle_count')}</legend>
            <label>${i18next.t('label.cycle_count_no')}</label>
            <input name="cycleCountNo" readonly />

            <label>${i18next.t('label.execute_date')}</label>
            <input name="executionDate" readonly />

            <label>${i18next.t('label.inventory_accuracy')}</label>
            <input name="inventoryAccuracy" readonly />

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
          .data="${this.data}"
        ></data-grist>
      </div>
    `
  }

  async pageUpdated(changes) {
    if (this.active && (changes.resourceId || this._worksheetNo)) {
      if (changes.resourceId) {
        this._worksheetNo = changes.resourceId
      }
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
            emphasized: record.status === WORKSHEET_STATUS.NOT_TALLY.value
          }
        }
      },
      list: { fields: ['batchId', 'palletId', 'product', 'packingType', 'releaseQty', 'status'] },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 350
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.system_location'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'inspectedLocation',
          header: i18next.t('field.inspected_location'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.system_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'inspectedQty',
          header: i18next.t('field.inspected_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.system_weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'float',
          name: 'inspectedWeight',
          header: i18next.t('field.inspected_weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
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
          worksheet(${gqlBuilder.buildArgs({
            name: this._worksheetNo
          })}) {
            status
            inventoryCheck {
              name
              description
              executionDate
              status
            }
            worksheetDetails {
              name
              status
              description
              targetInventory {
                inspectedQty
                inspectedWeight
                inspectedLocation
                inventory {
                  palletId
                  batchId
                  packingType
                  qty
                  weight
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
          }
        }
      `
    })

    if (!response.errors) {
      const worksheet = response.data.worksheet
      const worksheetDetails = worksheet.worksheetDetails
      const tallyInv = worksheetDetails.filter(wd => wd.status === WORKSHEET_STATUS.DONE.value)
      const notTallyInv = worksheetDetails.filter(wd => wd.status === WORKSHEET_STATUS.NOT_TALLY.value)
      const accuracyInv = (tallyInv.length / (tallyInv.length + notTallyInv.length)) * 100 + `%`

      this._reportStatus = worksheet.inventoryCheck.status
      this._cycleCountNo = (worksheet.inventoryCheck && worksheet.inventoryCheck.name) || ''

      this._fillupForm({
        ...worksheet,
        cycleCountNo: worksheet.inventoryCheck.name,
        executionDate: worksheet.inventoryCheck.executionDate,
        status: this._reportStatus,
        inventoryAccuracy: accuracyInv
      })
      this.data = {
        records: worksheetDetails
          .map(worksheetDetail => {
            return {
              ...worksheetDetail.targetInventory.inventory,
              name: worksheetDetail.name,
              description: worksheetDetail.description,
              status: worksheetDetail.status,
              inspectedLocation: worksheetDetail.targetInventory.inspectedLocation,
              inspectedQty: worksheetDetail.targetInventory.inspectedQty,
              inspectedWeight: worksheetDetail.targetInventory.inspectedWeight,
              packingType: worksheetDetail.targetInventory.inventory.packingType
            }
          })
          .sort(this._compareValues('status', 'desc'))
      }
    }
  }

  _updateContext() {
    this._actions = []

    if (this._reportStatus === ORDER_STATUS.PENDING_REVIEW.value) {
      this._actions = [{ title: i18next.t('button.adjust_inventory'), action: this._adjustInventory.bind(this) }]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

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
        this._showToast({ message: i18next.t('text.inventory_has_been_adjusted') })
        await this.fetchWorksheet()
        this._updateContext()
        navigate(`inventory_check_list`)
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
