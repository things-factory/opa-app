import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../order/vas-order/vas-create-popup'
import { BATCH_AND_PRODUCT_TYPE, BATCH_NO_TYPE, PRODUCT_TYPE } from '../constants'

class CreateArrivalNotice extends localize(i18next)(PageView) {
  static get properties() {
    return {
      /**
       * @description
       * flag for whether use transportation from warehouse or not.
       * true =>
       */
      _ganNo: String,
      _importedOrder: Boolean,
      _ownTransport: Boolean,
      _hasContainer: Boolean,
      _looseItem: Boolean,
      containerSizes: Array,
      productGristConfig: Object,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object
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
        .container {
          flex: 1;
          display: flex;
          overflow: hidden;
          min-height: 50vh;
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
      title: i18next.t('title.create_arrival_notice'),
      actions: [{ title: i18next.t('button.submit'), action: this._generateArrivalNotice.bind(this) }]
    }
  }

  render() {
    return html`
      <form name="arrivalNotice" class="multi-column-form" autocomplete="off">
        <fieldset>
          <legend>${i18next.t('title.arrival_notice')}</legend>
          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.do_no')}</label>
          <input name="deliveryOrderNo" ?hidden="${!this._ownTransport}" />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
          <input ?hidden="${!this._ownTransport}" name="truckNo" />

          <label>${i18next.t('label.eta_date')}</label>
          <input name="etaDate" type="date" min="${this._getStdDate()}" required />

          <label ?hidden="${!this._hasContainer}">${i18next.t('label.container_no')}</label>
          <input ?hidden="${!this._hasContainer}" type="text" name="containerNo" />

          <label>${i18next.t('label.container_size')}</label>
          <select name="containerSize">
            <option value="">--${i18next.t('label.please_select_a_container_size')}--</option>
            ${(this.containerSizes || []).map(
              containerSize =>
                html`
                  <option value="${containerSize && containerSize.name}">${containerSize && containerSize.name}</option>
                `
            )}
          </select>

          <input
            id="container"
            type="checkbox"
            name="container"
            ?checked="${this._hasContainer}"
            @change="${e => {
              this._hasContainer = e.currentTarget.checked
            }}"
          />
          <label for="container">${i18next.t('label.container')}</label>

          <input id="looseItem" type="checkbox" name="looseItem" ?checked="${this._looseItem}" />
          <label for="looseItem">${i18next.t('label.loose_item')}</label>

          <input
            id="importedOrder"
            type="checkbox"
            name="importCargo"
            ?checked="${this._importedOrder}"
            @change="${e => {
              this._importedOrder = e.currentTarget.checked
              if (this._importedOrder) {
                this._ownTransportInput.checked = true
                this._ownTransport = true
              }
            }}"
          />
          <label for="importedOrder">${i18next.t('label.import_cargo')}</label>

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            @change="${e => (this._ownTransport = e.currentTarget.checked)}"
            ?hidden="${this._importedOrder}"
          />
          <label for="ownTransport" ?hidden="${this._importedOrder}">${i18next.t('label.own_transport')}</label>
        </fieldset>
      </form>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

          <data-grist
            id="product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.productGristConfig}
            .data="${this.productData}"
            @record-change="${this._onProductChangeHandler.bind(this)}"
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

          <data-grist
            id="vas-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.vasGristConfig}
            .data="${this.vasData}"
          ></data-grist>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.productData = { records: [] }
    this.vasData = { records: [] }
    this.containerSizes = []
    this._importedOrder = false
    this._hasContainer = false
    this._ownTransport = true
    this._orderType = null
  }

  get arrivalNoticeForm() {
    return this.shadowRoot.querySelector('form[name=arrivalNotice]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get containerNo() {
    return this.shadowRoot.querySelector('input[name=containerNo]')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async pageInitialized() {
    this.containerSizes = await getCodeByName('CONTAINER_SIZES')

    this.productGristConfig = {
      pagination: { infinite: true },
      list: { fields: ['batch_no', 'product', 'packingType', 'totalWeight'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.productData = {
                ...this.productData,
                records: data.records.filter((_, idx) => idx !== rowIndex)
              }
              this._updateVasTargets()
            }
          }
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { editable: true, align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'products',
              nameField: 'name',
              descriptionField: 'description',
              list: { fields: ['name', 'description'] }
            }
          },
          width: 350
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: true,
            align: 'center',
            codeName: 'PACKING_TYPES'
          },
          width: 150
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 80
        },
        {
          type: 'code',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { editable: true, align: 'center', codeName: 'WEIGHT_UNITS' },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 80
        },
        {
          type: 'float',
          name: 'totalWeight',
          header: i18next.t('field.total_weight'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 80
        }
      ]
    }

    this.vasGristConfig = {
      list: { fields: ['ready', 'targetType', 'targetDisplay', 'packingType'] },
      pagination: { infinite: true },
      rows: {
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            this._selectedVasRecord = record
            this._selectedVasRecordIdx = rowIndex
            if (column.name) {
              this.openVasCreatePopup(record)
            }
          }
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.vasData = { ...this.vasData, records: data.records.filter((_, idx) => idx !== rowIndex) }
            }
          }
        },
        {
          type: 'boolean',
          name: 'ready',
          header: i18next.t('field.ready'),
          width: 40
        },
        {
          type: 'string',
          name: 'targetType',
          header: i18next.t('field.target_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'targetDisplay',
          header: i18next.t('field.target'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'vasCount',
          header: i18next.t('field.vas_count'),
          record: { align: 'center' },
          width: 100
        }
      ]
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  _onProductChangeHandler(event) {
    try {
      this._checkProductDuplication()
      const changeRecord = event.detail.after
      const changedColumn = event.detail.column.name

      if (changedColumn === 'weight' || changedColumn === 'unit' || changedColumn === 'packQty') {
        changeRecord.totalWeight = this._calcTotalWeight(changeRecord.weight, changeRecord.unit, changeRecord.packQty)
      }

      this._updateVasTargets(true)
    } catch (e) {
      event.detail.after[event.detail.column.name] = event.detail.before[event.detail.column.name]
      this._showToast(e)
    }
  }

  _checkProductDuplication() {
    // batchId, product.id, packingType
    let isDuplicated = false
    const completedRows = this.productGrist.dirtyData.records
      .filter(record => record.batchId && record.product && record.product.id && record.packingType)
      .map(record => `${record.batchId}-${record.product.id}-${record.packingType}`)

    completedRows.forEach((row, idx, rows) => {
      if (rows.lastIndexOf(row) !== idx) {
        isDuplicated = true
      }
    })

    if (isDuplicated) {
      throw new Error(i18next.t('text.there_is_duplicated_products'))
    }
  }

  _calcTotalWeight(weight, unit, packQty) {
    if (weight && unit && packQty) {
      return `${(weight * packQty).toFixed(2)} ${unit}`
    } else {
      return null
    }
  }

  async _generateArrivalNotice() {
    try {
      this._validateForm()
      this._validateProducts()
      this._validateVas()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_arrival_notice'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      let arrivalNotice = this._getFormInfo()
      arrivalNotice.orderProducts = this._getOrderProducts()
      if (arrivalNotice.orderProducts.some(orderProduct => !orderProduct.palletQty)) {
        const result = await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.there_is_no_pallet_qty'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) return
      }
      await this._executeRelatedTrxs()
      arrivalNotice.orderVass = this._getOrderVass()

      const args = {
        arrivalNotice: {
          ...arrivalNotice,
          ownTransport: this._importedOrder ? true : this._ownTransport
        }
      }

      delete args.arrivalNotice.container

      const response = await client.query({
        query: gql`
            mutation {
              generateArrivalNotice(${gqlBuilder.buildArgs(args)}) {
                id
                name
              }
            }
          `
      })

      if (!response.errors) {
        this._clearView()
        navigate(`arrival_notice_detail/${response.data.generateArrivalNotice.name}`)
        this._showToast({ message: i18next.t('arrival_notice_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _executeRelatedTrxs() {
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length) return

    try {
      this.vasData = {
        ...this.vasData,
        records: await (async () => {
          const records = this.vasGrist.dirtyData.records
          for (let record of records) {
            const orderVass = record.orderVass
            for (let orderVas of orderVass) {
              if (orderVas.operationGuide && orderVas.operationGuide.transactions) {
                const trxs = orderVas.operationGuide.transactions
                for (let trx of trxs) {
                  orderVas.operationGuide = await trx(orderVas.operationGuide)
                }
              }
            }
          }
        })()
      }
    } catch (e) {
      throw e
    }
  }

  _validateForm() {
    if (!this.arrivalNoticeForm.checkValidity()) throw new Error(i18next.t('text.arrival_notice_form_invalid'))

    if (this._hasContainer) {
      if (!this.containerNo.value) throw new Error(i18next.t('text.container_no_is_empty'))
    }
  }

  _validateProducts() {
    // no records
    if (!this.productGrist.dirtyData.records || !this.productGrist.dirtyData.records.length)
      throw new Error(i18next.t('text.no_products'))

    // required field (batchId, packingType, weight, unit, packQty, palletQty)
    if (
      this.productGrist.dirtyData.records.filter(
        record => !record.batchId || !record.packingType || !record.weight || !record.unit || !record.packQty
      ).length
    )
      throw new Error(i18next.t('text.empty_value_in_list'))
  }

  _validateVas() {
    if (!this.vasGrist.dirtyData.records.every(record => record.ready)) throw new Error('there_is_not_ready_vas')
  }

  _updateVasTargets(isFieldChanged) {
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length) return

    if (
      !this.productGrist.dirtyData ||
      !this.productGrist.dirtyData.records ||
      !this.productGrist.dirtyData.records.length
    ) {
      this.vasData = { ...this.vasData, records: [] }
      return
    }

    const standardProductList = isFieldChanged ? this.productGrist.dirtyData.records : this.productData.records
    const batchPackPairs = standardProductList
      .filter(record => record.batchId && record.packingType)
      .map(record => `${record.batchId}-${record.packingType}`)

    const productPackPairs = standardProductList
      .filter(record => record.product && record.product.id)
      .map(record => `${record.product.id}-${record.packingType}`)

    const batchProductPackPairs = standardProductList
      .filter(record => record.batchId && record.product && record.product.id && record.packingType)
      .map(record => `${record.batchId}-${record.product.id}-${record.packingType}`)

    this.vasData = {
      ...this.vasData,
      records: this.vasGrist.dirtyData.records.map(record => {
        if (
          record.targetType === BATCH_NO_TYPE &&
          batchPackPairs.indexOf(`${record.target}-${record.packingType}`) < 0
        ) {
          return {
            ...record,
            ready: false,
            target: null,
            targetDisplay: null,
            packingType: null,
            qty: 1
          }
        } else if (
          record.targetType === PRODUCT_TYPE &&
          productPackPairs.indexOf(`${record.target}-${record.packingType}`) < 0
        ) {
          return {
            ...record,
            ready: false,
            target: null,
            targetDisplay: null,
            packingType: null,
            qty: 1
          }
        } else if (
          record.targetType === BATCH_AND_PRODUCT_TYPE &&
          batchProductPackPairs.indexOf(`${record.target.batchId}-${record.target.productId}-${record.packingType}`) < 0
        ) {
          return {
            ...record,
            ready: false,
            target: null,
            targetDisplay: null,
            packingType: null,
            qty: 1
          }
        } else {
          return record
        }
      })
    }
  }

  _getFormInfo() {
    const formData = this._serializeForm(this.arrivalNoticeForm)
    delete formData.importedOrder
    return formData
  }

  _getOrderProducts() {
    return this.productGrist.dirtyData.records.map(record => {
      let orderProduct = {
        batchId: record.batchId,
        product: { id: record.product.id },
        packingType: record.packingType,
        weight: record.weight,
        unit: record.unit,
        packQty: record.packQty,
        totalWeight: record.totalWeight
      }

      if (record.palletQty) {
        orderProduct = {
          ...orderProduct,
          palletQty: record.palletQty
        }
      }

      return orderProduct
    })
  }

  _getOrderVass() {
    if (!this.vasGrist.dirtyData || !this.vasGrist.dirtyData.records || !this.vasGrist.dirtyData.records.length) {
      return []
    }

    const records = this.vasGrist.dirtyData.records

    return records
      .map((record, idx) => {
        const orderVass = record.orderVass
        return orderVass.map(orderVas => {
          let result = {
            set: idx + 1,
            vas: { id: orderVas.vas.id },
            remark: orderVas.remark,
            targetType: record.targetType
          }

          if (orderVas.operationGuide && orderVas.operationGuide.data) {
            result.operationGuide = JSON.stringify(orderVas.operationGuide)
          }

          if (record.targetType === BATCH_NO_TYPE) {
            result.targetBatchId = record.target
            result.packingType = record.packingType
            result.qty = record.qty
          } else if (record.targetType === PRODUCT_TYPE) {
            result.targetProduct = { id: record.target }
            result.packingType = record.packingType
            result.qty = record.qty
          } else if (record.targetType === BATCH_AND_PRODUCT_TYPE) {
            result.targetBatchId = record.target.batchId
            result.targetProduct = { id: record.target.productId }
            result.packingType = record.packingType
            result.qty = record.qty
            result.weight = record.weight
          } else {
            result.otherTarget = record.target
          }

          return result
        })
      })
      .flat()
  }

  _clearView() {
    this.arrivalNoticeForm.reset()
    this.productData = { ...this.productData, records: [] }
    this.vasData = { ...this.vasData, records: [] }
  }

  _serializeForm(form) {
    let obj = {}
    Array.from(form.querySelectorAll('input, select')).forEach(field => {
      if (!field.hasAttribute('hidden') && field.value) {
        obj[field.name] = field.type === 'checkbox' ? field.checked : field.value
      }
    })

    return obj
  }

  openVasCreatePopup(record) {
    try {
      this.checkProductValidity()
      openPopup(
        html`
          <vas-create-popup
            .targetList="${this.productGrist.dirtyData.records.map(record => {
              return {
                ...record,
                unitWeight: record.weight,
                totalWeight: record.weight * record.packQty
              }
            })}"
            .record="${record}"
            @completed="${e => {
              if (this.vasGrist.dirtyData.records.length === this._selectedVasRecordIdx) {
                this.vasData = {
                  ...this.vasData,
                  records: [...this.vasGrist.dirtyData.records, e.detail]
                }
              } else {
                this.vasData = {
                  ...this.vasData,
                  records: this.vasGrist.dirtyData.records.map((record, idx) => {
                    if (idx === this._selectedVasRecordIdx) {
                      record = e.detail
                    }

                    return record
                  })
                }
              }
            }}"
          ></vas-create-popup>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.vas_order')
        }
      )
    } catch (e) {
      this._showToast(e)
    }
  }

  checkProductValidity() {
    if (!this.productGrist.dirtyData.records || !this.productGrist.dirtyData.records.length)
      throw new Error(i18next.t('text.there_is_no_product'))

    if (this.productGrist.dirtyData.records.some(record => !record.batchId))
      throw new Error(i18next.t('text.invalid_batch_no'))

    if (this.productGrist.dirtyData.records.some(record => !record.product || !record.product.id))
      throw new Error(i18next.t('text.invalid_product'))

    if (this.productGrist.dirtyData.records.some(record => !record.packingType))
      throw new Error(i18next.t('text.invalid_packing_type'))

    if (this.productGrist.dirtyData.records.some(record => !record.weight))
      throw new Error(i18next.t('text.invalid_weight'))

    if (this.productGrist.dirtyData.records.some(record => !record.packQty))
      throw new Error(i18next.t('text.invalid_pack_qty'))

    return true
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

window.customElements.define('create-arrival-notice', CreateArrivalNotice)
