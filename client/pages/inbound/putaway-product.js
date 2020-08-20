import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { WORKSHEET_STATUS } from '../constants'

const OPERATION_TYPE = {
  PUTAWAY: 'putaway',
  TRANSFER: 'transfer'
}

class PutawayProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      arrivalNoticeNo: String,
      config: Object,
      data: Object,
      _productName: String,
      _selectedTaskStatus: String,
      _operationType: String,
      incompleteLocationName: Boolean,
      locations: Array
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
          overflow: auto;
          flex: 1;
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
      title: i18next.t('title.putaway')
    }
  }

  get arrivalNoticeNoInput() {
    return this.shadowRoot
      .querySelector('barcode-scanable-input[name=arrivalNoticeNo]')
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
    return this.shadowRoot.querySelector('barcode-scanable-input[name=locationCode]').shadowRoot.querySelector('input')
  }

  get newLocationInput() {
    return this.shadowRoot.querySelector('select[name=newLocationCode]')
  }

  get toPalletInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=toPalletId]').shadowRoot.querySelector('input')
  }

  get qtyInput() {
    return this.shadowRoot.querySelector('input[name=transferQty]')
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.arrival_notice_no')}</label>
          <barcode-scanable-input
            name="arrivalNoticeNo"
            custom-input
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.arrivalNoticeNoInput.value) {
                  this._fetchProducts(this.arrivalNoticeNoInput.value)
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.arrival_notice')}: ${this.arrivalNoticeNo}`}</legend>

          <label>${i18next.t('label.customer')}</label>
          <input name="bizplaceName" readonly />

          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label>${i18next.t('label.started_at')}</label>
          <input name="startedAt" type="datetime-local" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.putaway')}</h2>
          <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .data=${this.data}
          ></data-grist>
        </div>

        <div class="right-column">
          <form class="multi-column-form">
            <fieldset>
              <legend>${i18next.t('title.operation_type')}</legend>
              <input
                id="putaway-radio"
                type="radio"
                name="operationType"
                value="${OPERATION_TYPE.PUTAWAY}"
                checked
                @change="${e => (this._operationType = e.currentTarget.value)}"
              /><label for="putaway-radio">${i18next.t('label.putaway')}</label>
              <input
                id="transfer-radio"
                type="radio"
                name="operationType"
                value="${OPERATION_TYPE.TRANSFER}"
                @change="${e => (this._operationType = e.currentTarget.value)}"
              /><label for="transfer-radio">${i18next.t('label.transfer')}</label>
            </fieldset>
          </form>

          <form id="input-form" class="single-column-form" @keypress="${this._transactionHandler.bind(this)}">
            <fieldset>
              <legend>${i18next.t('label.product')}: ${this._productName}</legend>

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.packing_type')}</label>
              <input name="packingType" readonly />

              <label>${i18next.t('label.comment')}</label>
              <input name="description" readonly />

              <label>${i18next.t('label.status')}</label>
              <input name="status" readonly />

              <label>${i18next.t('label.current_location')}</label>
              <input name="location" readonly />
            </fieldset>

            <fieldset>
              <legend style="display: ${this.scannable ? 'flex' : 'none'}">${i18next.t('title.input_section')}</legend>
              <label style="display: ${this.scannable ? 'flex' : 'none'}">${i18next.t('label.pallet_barcode')}</label>
              <barcode-scanable-input
                style="display: ${this.scannable ? 'flex' : 'none'}"
                name="palletId"
                .value=${this._pallet}
                custom-input
              ></barcode-scanable-input>

              <label
                style="display: ${this.scannable && this._operationType === OPERATION_TYPE.PUTAWAY ? 'flex' : 'none'}"
                >${i18next.t('label.location')}</label
              >
              <barcode-scanable-input
                style="display: ${this.scannable &&
                !this.incompleteLocationName &&
                this._operationType === OPERATION_TYPE.PUTAWAY
                  ? 'flex'
                  : 'none'}"
                name="locationCode"
                .value=${this._location}
                custom-input
              ></barcode-scanable-input>

              <select
                style="display: ${this.incompleteLocationName && this._operationType === OPERATION_TYPE.PUTAWAY
                  ? 'flex'
                  : 'none'}"
                name="newLocationCode"
                @change="${e => (this.locationInput.value = e.currentTarget.value)}"
              >
                <option value="">-- ${i18next.t('text.please_select_the_location')} --</option>
                ${(this.locations || []).map(
                  location =>
                    html`
                      <option value="${location && location.name}"
                        >${location && location.name}
                        ${location && location.status ? ` (${location && location.status})` : ''}</option
                      >
                    `
                )}
              </select>

              <label
                style="display: ${this.scannable && this._operationType === OPERATION_TYPE.TRANSFER ? 'flex' : 'none'}"
                >${i18next.t('label.to_pallet_barcode')}</label
              >
              <barcode-scanable-input
                style="display: ${this.scannable && this._operationType === OPERATION_TYPE.TRANSFER ? 'flex' : 'none'}"
                name="toPalletId"
                .value=${this._location}
                custom-input
              ></barcode-scanable-input>

              <label
                style="display: ${this.scannable && this._operationType === OPERATION_TYPE.TRANSFER ? 'flex' : 'none'}"
                >${i18next.t('label.qty')}</label
              >
              <input
                style="display: ${this.scannable && this._operationType === OPERATION_TYPE.TRANSFER ? 'flex' : 'none'}"
                type="number"
                min="1"
                name="transferQty"
              />
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
    this.arrivalNoticeNo = ''
    this._selectedOrderProduct = null
    this._selectedTaskStatus = null
    this._operationType = OPERATION_TYPE.PUTAWAY
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

    if (changedProps.has('_operationType')) {
      this._focusOnPalletInput()
    }
  }

  pageInitialized() {
    this.config = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (data.records.length && record) {
              if (this._selectedOrderProduct && this._selectedOrderProduct.name === record) {
                return
              }

              this._selectedOrderProduct = record
              this._selectedTaskStatus = null
              this._selectedTaskStatus = record.status
              this._productName = `${record.product.name} ${
                record.product.description ? `(${record.product.description})` : ''
              }`

              this._fillUpForm(this.inputForm, record)
              this._focusOnPalletInput()
            }
          }
        }
      },
      pagination: { infinite: true },
      list: { fields: ['completed', 'palletId', 'batchId', 'qty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'completed',
          header: i18next.t('field.completed'),
          width: 40
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          width: 140
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          width: 140
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'reusablePalletName',
          header: i18next.t('field.reusable_pallet'),
          width: 140
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnArrivalNoticeField()
    }
  }

  _updateContext() {
    this.incompleteLocationName = false
    let actions = []
    if (this._selectedTaskStatus === WORKSHEET_STATUS.DONE.value) {
      actions = [...actions, { title: i18next.t('button.undo'), action: this._undoPutaway.bind(this) }]
    }

    if (this.completed) {
      actions = [...actions, { title: i18next.t('button.complete'), action: this._completeHandler.bind(this) }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.putaway'),
        actions
      }
    })
  }

  _focusOnArrivalNoticeField() {
    setTimeout(() => this.arrivalNoticeNoInput.focus(), 100)
  }

  _focusOnPalletInput() {
    setTimeout(() => this.palletInput.focus(), 100)
  }

  _focusOnLocationInput() {
    setTimeout(() => this.locationInput.focus(), 100)
  }

  _focusOnNewLocationInput() {
    setTimeout(() => this.newLocationInput.focus(), 100)
  }

  _focusOnToPalletInput() {
    setTimeout(() => this.toPalletInput.focus(), 100)
  }

  _focusOnQtyInput() {
    setTimeout(() => this.qtyInput.focus(), 100)
  }

  async _fetchProducts(arrivalNoticeNo) {
    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          putawayWorksheet(${gqlBuilder.buildArgs({
            arrivalNoticeNo
          })}) {
            worksheetInfo {
              bizplaceName
              refNo
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
              reusablePallet {
                id
                name
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.arrivalNoticeNo = arrivalNoticeNo
      this._fillUpForm(this.infoForm, response.data.putawayWorksheet.worksheetInfo)

      let reusablePalletName = ''
      this.data = {
        records: response.data.putawayWorksheet.worksheetDetailInfos
          .map(record => {
            if (record.reusablePallet) {
              reusablePalletName = record.reusablePallet.name
            }
            return {
              ...record,
              completed: record.status === WORKSHEET_STATUS.DONE.value,
              reusablePalletName: reusablePalletName
            }
          })
          .sort((a, b) => {
            if (a.completed !== b.completed) {
              if (a.completed) return 1
              if (b.completed) return -1
            }

            if (a.batchId > b.batchId) return 1
            if (b.batchId < b.batchId) return -1

            if (a.palletId > b.palletId) return 1
            if (a.palletId < b.palletId) return -1

            return 0
          })
      }

      this._completeHandler()
    }
  }

  _clearView() {
    this.data = { records: [] }
    this.infoForm.reset()
    this.inputForm.reset()
    this._productName = ''
    this.arrivalNoticeNo = ''
    this._selectedOrderProduct = null
    this._selectedTaskStatus = null
    this.incompleteLocationName = false
    this._updateContext()
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

  _transactionHandler(e) {
    if (e.keyCode === 13) {
      if (this._operationType === OPERATION_TYPE.PUTAWAY) {
        this._putaway()
      } else if (this._operationType === OPERATION_TYPE.TRANSFER) {
        this._transfer()
      }
    }
  }

  async _putaway(e) {
    try {
      await this._validatePutaway()
      if (!this.incompleteLocationName) {
        const response = await client.query({
          query: gql`
            mutation {
              putaway(${gqlBuilder.buildArgs({
                worksheetDetailName: this._selectedOrderProduct.name,
                palletId: this.palletInput.value,
                toLocation: this.locationInput.value
              })})
            }
          `
        })

        if (!response.errors) {
          this._fetchProducts(this.arrivalNoticeNo)
          this._focusOnPalletInput()
          this._selectedTaskStatus = null
          this._selectedOrderProduct = null
          this.palletInput.value = ''
          this.locationInput.value = ''
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _transfer() {
    try {
      this._validateTransfer()
      const response = await client.query({
        query: gql`
          mutation {
            transfer(${gqlBuilder.buildArgs({
              palletId: this.palletInput.value,
              toPalletId: this.toPalletInput.value,
              qty: parseInt(this.qtyInput.value)
            })})
          }
        `
      })

      if (!response.errors) {
        this._fetchProducts(this.arrivalNoticeNo)
        this._focusOnPalletInput()
        this._selectedTaskStatus = null
        this._selectedOrderProduct = null
        this.palletInput.value = ''
        this.toPalletInput.value = ''
        this.qtyInput.value = ''
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _validatePutaway() {
    // 1. validate for order selection
    if (!this._selectedOrderProduct) throw new Error(i18next.t('text.target_is_not_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnPalletInput()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 3. equality of pallet id
    if (this._selectedOrderProduct.reusablePallet.name !== this.palletInput.value) {
      if (this._selectedOrderProduct.palletId !== this.palletInput.value) {
        setTimeout(() => this.palletInput.select(), 100)
        throw new Error(i18next.t('text.wrong_pallet_id'))
      }
    }

    // 4. location code existing
    if (!this.locationInput.value) {
      this._focusOnLocationInput()
      throw new Error(i18next.t('text.location_code_is_empty'))
    }

    // 5. check for completeness of location input
    else if (this.locationInput.value) {
      const locationNameSplit = this.locationInput.value.split('-')
      const zonePortions = locationNameSplit[0].match(/[a-zA-Z0-9]+/g)
      const rowPortions = locationNameSplit[1].match(/[a-zA-Z0-9]+/g)
      const columnPortions = locationNameSplit[2].match(/[a-zA-Z0-9]+/g)

      if (locationNameSplit.length === 3) {
        this.incompleteLocationName = true
        this.locations = await this._fetchLocations(zonePortions[0], rowPortions[0], columnPortions[0])
        this._focusOnNewLocationInput()
        throw new Error(i18next.t('text.please_select_the_location_again'))
      } else if (locationNameSplit.length === 4) {
        this.incompleteLocationName = false
      }
    }
  }

  _validateTransfer() {
    // 1. validate for order selection
    if (!this._selectedOrderProduct) throw new Error(i18next.t('text.target_is_not_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnPalletInput()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 3. Equality of pallet id
    if (this._selectedOrderProduct.palletId !== this.palletInput.value) {
      setTimeout(() => this.palletInput.select(), 100)
      throw new Error(i18next.t('text.wrong_pallet_id'))
    }

    // 4. to pallet id existing
    if (!this.toPalletInput.value) {
      this._focusOnToPalletInput()
      throw new Error(i18next.t('text.to_pallet_id_is_empty'))
    }

    // 5. qty existing
    if (!this.qtyInput.value) {
      this._focusOnQtyInput()
      throw new Error(i18next.t('text.qty_is_empty'))
    }

    if (parseInt(this.qtyInput.value) > this._selectedOrderProduct.qty) {
      this._focusOnQtyInput()
      throw new Error(i18next.t('text.qty_exceed_limit'))
    }
  }

  async _fetchLocations(zone, row, column) {
    const filters = [
      {
        name: 'zone',
        operator: 'eq',
        value: zone
      },
      {
        name: 'row',
        operator: 'eq',
        value: row
      },
      {
        name: 'column',
        operator: 'eq',
        value: column
      }
    ]

    if (filters) {
      const response = await client.query({
        query: gql`
        query {
          locations(${gqlBuilder.buildArgs({
            filters
          })}) {
            items {
              id
              name
              zone
              row
              column
              shelf
              status
            }
          }
        }
      `
      })

      if (!response.errors) {
        return response.data.locations.items || []
      }
    }
  }

  async _undoPutaway() {
    try {
      if (!this._selectedOrderProduct) throw new Error(i18next.t('text.there_is_no_selected_items'))

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.undo_putaway'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            undoPutaway(${gqlBuilder.buildArgs({
              worksheetDetailName: this._selectedOrderProduct.name,
              palletId: this._selectedOrderProduct.palletId
            })})
          }
        `
      })

      if (!response.errors) {
        this._fetchProducts(this.arrivalNoticeNo)
        this._focusOnPalletInput()
        this._selectedTaskStatus = null
        this._selectedOrderProduct = null
        this.palletInput.value = ''
        this.locationInput.value = ''
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _completeHandler() {
    if (!this.data.records.every(record => record.completed)) return
    this._updateContext()
    const result = await CustomAlert({
      title: i18next.t('title.putaway'),
      text: i18next.t('text.do_you_want_to_complete'),
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (result.value) this._complete()
  }

  async _complete() {
    const response = await client.query({
      query: gql`
        mutation {
          completePutaway(${gqlBuilder.buildArgs({
            arrivalNoticeNo: this.arrivalNoticeNo
          })})
        }
      `
    })

    if (!response.errors) {
      this._clearView()
      await CustomAlert({
        title: i18next.t('title.completed'),
        text: i18next.t('text.putaway_completed'),
        confirmButton: { text: i18next.t('button.confirm') }
      })
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

window.customElements.define('putaway-product', PutawayProduct)
