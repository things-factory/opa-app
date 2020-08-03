import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { ORDER_PRODUCT_STATUS } from '../order/constants'

class PreunloadProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      arrivalNoticeNo: String,
      config: Object,
      data: Object,
      editable: Boolean,
      _productName: String,
      _palletQty: Number,
      _isDifferent: Boolean,
      _hasBatchAdjustment: Boolean,
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
      title: i18next.t('title.adjustment')
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

  get _adjustedBatchId() {
    return this.shadowRoot.querySelector('input[name=adjustedBatchId]')
  }

  get _adjustedPalletQty() {
    return this.shadowRoot.querySelector('input[name=adjustedPalletQty]')
  }

  get _palletQty() {
    return this.shadowRoot.querySelector('input[name=palletQty]')
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

          <label>${i18next.t('label.staging_area')}</label>
          <input name="bufferLocation" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.adjustment')}</h2>
          <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .data=${this.data}
          ></data-grist>
        </div>

        <div class="right-column">
          <form
            id="input-form"
            class="single-column-form"
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this._preunload()
              }
            }}"
          >
            <fieldset>
              <legend>${i18next.t('label.product')}: ${this._productName}</legend>

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" readonly />

              <label ?hidden="${!this._hasBatchAdjustment}">${i18next.t('label.new_batch_id')}</label>
              <input ?hidden="${!this._hasBatchAdjustment}" name="newBatchId" readonly />

              <label>${i18next.t('label.packing_type')}</label>
              <input name="packingType" readonly />

              <label>${i18next.t('label.pack_qty')}</label>
              <input name="packQty" readonly />

              <label>${i18next.t('label.pallet_qty')}</label>
              <input name="palletQty" readonly />

              <label>${i18next.t('label.status')}</label>
              <input name="status" readonly />
            </fieldset>

            <fieldset>
              <legend style="display: ${this.editable ? 'flex' : 'none'}">${i18next.t('title.inspection')}</legend>
              <label style="display: ${this.editable ? 'flex' : 'none'}">${i18next.t('label.adjust_pallet_qty')}</label>
              <input style="display: ${this.editable ? 'flex' : 'none'}" name="adjustedPalletQty" type="number" />

              <label ?hidden="${!this._isDifferent}">${i18next.t('label.new_batch_id')}</label>
              <input name="adjustedBatchId" ?hidden="${!this._isDifferent}" />

              <input
                type="checkbox"
                name="differentBatch"
                style="display: ${this.editable ? 'flex' : 'none'}"
                @change="${e => {
                  this._isDifferent = e.currentTarget.checked
                }}"
              />
              <label style="display: ${this.editable ? 'flex' : 'none'}">${i18next.t('label.diff_batch_id')}</label>
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
    this._isDifferent = false
    this._hasBatchAdjustment = false
    this._selectedOrderProduct = null
    this._selectedTaskStatus = null
  }

  get editable() {
    return this._selectedTaskStatus && this._selectedTaskStatus === ORDER_PRODUCT_STATUS.READY_TO_UNLOAD.value
  }

  get completed() {
    return this.data.records.every(record => record.completed)
  }

  updated(changedProps) {
    if (changedProps.has('_selectedTaskStatus') && this._selectedTaskStatus) {
      this._updateContext()
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

              this._selectedOrderProduct = {
                ...record,
                newBatchId: record?.adjustedBatchId ? record.adjustedBatchId : null
              }
              this._selectedTaskStatus = null
              this._selectedTaskStatus = record.status
              this._productName = `${record.product.name} ${
                record.product.description ? `(${record.product.description})` : ''
              }`

              if (record?.adjustedBatchId) this._hasBatchAdjustment = true
              if (record?.palletQty) this._adjustedPalletQty.value = record.palletQty

              this._fillUpForm(this.inputForm, this._selectedOrderProduct)
              this._focusOnPalletQtyInput()
            }
          }
        }
      },
      pagination: { infinite: true },
      list: { fields: ['completed', 'product', 'batchId', 'qty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'completed',
          header: i18next.t('field.completed'),
          width: 40
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 200
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 140
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { align: 'center' },
          width: 80
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
    let actions = []
    if (
      this._selectedTaskStatus === ORDER_PRODUCT_STATUS.INSPECTED.value ||
      this._selectedTaskStatus === ORDER_PRODUCT_STATUS.PENDING_APPROVAL.value
    ) {
      actions = [...actions, { title: i18next.t('button.undo'), action: this._undoPreunload.bind(this) }]
    }

    if (this.completed) {
      actions = [...actions, { title: i18next.t('button.complete'), action: this._completeHandler.bind(this) }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.adjustment'),
        actions
      }
    })
  }

  _focusOnArrivalNoticeField() {
    setTimeout(() => this.arrivalNoticeNoInput.focus(), 100)
  }

  _focusOnPalletQtyInput() {
    setTimeout(() => this._adjustedPalletQty.focus(), 100)
  }

  _focusOnAdjustedBatchIdInput() {
    setTimeout(() => this._adjustedBatchId.focus(), 100)
  }

  async _fetchProducts(arrivalNoticeNo) {
    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          preunloadWorksheet(${gqlBuilder.buildArgs({
            arrivalNoticeNo
          })}) {
            worksheetInfo {
              bizplaceName
              refNo
              startedAt
              bufferLocation
            }
            worksheetDetailInfos {
              name
              batchId
              product {
                name
                description
              }
              packQty
              palletQty
              adjustedBatchId
              adjustedPalletQty
              status
              description
              targetName
              packingType
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.arrivalNoticeNo = arrivalNoticeNo
      this._fillUpForm(this.infoForm, response.data.preunloadWorksheet.worksheetInfo)

      this.data = {
        records: response.data.preunloadWorksheet.worksheetDetailInfos
          .map(record => {
            return {
              ...record,
              completed: record.status !== ORDER_PRODUCT_STATUS.READY_TO_UNLOAD.value,
              palletQty: record?.adjustedPalletQty ? record.adjustedPalletQty : record.palletQty
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
    this.arrivalNoticeNo = ''
    this._selectedOrderProduct = null
    this._selectedTaskStatus = null
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

  async _preunload(e) {
    try {
      await this._validatePreunload()
      const response = await client.query({
        query: gql`
            mutation {
              preunload(${gqlBuilder.buildArgs({
                worksheetDetailName: this._selectedOrderProduct.name,
                adjustedBatchId: this._isDifferent ? this._adjustedBatchId.value : null,
                adjustedPalletQty: Math.round(parseInt(this._adjustedPalletQty.value)),
                palletQty: parseInt(this._palletQty.value)
              })})
            }
          `
      })

      if (!response.errors) {
        this._fetchProducts(this.arrivalNoticeNo)
        this._focusOnPalletQtyInput()
        this._updateContext()
        this._selectedTaskStatus = null
        this._selectedOrderProduct = null
        this._adjustedBatchId.value = null
        this._adjustedPalletQty.value = null
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _validatePreunload() {
    // 1. validate for order selection
    if (!this._selectedOrderProduct) throw new Error(i18next.t('text.target_doesnt_selected'))

    // 2. pallet qty cannot be null
    if (!this._adjustedPalletQty.value) {
      this._focusOnPalletQtyInput()
      throw new Error(i18next.t('text.pallet_qty_is_empty'))
    }

    // 2. pallet qty cannot be null
    if (this._adjustedPalletQty.value < 0) {
      this._focusOnPalletQtyInput()
      this._adjustedPalletQty.value = null
      throw new Error(i18next.t('text.invalid_pallet_qty'))
    }

    // 3. if different batch no is ticked, must have value in new batch no field
    if (this._isDifferent && !this._adjustedBatchId.value) {
      this._focusOnAdjustedBatchIdInput()
      throw new Error(i18next.t('text.new_batch_id_is_empty'))
    }
  }

  async _undoPreunload() {
    try {
      if (!this._selectedOrderProduct) throw new Error(i18next.t('text.there_is_no_selected_items'))

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.undo_preunload'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            undoPreunload(${gqlBuilder.buildArgs({
              worksheetDetailName: this._selectedOrderProduct.name
            })})
          }
        `
      })

      if (!response.errors) {
        this._fetchProducts(this.arrivalNoticeNo)
        this._focusOnPalletQtyInput()
        this._updateContext()
        this._selectedTaskStatus = null
        this._selectedOrderProduct = null
        this._adjustedPalletQty.value = null
        this._adjustedBatchId.value = null
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _completeHandler() {
    if (!this.data.records.every(record => record.completed)) return
    this._updateContext()
    const result = await CustomAlert({
      title: i18next.t('title.preunload'),
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
          completePreunload(${gqlBuilder.buildArgs({
            arrivalNoticeNo: this.arrivalNoticeNo
          })})
        }
      `
    })

    if (!response.errors) {
      this._clearView()
      this.arrivalNoticeNoInput.value = null
      this._showToast({ message: i18next.t('text.preunload_has_completed') })
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

window.customElements.define('preunload-product', PreunloadProduct)
