import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { fetchLocationSortingRule } from '../../fetch-location-sorting-rule'
import { WORKSHEET_STATUS } from '../inbound/constants/worksheet'

class InspectingProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      inventoryCheckNo: String,
      config: Object,
      data: Object,
      _productName: String,
      _selectedTaskStatus: String
    }
  }

  static get styles() {
    return [
      SingleColumnFormStyles,
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }

        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex: 1;
          overflow: auto;
        }

        .left-column {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .right-column {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
        }

        data-grist {
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

        fieldset[hidden] {
          display: none;
        }

        div.reusable_pallet {
          grid-column: span 12 / auto;
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          background-color: #ccc0;
          border: 1px solid #6e7e8e;
          color: #394e63;
        }

        @media (max-width: 460px) {
          :host {
            display: block;
          }
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.inventory_inspection')
    }
  }

  get inventoryCheckNoInput() {
    return this.shadowRoot
      .querySelector('barcode-scanable-input[name=inventoryCheckNo]')
      .shadowRoot.querySelector('input')
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get palletInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=palletId]').shadowRoot.querySelector('input')
  }

  get locationInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=locationName]').shadowRoot.querySelector('input')
  }

  get inspectedQtyInput() {
    return this.shadowRoot.querySelector('input[name=inspectedQty]')
  }

  get inspectedWeightInput() {
    return this.shadowRoot.querySelector('input[name=inspectedWeight]')
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.inventory_check_no')}</label>
          <barcode-scanable-input
            name="inventoryCheckNo"
            custom-input
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.inventoryCheckNoInput.value) {
                  this._fetchInventories(this.inventoryCheckNoInput.value)
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.inventory_inspection')}: ${this.inventoryCheckNo}`}</legend>

          <label>${i18next.t('label.started_at')}</label>
          <input name="startedAt" type="datetime-local" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.inspection_list')}</h2>
          <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .data=${this.data}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form" @keypress="${this._inspecting.bind(this)}">
            <fieldset>
              <legend>${i18next.t('label.product')}: ${this._productName}</legend>

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" />

              <label>${i18next.t('label.packing_type')}</label>
              <input name="packingType" readonly />

              <label>${i18next.t('label.current_location')}</label>
              <input name="location" readonly />
            </fieldset>

            <fieldset ?hidden=${!this.scannable}>
              <legend>${i18next.t('title.input_section')}</legend>
              <label>${i18next.t('label.pallet_barcode')}</label>
              <barcode-scanable-input name="palletId" custom-input></barcode-scanable-input>

              <label>${i18next.t('label.inspected_location')}</label>
              <barcode-scanable-input name="locationName" custom-input></barcode-scanable-input>

              <label>${i18next.t('label.inspected_qty')}</label>
              <input type="number" min="1" name="inspectedQty" required />

              <label>${i18next.t('label.inspected_weight')}</label>
              <input type="number" min="1" name="inspectedWeight" required />
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.data = { records: [] }
    this._productName = ''
    this.inventoryCheckNo = ''
    this._selectedOrderInventory = null
    this._selectedTaskStatus = null
    this.locationSortingRules = []
  }

  get scannable() {
    return this._selectedTaskStatus && this._selectedTaskStatus === WORKSHEET_STATUS.EXECUTING.value
  }

  get completed() {
    return this.data.records.every(record => record.completed)
  }

  updated(changedProps) {
    if (changedProps.has('_selectedTaskStatus') && this._selectedTaskStatus) {
      this._updateContext()
    }
  }

  async pageInitialized() {
    this.config = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (data.records.length && record) {
              if (this._selectedOrderInventory && this._selectedOrderInventory.name === record) {
                return
              }

              this._selectedOrderInventory = record
              this._selectedTaskStatus = null
              this._selectedTaskStatus = record.status
              this._productName = `${record.product.name} ${
                record.product.description ? `(${record.product.description})` : ''
              }`

              this._fillUpForm(this.inputForm, record)
              this._focusOnInput(this.palletInput)
            }
          }
        }
      },
      pagination: { infinite: true },
      list: { fields: ['completed', 'locationName', 'palletId', 'batchId'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'completed',
          header: i18next.t('field.done'),
          width: 40
        },
        {
          type: 'string',
          name: 'locationName',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'center' },
          width: 140
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 140
        }
      ]
    }

    this.locationSortingRules = await fetchLocationSortingRule()
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnInput(this.inventoryCheckNoInput)
    }
  }

  _updateContext() {
    let actions = []
    if (
      this._selectedTaskStatus === WORKSHEET_STATUS.DONE.value ||
      this._selectedTaskStatus === WORKSHEET_STATUS.NOT_TALLY.value
    ) {
      actions = [...actions, { title: i18next.t('button.undo'), action: this._undoInspection.bind(this) }]
    }

    if (this.completed) {
      actions = [...actions, { title: i18next.t('button.complete'), action: this._complete.bind(this) }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.inventory_inspection'),
        actions
      }
    })
  }

  _focusOnInput(target) {
    setTimeout(() => target.focus(), 100)
  }

  async _fetchInventories(inventoryCheckNo) {
    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          cycleCountWorksheet(${gqlBuilder.buildArgs({
            inventoryCheckNo,
            locationSortingRules: this.locationSortingRules
          })}) {
            worksheetInfo {
              startedAt
            }
            worksheetDetailInfos {
              name
              palletId
              batchId
              product {
                name
                description
              }
              qty
              status
              description
              targetName
              packingType
              location {
                name
                description
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.inventoryCheckNo = inventoryCheckNo
      this._fillUpForm(this.infoForm, response.data.cycleCountWorksheet.worksheetInfo)

      this.data = {
        records: response.data.cycleCountWorksheet.worksheetDetailInfos
          .map(record => {
            return {
              ...record,
              completed:
                record.status === WORKSHEET_STATUS.NOT_TALLY.value || record.status === WORKSHEET_STATUS.DONE.value,
              locationName: record.location.name
            }
          })
          .sort((a, b) => b.completed - a.completed)
          .reverse()
      }

      this._completeHandler()
    }
  }

  _clearView() {
    this.data = { records: [] }
    this.infoForm.reset()
    this.inputForm.reset()
    this._productName = ''
    this.inventoryCheckNo = ''
    this._selectedOrderInventory = null
    this._selectedTaskStatus = null
  }

  _fillUpForm(form, data) {
    form.reset()
    for (let key in data) {
      Array.from(form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
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

  async _inspecting(e) {
    if (e.keyCode === 13) {
      try {
        await this._validateInspection()

        const response = await client.query({
          query: gql`
                mutation {
                  inspecting(${gqlBuilder.buildArgs({
                    worksheetDetailName: this._selectedOrderInventory.name,
                    palletId: this.palletInput.value,
                    locationName: this.locationInput.value,
                    inspectedQty: parseInt(this.inspectedQtyInput.value),
                    inspectedWeight: parseFloat(this.inspectedWeightInput.value)
                  })})
                }
              `
        })

        if (!response.errors) {
          this._fetchInventories(this.inventoryCheckNo)
          this._focusOnInput(this.palletInput)
          this._selectedTaskStatus = null
          this._selectedOrderInventory = null
          this.palletInput.value = ''
          this.inspectedQtyInput.value = ''
          this.inspectedWeightInput.value = ''
          this.locationInput.value = ''
        }
      } catch (e) {
        this._showToast(e)
      }
    }
  }

  async _validateInspection() {
    // 1. validate for order selection
    if (!this._selectedOrderInventory) throw new Error(i18next.t('text.target_doesnt_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnInput(this.palletInput)
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 3. Equality of pallet id
    if (this._selectedOrderInventory.palletId !== this.palletInput.value) {
      this._focusOnInput(this.palletInput)
      throw new Error(i18next.t('text.wrong_pallet_id'))
    }

    // 4. location id existing
    if (!this.locationInput.value) {
      this._focusOnInput(this.locationInput)
      throw new Error(i18next.t('text.location_id_is_empty'))
    }

    // 5. inspected qty existing
    if (!this.inspectedQtyInput.value) {
      this._focusOnInput(this.inspectedQtyInput)
      throw new Error(i18next.t('text.inspected_qty_is_empty'))
    }

    if (this.inspectedQtyInput.value < 0) {
      this._focusOnInput(this.inspectedQtyInput)
      throw new Error(i18next.t('text.inspected_qty_is_invalid'))
    }

    if (this.inspectedWeightInput.value < 0) {
      this._focusOnInput(this.inspectedWeightInput)
      throw new Error(i18next.t('text.inspected_weight_is_invalid'))
    }

    // 6. inspected weight existing
    if (!this.inspectedWeightInput.value) {
      this._focusOnInput(this.inspectedWeightInput)
      throw new Error(i18next.t('text.inspected_weight_is_empty'))
    }
  }

  async _completeHandler() {
    if (!this.data.records.every(record => record.completed)) return
    this._updateContext()
    const result = await CustomAlert({
      title: i18next.t('title.inventory_inspection'),
      text: i18next.t('text.do_you_want_to_complete'),
      confirmButton: { text: i18next.t('button.complete') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (!result.value) {
      return
    }

    this._complete()
  }

  async _complete() {
    const response = await client.query({
      query: gql`
        mutation {
          completeInspection(${gqlBuilder.buildArgs({
            inventoryCheckNo: this.inventoryCheckNo
          })})
        }
      `
    })

    if (!response.errors) {
      this._clearView()
      const result = await CustomAlert({
        title: i18next.t('title.inventory_inspection'),
        text: i18next.t('text.inspection_is_completed'),
        confirmButton: { text: i18next.t('button.confirm') }
      })

      this._clearView()
      navigate('inventory_check_list')
    }
  }

  async _undoInspection() {
    try {
      if (!this._selectedOrderInventory) throw new Error(i18next.t('text.there_is_no_selected_items'))

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.undo_inspection'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            undoInspection(${gqlBuilder.buildArgs({
              worksheetDetailName: this._selectedOrderInventory.name
            })})
          }
        `
      })

      if (!response.errors) {
        this._fetchInventories(this.inventoryCheckNo)
        this._focusOnInput(this.palletInput)
        this._selectedTaskStatus = null
        this._selectedOrderInventory = null
        this.inspectedQtyInput.value = ''
        this.inspectedWeightInput.value = ''
        this.palletInput.value = ''
        this.locationInput.value = ''
      }
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

window.customElements.define('inspecting-product', InspectingProduct)
