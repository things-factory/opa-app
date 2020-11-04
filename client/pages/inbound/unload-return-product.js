import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/popup-note'
import '../components/popup-unloading'
import { PALLET_STATUS } from '../constants'

class UnloadReturnProduct extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _returnOrderNo: String,
      _palletId: String,
      _productName: String,
      orderInventoryConfig: Object,
      orderInventoryData: Object,
      palletProductConfig: Object,
      palletProductData: Object,
      _selectedOrderInventory: Object,
      _selectedInventory: Object,
      _unloadedInventories: Array,
      _isReusablePallet: Boolean,
      _reusablePalletId: Array,
      _reusablePalletIdData: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          overflow: hidden;
          flex: 1;
        }
        .left-column {
          overflow: hidden;
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        .right-column {
          overflow: auto;
          display: flex;
          flex: 1;
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
      title: i18next.t('title.unloading')
    }
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get orderInventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#order-inventory-grist')
  }

  get palletProductGrist() {
    return this.shadowRoot.querySelector('data-grist#pallet-product-grist')
  }

  get returnOrderNoInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=returnOrderNo]').shadowRoot.querySelector('input')
  }

  get palletInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=palletId]').shadowRoot.querySelector('input')
  }

  get actualQtyInput() {
    return this.shadowRoot.querySelector('input[name=qty]')
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.return_order_no')}</label>
          <barcode-scanable-input
            name="returnOrderNo"
            custom-input
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (this.returnOrderNoInput.value) {
                  this._clearView()
                  this._fetchInventory(this.returnOrderNoInput.value)
                  this.returnOrderNoInput.value = ''
                }
              }
            }}"
          ></barcode-scanable-input>
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.return_order')}: ${this._returnOrderNo}`}</legend>

          <label>${i18next.t('label.customer')}</label>
          <input name="bizplaceName" readonly />

          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label>${i18next.t('label.staging_area')}</label>
          <input name="bufferLocation" readonly />

          <label>${i18next.t('label.started_at')}</label>
          <input name="startedAt" type="datetime-local" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.unloading')}</h2>
          <data-grist
            id="order-inventory-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.orderInventoryConfig}
            .data=${this.orderInventoryData}
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.unloaded')}</h2>
          <data-grist
            id="pallet-product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.palletProductConfig}
            .data=${this.palletProductData}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('title.product')}: ${this._productName}</legend>

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.description')}</label>
              <input name="description" readonly />

              <label>${i18next.t('label.packing_type')}</label>
              <input name="packingType" readonly />

              <label>${i18next.t('label.total_pallet_qty')}</label>
              <input name="palletQty" type="number" readonly />

              <label>${i18next.t('label.total_pack_qty')}</label>
              <input name="packQty" type="number" readonly />
            </fieldset>

            <fieldset>
              <legend>${i18next.t('title.input_section')}</legend>

              <label>${i18next.t('label.pallet_id')}</label>
              <barcode-scanable-input
                name="palletId"
                .value=${this._palletId}
                without-enter
                custom-input
                @keypress="${this._checkReusablePallet.bind(this)}"
              ></barcode-scanable-input>

              <label>${i18next.t('label.actual_qty')}</label>
              <input name="qty" type="number" min="1" @keypress="${this._checkReusablePallet.bind(this)}" required />
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this._isReusablePallet = false
    this._returnOrderNo = ''
    this._productName = ''
    this.orderInventoryData = { records: [] }
    this.reusablePalletIdData = { records: [] }
  }

  updated(changedProps) {
    if (
      changedProps.has('_returnOrderNo') ||
      changedProps.has('_selectedOrderInventory') ||
      changedProps.has('_selectedInventory') ||
      changedProps.has('_unloadedInventories')
    ) {
      this._updateContext()
    }
  }

  _updateContext() {
    let actions = []
    if (this._selectedOrderInventory && !this._selectedOrderInventory.validity) {
      actions = [...actions, { title: i18next.t('button.issue'), action: this._openIssueNote.bind(this) }]
    }

    if (this._unloadedInventories && this._unloadedInventories.length > 0) {
      if (this.orderInventoryData.records.some(task => !task.validity)) {
        actions = [
          ...actions,
          { title: i18next.t('button.partial_complete'), action: this._completePartially.bind(this) }
        ]
      }
    }

    if (this._selectedInventory) {
      actions = [...actions, { title: i18next.t('button.undo'), action: this._undoUnloading.bind(this) }]
    }

    if (this._returnOrderNo) {
      actions = [...actions, { title: i18next.t('button.complete'), action: this._complete.bind(this) }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.unloading'),
        actions
      }
    })
  }

  pageInitialized() {
    this.orderInventoryConfig = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.batchId) {
              this._selectedOrderInventory = record
              this._selectedInventory = null
              this._productName = `${record.product.name} ${
                record.product.description ? `(${record.product.description})` : ''
              }`

              this.inputForm.reset()
              this.palletInput.value = ''
              this._fillUpInputForm(record)
              this._fetchInventories()
              this._focusOnPalletInput()
            }
          }
        }
      },
      pagination: {
        infinite: true
      },
      list: { fields: ['batchId', 'palletId', 'palletQty', 'actualPalletQty', 'packQty', 'actualPackQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'validity',
          header: i18next.t('field.validity'),
          width: 40
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          width: 150
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          width: 200
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          width: 200
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.total_pack_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'integer',
          name: 'actualPackQty',
          header: i18next.t('field.actual_pack_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'string',
          name: 'issue',
          header: i18next.t('field.issue'),
          width: 100
        }
      ]
    }

    this.palletProductConfig = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record.reusablePallet) {
              this._openPopupUnloading(record.reusablePallet.name, this.orderInventoryData, {
                records: this.palletProductData.records.filter(item => record.reusablePallet == item.reusablePallet)
              })
            } else {
              if (record && record.palletId && this._selectedOrderInventory) {
                this._selectedInventory = record
                this.palletInput.value = record.palletId
                this.actualQtyInput.value = record.qty
              }
            }
          }
        }
      },
      list: { fields: ['palletId', 'qty'] },
      pagination: {
        infinite: true
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet'),
          width: 240
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.actual_pack_qty'),
          record: { align: 'center' },
          width: 80
        }
      ]
    }
  }

  pageUpdated() {
    if (this.active) {
      this._focusOnReturnOrderField()
    }
  }

  async _fetchInventory(returnOrderNo) {
    const response = await client.query({
      query: gql`
        query {
          unloadingReturnWorksheet(${gqlBuilder.buildArgs({
            returnOrderNo
          })}) {
            worksheetInfo {
              bizplaceName
              containerNo
              refNo
              bufferLocation
              startedAt
            }
            worksheetDetailInfos {
              batchId
              palletId
              product {
                id
                name
                description
              }
              name
              targetName
              description
              packingType
              palletQty
              actualPalletQty
              packQty
              actualPackQty
              issue
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._returnOrderNo = returnOrderNo
      this._fillUpInfoForm(response.data.unloadingReturnWorksheet.worksheetInfo)

      this.orderInventoryData = {
        records: response.data.unloadingReturnWorksheet.worksheetDetailInfos.map(worksheetDetailInfo => {
          return {
            ...worksheetDetailInfo,
            validity:
              worksheetDetailInfo.actualPackQty === worksheetDetailInfo.packQty
          }
        })
      }
    }
  }

  async _fetchInventories() {
    if (!this._selectedOrderInventory.name) return

    const response = await client.query({
      query: gql`
        query {
          unloadedInventories(${gqlBuilder.buildArgs({
            worksheetDetailName: this._selectedOrderInventory.name
          })}) {
            batchId
            palletId
            qty
            reusablePallet {
              id
              name
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._unloadedInventories = response.data.unloadedInventories
      this._selectedInventory = null
      this.palletProductData = {
        records: this._unloadedInventories
      }

      this.palletProductData = {
        records: this.palletProductData.records.map(palletProduct => {
          if (palletProduct.reusablePallet) {
            return {
              ...palletProduct,
              reusablePalletName: palletProduct.reusablePallet.name
            }
          } else {
            return {
              ...palletProduct,
              reusablePalletName: ''
            }
          }
        })
      }

      this.orderInventoryData = {
        records: this.orderInventoryData.records.map(orderInventory => {
          if (orderInventory.batchId === this._unloadedInventories.batchId) {
            orderInventory.actualPalletQty = this._unloadedInventories.length
            orderInventory.actualTotalPackQty = this._unloadedInventories
              .map(inventory => inventory.qty)
              .reduce((a, b) => a + b, 0)
          }

          return orderInventory
        })
      }
    }
  }

  _clearView() {
    this.orderInventoryData = { records: [] }
    this.palletProductData = { records: [] }
    this.infoForm.reset()
    this.inputForm.reset()
    this.palletInput.value = ''
    this.actualQtyInput.value = ''
    this._productName = ''
    this._selectedOrderInventory = null
    this._selectedInventory = null
    this._unloadedInventories = null
    this._updateContext()
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
          field.value = data[key]
        }
      })
    }
  }

  _fillUpInputForm(data) {
    this.inputForm.reset()
    for (let key in data) {
      Array.from(this.inputForm.querySelectorAll('input, textarea')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  async _unload(e) {
    if (e.keyCode === 13) {
      try {
        this._validateUnloading()
        const response = await client.query({
          query: gql`
            mutation {
              unloadReturn(${gqlBuilder.buildArgs({
                worksheetDetailName: this._selectedOrderInventory.name,
                inventory: {
                  palletId: this.palletInput.value.trim(),
                  qty: parseInt(this.actualQtyInput.value)
                }
              })})
            }
          `
        })

        if (!response.errors) {
          this.palletInput.value = ''
          this.actualQtyInput.value = ''

          await this._fetchInventory(this._returnOrderNo)
          await this._fetchInventories()
          this._focusOnPalletInput()
        }
      } catch (e) {
        this._showToast({ message: e.message })
      }
    }
  }

  _validateUnloading() {
    // 1. validate for order selection
    if (!this._selectedOrderInventory) throw new Error(i18next.t('text.target_does_not_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnPalletInput()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 4. qty value existing
    if (!parseInt(this.actualQtyInput.value)) {
      this._focusOnActualQtyInput()
      throw new Error(i18next.t('text.qty_is_empty'))
    }

    // 5. qty value has to be positive
    if (!(parseInt(this.actualQtyInput.value) > 0)) {
      setTimeout(() => this.actualQtyInput.select(), 100)
      throw new Error(i18next.t('text.qty_should_be_positive'))
    }
  }

  _openPopupUnloading(reusablePallet, unloadingData, unloadedData) {
    openPopup(
      html`
        <popup-unloading
          .title="${i18next.t('title.unloading_with_reusable_pallet')}"
          .returnOrderNo="${this._returnOrderNo}"
          ._productName="${this._productName}"
          .reusablePallet="${reusablePallet}"
          .unloadingGristData="${unloadingData}"
          .unloadedGristData="${unloadedData}"
          .reusablePalletData="${this.reusablePalletIdData}"
          ._selectedOrderInventory="${this._selectedOrderInventory}"
          @unloading-pallet="${e => {
            this.orderInventoryData = e.detail
          }}"
          @unloaded-pallet="${e => {
            this.palletInventoryData = { records: [] }
          }}"
        ></popup-unloading>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.unloading_with_reusable_pallet')
      }
    )
  }

  _openIssueNote() {
    openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.issue')}"
          .value="${this._selectedOrderInventory.issue}"
          @submit="${async e => {
            this.orderInventoryData = {
              records: this.orderInventoryData.records.map(record => {
                if (record.name === this._selectedOrderInventory.name) record.issue = e.detail.value
                return record
              })
            }
            this._selectedOrderInventory.issue = e.detail.value
          }}"
        ></popup-note>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.unloading_issue')
      }
    )
  }

  async _completePartially() {
    try {
      this._validateCompletePartially()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.partial_complete'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            completeUnloadReturnPartially(${gqlBuilder.buildArgs({
              returnOrderNo: this._returnOrderNo,
              worksheetDetail: this._getWorksheetDetails().find(wsd => wsd.name === this._selectedOrderInventory.name)
            })})
          }
        `
      })

      if (!response.errors) {
        await CustomAlert({
          title: i18next.t('title.completed'),
          text: i18next.t('text.unloading_completed'),
          confirmButton: { text: i18next.t('button.confirm') }
        })

        this._selectedInventory = null
        this.palletInput.value = ''
        this.actualQtyInput.value = ''
      }
      await this._fetchInventory(this._returnOrderNo)
      await this._fetchInventories()
      this._focusOnPalletInput()
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateCompletePartially() {
    if (!this._selectedOrderInventory) {
      throw new Error('text.target_is_not_selected')
    }

    if (!this._unloadedInventories || this._unloadedInventories.length <= 0) {
      throw new Error('text.nothing_unloaded')
    }

    if (
      this._selectedOrderInventory.actualPackQty > this._selectedOrderInventory.packQty &&
      !this._selectedOrderInventory.issue
    ) {
      throw new Error('there_is_no_issue_noted')
    }

    if (
      this._selectedOrderInventory.actualPackQty > this._selectedOrderInventory.packQty &&
      !this._selectedOrderInventory.issue
    ) {
      throw new Error('there_is_no_issue_noted')
    }
  }

  async _undoUnloading() {
    try {
      this._validateUndo()
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.undo_unloading'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
            mutation {
              undoUnloadReturning(${gqlBuilder.buildArgs({
                worksheetDetailName: this._selectedOrderInventory.name,
                palletId: this._selectedInventory.palletId
              })})
            }
          `
      })

      if (!response.errors) {
        this._selectedInventory = null
        this.palletInput.value = ''
        this.actualQtyInput.value = ''
      }
      await this._fetchInventory(this._returnOrderNo)
      await this._fetchInventories()
      this._focusOnPalletInput()
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateUndo() {
    if (!this._selectedInventory) throw new Error('text.target_does_not_selected')
  }

  async _complete() {
    try {
      this._validateComplete()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.complete_unloading'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            completeUnloadReturning(${gqlBuilder.buildArgs({
              returnOrderNo: this._returnOrderNo,
              worksheetDetails: this._getWorksheetDetails()
            })})
          }
        `
      })

      if (!response.errors) {
        // const havingVas = await this.checkHavingVas(this._arrivalNoticeNo)
        // if (havingVas) {
        //   const result = await CustomAlert({
        //     title: i18next.t('title.completed'),
        //     text: i18next.t('text.unloading_completed'),
        //     confirmButton: { text: i18next.t('button.move_to_x', { state: { x: i18next.t('title.vas') } }) },
        //     cancelButton: { text: i18next.t('button.cancel') }
        //   })

        //   if (!result.value) {
        //     this._arrivalNoticeNo = null
        //     this._clearView()
        //     return
        //   }

        //   let searchParam = new URLSearchParams()
        //   searchParam.append('orderNo', this._arrivalNoticeNo)
        //   searchParam.append('orderType', ARRIVAL_NOTICE.value)

        //   navigate(`execute_vas?${searchParam.toString()}`)
        // } else {
        //   await CustomAlert({
        //     title: i18next.t('title.completed'),
        //     text: i18next.t('text.unloading_completed'),
        //     confirmButton: { text: i18next.t('button.confirm') }
        //   })
        // }

        await CustomAlert({
          title: i18next.t('title.completed'),
          text: i18next.t('text.unloading_completed'),
          confirmButton: { text: i18next.t('button.confirm') }
        })

        this._returnOrderNo = null
        this._clearView()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  // async checkHavingVas(orderNo) {
  //   const response = await client.query({
  //     query: gql`
  //       query {
  //         havingVas(${gqlBuilder.buildArgs({
  //           orderType: ARRIVAL_NOTICE.value,
  //           orderNo
  //         })}) {
  //           id
  //         }
  //       }
  //     `
  //   })

  //   if (!response.errors) {
  //     return Boolean(response.data.havingVas.id)
  //   }
  // }

  async _checkReusablePallet(e) {
    if (e.keyCode === 13) {
      try {
        if (!this._selectedOrderInventory) throw new Error(i18next.t('text.target_is_not_selected'))
        if (!this.palletInput.value) return

        const response = await client.query({
          query: gql`
            query {
              palletByStatus(${gqlBuilder.buildArgs({
                name: this.palletInput.value,
                status: PALLET_STATUS.ACTIVE.value
              })}) {
                id
                name
              }
            }
          `
        })

        if (!response.errors) {
          if (response.data.palletByStatus) {
            // this._reusablePalletId = response.data.pallet
            // this.reusablePalletIdData = [this._reusablePalletId]
            this.reusablePalletIdData = response.data.palletByStatus
            this._isReusablePallet = true
            this._openPopupUnloading(this.palletInput.value, this.orderInventoryData, this.palletProductData)
          } else {
            this._unload(e)
          }
        }
      } catch (e) {
        this._showToast({ message: e.message })
      }
    }
  }

  _validateComplete() {
    if (!this._returnOrderNo) throw new Error(i18next.t('text.there_is_no_return_order_no'))
    if (
      !this.orderInventoryData.records
        .filter(task => task.actualPackQty !== task.packQty)
        .every(task => task.issue)
    )
      throw new Error(i18next.t('text.there_is_no_issue_noted'))
  }

  _getWorksheetDetails() {
    return this.orderInventoryData.records.map(task => {
      return { name: task.name, issue: task.issue ? task.issue : null }
    })
  }

  _focusOnReturnOrderField() {
    setTimeout(() => this.returnOrderNoInput.focus(), 100)
  }

  _focusOnPalletInput() {
    setTimeout(() => this.palletInput.focus(), 100)
  }

  _focusOnActualQtyInput() {
    setTimeout(() => this.actualQtyInput.focus(), 100)
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

window.customElements.define('unload-return-product', UnloadReturnProduct)
