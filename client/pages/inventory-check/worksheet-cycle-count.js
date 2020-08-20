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
      this._updateGristConfig()
    }
  }

  pageInitialized() {
    this.preConfig = {
      rows: { appendable: false },
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
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 80
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
          name: 'inspectedLocation',
          header: i18next.t('field.inspected_location'),
          record: { align: 'center' },
          width: 120
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
          name: 'inspectedWeight',
          header: i18next.t('field.inspected_weight'),
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
            }
            worksheetDetails {
              name
              status
              description
              targetInventory {
                inspectedQty
                inspectedWeight
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
      this._worksheetStatus = worksheet.status
      this._cycleCountNo = (worksheet.inventoryCheck && worksheet.inventoryCheck.name) || ''

      this._fillupForm({
        ...worksheet,
        cycleCountNo: worksheet.inventoryCheck.name,
        executionDate: worksheet.inventoryCheck.executionDate
      })
      this.data = {
        records: worksheetDetails.map(worksheetDetail => {
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
      }
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
    this.data = { ...this.data }
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
        this._showToast({ message: i18next.t('text.worksheet_activated') })
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

window.customElements.define('worksheet-cycle-count', WorksheetCycleCount)
