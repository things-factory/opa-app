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

class ReturnProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      releaseGoodNo: String,
      config: Object,
      data: Object,
      _productName: String,
      _selectedTaskStatus: String,
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
      title: i18next.t('title.return')
    }
  }

  get releaseGoodNoInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=releaseGoodNo]').shadowRoot.querySelector('input')
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
          <label>${i18next.t('label.release_good_no')}</label>
          <barcode-scanable-input
            name="releaseGoodNo"
            custom-input
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.releaseGoodNoInput.value) {
                  this._fetchProducts(this.releaseGoodNoInput.value)
                }
                this.releaseGoodNoInput.value = ''
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('label.release_good_no')}: ${this.releaseGoodNo}`}</legend>

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
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.return')}</h2>
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
            @keypress="${async e => {
              if (e.keyCode === 13) {
                await this._returning()
              }
            }}"
          >
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

              <label>${i18next.t('label.previous_location')}</label>
              <input name="location" readonly />
            </fieldset>

            <fieldset>
              ${this.scannable
                ? html`
                    <legend>${i18next.t('title.input_section')}</legend>
                    <label>${i18next.t('label.pallet_barcode')}</label>
                    <barcode-scanable-input name="palletId" custom-input></barcode-scanable-input>

                    <label>${i18next.t('label.location')}</label>

                    ${!this.incompleteLocationName
                      ? html` <barcode-scanable-input name="locationCode" custom-input></barcode-scanable-input> `
                      : html`
                          <select
                            name="newLocationCode"
                            @change="${e => (this.locationInput.value = e.currentTarget.value)}"
                          >
                            <option value="">-- ${i18next.t('text.please_select_the_location')} --</option>
                            ${(this.locations || []).map(
                              location =>
                                html`
                                  <option value="${location && location.name}"></option>
                                    ${location && location.name}
                                    ${location && location.status ? ` (${location && location.status})` : ''}
                                  </option>
                                `
                            )}
                          </select>
                        `}
                  `
                : ''}
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
    this.releaseGoodNo = ''
    this._selectedOrderProduct = null
    this._selectedTaskStatus = null
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
      list: { fields: ['palletId', 'batchId', 'qty'] },
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
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnReleaseGoodField()
    }
  }

  _updateContext() {
    this.incompleteLocationName = false
    let actions = []
    if (this.completed) {
      actions = [{ title: i18next.t('button.complete'), action: this._completeHandler.bind(this) }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.return'),
        actions
      }
    })
  }

  _focusOnReleaseGoodField() {
    setTimeout(() => this.releaseGoodNoInput.focus(), 100)
  }

  _focusOnPalletInput() {
    setTimeout(() => this.palletInput.focus(), 100)
  }

  _focusOnLocationInput() {
    setTimeout(() => this.locationInput.focus(), 100)
  }

  async _fetchProducts(releaseGoodNo) {
    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          returnWorksheet(${gqlBuilder.buildArgs({
            releaseGoodNo
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
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.releaseGoodNo = releaseGoodNo
      this._fillUpForm(this.infoForm, response.data.returnWorksheet.worksheetInfo)

      this.data = {
        records: response.data.returnWorksheet.worksheetDetailInfos.map(record => {
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
    this.releaseGoodNo = ''
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

  async _returning(e) {
    try {
      await this._validateReturning()
      if (!this.incompleteLocationName) {
        const response = await client.query({
          query: gql`
            mutation {
              returning(${gqlBuilder.buildArgs({
                worksheetDetailName: this._selectedOrderProduct.name,
                palletId: this.palletInput.value,
                toLocation: this.locationInput.value
              })})
            }
          `
        })

        if (!response.errors) {
          this._fetchProducts(this.releaseGoodNo)
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

  async _validateReturning() {
    // 1. validate for order selection
    if (!this._selectedOrderProduct) throw new Error(i18next.t('text.target_is_not_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnPalletInput()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 3. location code existing
    if (!this.locationInput.value) {
      this._focusOnLocationInput()
      throw new Error(i18next.t('text.location_code_is_empty'))
    }

    // 4. check for completeness of location input
    else if (this.locationInput.value) {
      const locationNameSplit = this.locationInput.value.split('-')

      if (locationNameSplit.length === 3) {
        const zonePortions = locationNameSplit[0].match(/[a-zA-Z0-9]+/g)
        const rowPortions = locationNameSplit[1].match(/[a-zA-Z0-9]+/g)
        const columnPortions = locationNameSplit[2].match(/[a-zA-Z0-9]+/g)

        this.incompleteLocationName = true
        this.locations = await this._fetchLocations(zonePortions[0], rowPortions[0], columnPortions[0])
        this._focusOnNewLocationInput()
        throw new Error(i18next.t('text.please_select_the_location_again'))
      } else if (locationNameSplit.length === 4) {
        this.incompleteLocationName = false
      }
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

  async _completeHandler() {
    if (!this.data.records.every(record => record.completed)) return
    this._updateContext()
    const result = await CustomAlert({
      title: i18next.t('text.return'),
      text: i18next.t('text.do_you_want_to_complete'),
      confirmButton: { text: i18next.t('text.yes') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (result.value) this._complete()
  }

  async _complete() {
    const response = await client.query({
      query: gql`
        mutation {
          completeReturn(${gqlBuilder.buildArgs({
            releaseGoodNo: this.releaseGoodNo
          })})
        }
      `
    })

    if (!response.errors) {
      await CustomAlert({
        title: i18next.t('text.return'),
        text: i18next.t('text.your_work_has_completed'),
        confirmButton: { text: i18next.t('text.yes') }
      })

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

window.customElements.define('return-product', ReturnProduct)
