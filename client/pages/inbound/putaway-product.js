import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { WORKSHEET_STATUS } from './constants/worksheet'
import Swal from 'sweetalert2'
import { connect } from 'pwa-helpers/connect-mixin.js'

class PutawayProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      arrivalNoticeNo: String,
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
        }

        .left-column {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .right-column {
          flex: 1;
          overflow: hidden;
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
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.putaway')
    }
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

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.arrival_notice_no')}</label>
          <input
            name="arrivalNoticeNo"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (e.currentTarget.value) this._fetchProducts(e.currentTarget.value)
              }
            }}"
          />
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.arrival_notice')}: ${this.arrivalNoticeNo}`}</legend>

          <label>${i18next.t('label.bizplace')}</label>
          <input name="bizplaceName" readonly />

          <label>${i18next.t('label.startedAt')}</label>
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
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('label.vas')}: ${this._productName}</legend>

              <label>${i18next.t('label.batch_id')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.packing_type')}</label>
              <input name="packingType" readonly />

              <label>${i18next.t('label.to_location')}</label>
              <input name="toLocation" readonly />

              <label>${i18next.t('label.comment')}</label>
              <input name="description" readonly />

              <label>${i18next.t('label.status')}</label>
              <input name="status" readonly />

              <label>${i18next.t('label.current_location')}</label>
              <input name="location" readonly />
            </fieldset>

            <fieldset>
              <legend>${i18next.t('title.input_section')}</legend>

              <label style="display: ${this.scannable ? 'flex' : 'none'}">${i18next.t('label.pallet_barcode')}</label>
              <barcode-scanable-input
                style="display: ${this.scannable ? 'flex' : 'none'}"
                name="palletId"
                .value=${this._pallet}
                @keypress="${this._putaway.bind(this)}"
                custom-input
              ></barcode-scanable-input>

              <label style="display: ${this.scannable ? 'flex' : 'none'}">${i18next.t('label.location')}</label>
              <barcode-scanable-input
                style="display: ${this.scannable ? 'flex' : 'none'}"
                name="locationCode"
                .value=${this._location}
                @keypress="${this._putaway.bind(this)}"
                custom-input
              ></barcode-scanable-input>
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
    this.selectedOrderProduct = null
    this._selectedTaskStatus = null
  }

  get scannable() {
    return this._selectedTaskStatus && this._selectedTaskStatus === WORKSHEET_STATUS.EXECUTING.value
  }

  get cancelable() {
    return this._selectedTaskStatus && this._selectedTaskStatus === WORKSHEET_STATUS.DONE.value
  }

  get completed() {
    return this.data.records.every(record => record.completed)
  }

  updated(changedProps) {
    if (changedProps.has('_selectedTaskStatus') && this._selectedTaskStatus) {
      this.updateContext()
    }
  }

  pageInitialized() {
    this.config = {
      rows: {
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (data.records.length && record) {
              this.selectedOrderProduct = record
              this._selectedTaskStatus = null
              this._selectedTaskStatus = record.status
              this._productName = `${record.product.name} ${
                record.product.description ? `(${record.product.description})` : ''
              }`

              this.inputForm.reset()
              this._fillUpInputForm(record)
              this._focusOnPalletInput()
            }
          }
        }
      },
      pagination: {
        infinite: true
      },
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
          width: 200
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          width: 200
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnArrivalNoticeField()
    }
  }

  updateContext() {
    let actions = []
    if (this.completed) {
      store.dispatch({
        type: UPDATE_CONTEXT,
        context: {
          title: i18next.t('title.vas'),
          actions: [{ title: i18next.t('button.complete'), action: this._complete.bind(this) }]
        }
      })

      return
    }

    if (this.cancelable) {
      actions = [{ title: i18next.t('button.undo'), action: this._undoPutaway.bind(this) }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.vas'),
        actions
      }
    })
  }

  _focusOnArrivalNoticeField() {
    setTimeout(() => this.shadowRoot.querySelector('input[name=arrivalNoticeNo]').focus(), 100)
  }

  _focusOnPalletInput() {
    setTimeout(() => this.palletInput.focus(), 100)
  }

  _focusOnLocationInput() {
    setTimeout(() => this.locationInput.focus(), 100)
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
              status
              description
              targetName
              packingType
              location {
                name
                description
              }
              toLocation {
                name
                description
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.arrivalNoticeNo = arrivalNoticeNo
      this._fillUpInfoForm(response.data.putawayWorksheet.worksheetInfo)

      this.data = {
        records: response.data.putawayWorksheet.worksheetDetailInfos.map(record => {
          return {
            ...record,
            completed: record.status === WORKSHEET_STATUS.DONE.value
          }
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
    this.selectedOrderProduct = null
    this._selectedTaskStatus = null
  }

  _fillUpInfoForm(data) {
    this.infoForm.reset()
    for (let key in data) {
      Array.from(this.infoForm.querySelectorAll('input')).forEach(field => {
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

  _fillUpInputForm(data) {
    this.inputForm.reset()
    for (let key in data) {
      Array.from(this.inputForm.querySelectorAll('input')).forEach(field => {
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

  async _putaway(e) {
    if (e.keyCode === 13) {
      try {
        await this._validatePutaway()
        const response = await client.query({
          query: gql`
            mutation {
              putaway(${gqlBuilder.buildArgs({
                worksheetDetail: {
                  name: this.selectedOrderProduct.name,
                  toLocation: {
                    id: '',
                    name: this.locationInput.value
                  }
                },
                inventory: {
                  palletId: this.palletInput.value
                }
              })})
            }
          `
        })

        if (!response.errors) {
          this._fetchProducts(this.arrivalNoticeNo)
          this._focusOnPalletInput()
          this._selectedTaskStatus = null
          this.selectedOrderProduct = null
          this.palletInput.value = ''
          this.locationInput.value = ''
        }
      } catch (e) {
        this._showToast(e)
      }
    }
  }

  async _undoPutaway() {
    try {
      this._validateUndoPutaway()
      const response = client.query({
        query: gql`
          mutation {
            undoPutaway(${gqlBuilder.buildArgs({
              worksheetDetail: {
                name: this.selectedOrderProduct.name
              },
              inventory: {
                palletId: this.selectedOrderProduct.palletId
              }
            })})
          }
        `
      })

      if (!response.errors) {
        this._fetchProducts(this.arrivalNoticeNo)
        this._focusOnPalletInput()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _validatePutaway() {
    // 1. validate for order selection
    if (!this.selectedOrderProduct) throw new Error(i18next.t('text.target_doesnt_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnPalletInput()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 3. Equality of pallet id
    if (this.selectedOrderProduct.palletId !== this.palletInput.value) {
      setTimeout(() => this.palletInput.select(), 100)
      throw new Error(i18next.t('text.wrong_pallet_id'))
    }

    // 4. location code existing
    if (!this.locationInput.value) {
      this._focusOnLocationInput()
      throw new Error(i18next.t('text.location_code_is_empty'))
    }

    // 5. Equality of location code
    if (this.selectedOrderProduct.toLocation.name !== this.locationInput.value) {
      const result = await Swal.fire({
        title: i18next.t('text.putaway'),
        text: i18next.t('text.unexpected_location'),
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#22a6a7',
        cancelButtonColor: '#cfcfcf',
        confirmButtonText: i18next.t('button.confirm')
      })

      if (!result.value) throw new Error(i18next.t('text.wrong_location_code'))
    }
  }

  _validateUndoPutaway() {
    // 1. validate for order selection
    if (!this.selectedOrderProduct) throw new Error(i18next.t('text.target_doesnt_selected'))

    // 2. validate for status of selected order
    if (this.selectedOrderProduct.status !== WORKSHEET_STATUS.DONE.value)
      throw new Error(i18next.t('text.status_is_not_suitable'))
  }

  async _completeHandler() {
    if (!this.data.records.every(record => record.completed)) return
    this.updateContext()
    const result = await Swal.fire({
      title: i18next.t('text.putaway'),
      text: i18next.t('text.do_you_want_to_complete?'),
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22a6a7',
      cancelButtonColor: '#cfcfcf',
      confirmButtonText: i18next.t('text.yes')
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
