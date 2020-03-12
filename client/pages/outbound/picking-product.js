import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { fetchLocationSortingRule } from '../../fetch-location-sorting-rule'
import { WORKSHEET_STATUS } from '../inbound/constants/worksheet'
import './outbound-reusable-pallet'

class PickingProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      releaseGoodNo: String,
      config: Object,
      data: Object,
      _productName: String,
      _selectedTaskStatus: String,
      _reusablePalletList: Object,
      isWholePicking: Boolean
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
      title: i18next.t('title.picking')
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
    return this.shadowRoot.querySelector('barcode-scanable-input[name=locationName]').shadowRoot.querySelector('input')
  }

  get releaseQtyInput() {
    return this.shadowRoot.querySelector('input[name=confirmedQty]')
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
                  this._fetchInventories(this.releaseGoodNoInput.value)
                  this._fetchPalletsHandler(this.releaseGoodNoInput.value)
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.release_order')}: ${this.releaseGoodNo}`}</legend>

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
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.picking')}</h2>
          <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .data=${this.data}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form" @keypress="${this._picking.bind(this)}">
            <fieldset>
              <legend>${i18next.t('label.product')}: ${this._productName}</legend>

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.packing_type')}</label>
              <input name="packingType" readonly />

              <label>${i18next.t('label.current_location')}</label>
              <input name="location" readonly />

              <label>${i18next.t('label.release_qty')}</label>
              <input name="releaseQty" readonly />

              <label>${i18next.t('label.comment')}</label>
              <input name="description" readonly />
            </fieldset>

            <fieldset ?hidden=${this.releaseGoodNo == ''}>
              <legend>${i18next.t('title.reusable_pallet')}</legend>
              <div class="reusable_pallet" @click="${this._openPalletOutbound.bind(this)}">
                <mwc-icon>apps</mwc-icon>Reusable Pallets
              </button>
            </fieldset>

            <fieldset ?hidden=${!this.scannable}>
              <legend>${i18next.t('title.input_section')}</legend>
              <label>${i18next.t('label.pallet_barcode')}</label>
              <barcode-scanable-input name="palletId" custom-input></barcode-scanable-input>

              <label>${i18next.t('label.picked_qty')}</label>
              <input type="number" min="1" name="confirmedQty" />

              ${
                this.isWholePicking
                  ? ''
                  : html`
                      <label>${i18next.t('label.return_location')}</label>
                      <barcode-scanable-input name="locationName" custom-input></barcode-scanable-input>
                    `
              }
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
    this._selectedOrderInventory = null
    this._selectedTaskStatus = null
    this._reusablePalletList = { records: [] }
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
              this.isWholePicking = this._selectedOrderInventory.releaseQty === this._selectedOrderInventory.qty

              this._fillUpForm(this.inputForm, record)
              this._focusOnInput(this.palletInput)
            }
          }
        }
      },
      pagination: { infinite: true },
      list: { fields: ['completed', 'locationName', 'palletId', 'batchId', 'releaseQty'] },
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
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { align: 'center' },
          width: 80
        }
      ]
    }

    this.locationSortingRules = await fetchLocationSortingRule()
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnInput(this.releaseGoodNoInput)
    }
  }

  _updateContext() {
    let actions = []
    if (this.completed) {
      actions = [{ title: i18next.t('button.complete'), action: this._complete.bind(this) }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.picking'),
        actions
      }
    })
  }

  _focusOnInput(target) {
    setTimeout(() => target.focus(), 100)
  }

  async _fetchInventories(releaseGoodNo) {
    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          pickingWorksheet(${gqlBuilder.buildArgs({
            releaseGoodNo,
            locationSortingRules: this.locationSortingRules
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
              releaseQty
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
      this._fillUpForm(this.infoForm, response.data.pickingWorksheet.worksheetInfo)

      this.data = {
        records: response.data.pickingWorksheet.worksheetDetailInfos.map(record => {
          return {
            ...record,
            completed: record.status === WORKSHEET_STATUS.DONE.value,
            locationName: record.location.name
          }
        })
      }

      this._completeHandler()
    }
  }

  async _fetchPalletsHandler(releaseGoodNo) {
    const response = await client.query({
      query: gql`
        query {
          pallets(${gqlBuilder.buildArgs({
            filters: [{ name: 'refOrderNo', value: releaseGoodNo, operator: 'eq' }],
            pagination: { page: 1, limit: 9999999 }
          })}) {
            items {
              id
              name
              owner {
                id
                name
                description
              }
              holder {
                id
                name
                description
              }
              status
            }
          }
      `
    })

    if (!response.errors) {
      this._reusablePalletList = { records: response.data.pallets.items }
    }
  }

  _clearView() {
    this.data = { records: [] }
    this.infoForm.reset()
    this.inputForm.reset()
    this._productName = ''
    this.releaseGoodNo = ''
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

  async _picking(e) {
    if (e.keyCode === 13) {
      try {
        this._validatePicking()

        const locationName = this.isWholePicking ? this._selectedOrderInventory.location.name : this.locationInput.value
        // 1. Check whether location is changed
        if (this._selectedOrderInventory.location.name !== locationName) {
          const result = await CustomAlert({
            title: i18next.t('title.relocate'),
            text: i18next.t('text.are_you_sure'),
            confirmButton: { text: i18next.t('button.relocate') },
            cancelButton: { text: i18next.t('button.cancel') }
          })

          if (!result.value) {
            return
          }
        }

        const response = await client.query({
          query: gql`
              mutation {
                picking(${gqlBuilder.buildArgs({
                  worksheetDetailName: this._selectedOrderInventory.name,
                  palletId: this.palletInput.value,
                  locationName,
                  releaseQty: parseInt(this.releaseQtyInput.value)
                })})
              }
            `
        })

        if (!response.errors) {
          this._fetchInventories(this.releaseGoodNo)
          this._focusOnInput(this.palletInput)
          this._selectedTaskStatus = null
          this._selectedOrderInventory = null
          this.palletInput.value = ''
          this.releaseQtyInput.value = ''
          this.locationInput.value = ''
        }
      } catch (e) {
        this._showToast(e)
      }
    }
  }

  _validatePicking() {
    // 1. validate for order selection
    if (!this._selectedOrderInventory) throw new Error(i18next.t('text.target_doesnt_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnInput(this.palletInput)
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 3. Equality of pallet id
    if (this._selectedOrderInventory.palletId !== this.palletInput.value) {
      setTimeout(() => this.palletInput.select(), 100)
      throw new Error(i18next.t('text.wrong_pallet_id'))
    }

    // 4. Release qty existing
    if (!parseInt(this.releaseQtyInput.value)) {
      this._focusOnInput(this.releaseQtyInput)
      throw new Error(i18next.t('text.release_qty_is_empty'))
    }

    // 5. typed qty should be matched with release qty.
    if (parseInt(this.releaseQtyInput.value) !== this._selectedOrderInventory.releaseQty) {
      setTimeout(() => this.releaseQtyInput.select(), 100)
      throw new Error(i18next.t('text.wrong_release_qty'))
    }

    // 6. location id existing
    if (!this.isWholePicking && !this.locationInput.value) {
      this._focusOnInput(this.locationInput)
      throw new Error(i18next.t('text.location_id_is_empty'))
    }

    if (!this.releaseQtyInput.checkValidity()) throw new Error(i18next.t('text.release_qty_invalid'))
  }

  async _completeHandler() {
    if (!this.data.records.every(record => record.completed)) return
    this._updateContext()
    const result = await CustomAlert({
      title: i18next.t('title.picking'),
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
          completePicking(${gqlBuilder.buildArgs({
            releaseGoodNo: this.releaseGoodNo
          })})
        }
      `
    })

    if (!response.errors) {
      this._clearView()
      const result = await CustomAlert({
        title: i18next.t('title.picking'),
        text: i18next.t('text.picking_is_completed'),
        confirmButton: { text: i18next.t('button.confirm') }
      })

      this._clearView()
      navigate('outbound_worksheets')
    }
  }

  _openPalletOutbound() {
    openPopup(
      html`
        <outbound-reusable-pallet
          .palletData="${this._reusablePalletList}"
          .releaseGoodNo="${this.releaseGoodNo}"
          @reusable-pallet-info="${e => {
            this._reusablePalletList = e.detail
          }}"
        ></outbound-reusable-pallet>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.outbound_reusable_pallet')
      }
    )
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

window.customElements.define('picking-product', PickingProduct)
