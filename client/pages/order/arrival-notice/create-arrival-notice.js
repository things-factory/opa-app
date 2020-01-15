import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import {
  client,
  CustomAlert,
  gqlBuilder,
  isMobileDevice,
  navigate,
  PageView,
  store,
  UPDATE_CONTEXT
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../components/vas-relabel'

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
      productGristConfig: Object,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object,
      _template: Object
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
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .guide-container {
          max-width: 30vw;
          display: flex;
          flex-direction: column;
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
      actions: this._actions
    }
  }

  get createButton() {
    return { title: i18next.t('button.submit'), action: this._generateArrivalNotice.bind(this) }
  }

  get adjustButton() {
    return {
      title: i18next.t('button.adjust'),
      action: async () => {
        const copied = Object.assign(this.vasData, {})
        try {
          this.vasData = {
            ...this.vasData,
            records: await Promise.all(
              this.vasGrist.dirtyData.records.map(async (record, idx) => {
                if (idx === this._selectedVasRecordIdx) {
                  record.operationGuide = await this._template.adjust()
                  record.ready = this._isReadyToCreate(record)
                }
                return record
              })
            )
          }
        } catch (e) {
          this._showToast(e)
          this.vasData = Object.assign(copied)
        }
      }
    }
  }

  render() {
    return html`
      <form name="arrivalNotice" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.arrival_notice')}</legend>
          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" />

          <label ?hidden="${!this._importedOrder}">${i18next.t('label.container_no')}</label>
          <input name="containerNo" ?hidden="${!this._importedOrder}" />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.do_no')}</label>
          <input name="deliveryOrderNo" ?hidden="${!this._ownTransport}" />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
          <input ?hidden="${!this._ownTransport}" name="truckNo" />

          <label>${i18next.t('label.eta_date')}</label>
          <input name="etaDate" type="date" min="${this._getStdDate()}" required />

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
            @field-change="${this._onFieldChange.bind(this)}"
          ></data-grist>
        </div>

        <div class="guide-container">
          ${this._template}
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.productData = { records: [] }
    this.vasData = { records: [] }
    this._actions = [this.createButton]
    this._importedOrder = false
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

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  pageInitialized() {
    this.productGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      list: { fields: ['batch_no', 'product', 'packingType', 'totalWeight'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const newData = data.records.filter((_, idx) => idx !== rowIndex)
              this.productData = { ...this.productData, records: newData }
              this.productGrist.dirtyData.records = newData
              this._updateBatchList()
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
      list: { fields: ['ready', 'vas', 'batchId', 'remark'] },
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true },
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (
              record &&
              record.vas &&
              record.vas.operationGuideType === 'template' &&
              record.vas.operationGuide &&
              record.batchId
            ) {
              record.inventory = { product: { name: record.batchId } }
              this._template = document.createElement(record.vas.operationGuide)
              this._template.record = record
              this._template.operationGuide = record.operationGuide
            } else {
              this._template = null
            }
            this._selectedVasRecord = record
            this._selectedVasRecordIdx = rowIndex
            this._updateContext()
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
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'vass',
              select: [
                { name: 'id', hidden: true },
                { name: 'name', width: 160 },
                { name: 'description', width: 200 },
                { name: 'operationGuide', hidden: true },
                { name: 'operationGuideType', hidden: true }
              ],
              list: { fields: ['name', 'description'] }
            }
          },
          width: 250
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { editable: true, align: 'center', options: ['', i18next.t('label.all')] },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
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
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    if (changedColumn === 'weight' || changedColumn === 'unit' || changedColumn === 'packQty') {
      changeRecord.totalWeight = this._calcTotalWeight(changeRecord.weight, changeRecord.unit, changeRecord.packQty)
    }

    this._updateBatchList()
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

      let arrivalNotice = this._getArrivalNotice()
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
      arrivalNotice = this._getArrivalNotice()

      let args = {
        arrivalNotice: { ...arrivalNotice, ownTransport: this._importedOrder ? true : this._ownTransport }
      }

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
    try {
      this.vasData = {
        ...this.vasData,
        records: await (async () => {
          let records = []
          for (let i = 0; i < this.vasGrist.dirtyData.records.length; i++) {
            const record = this.vasGrist.dirtyData.records[i]

            if (record.vas.operationGuide && record.operationGuide && record.operationGuide.transactions) {
              const trxs = record.operationGuide.transactions || []

              for (let j = 0; j < trxs.length; j++) {
                const trx = trxs[j]
                record.operationGuide = await trx(record.operationGuide)
              }
            }
            records.push(record)
          }

          return records
        })()
      }
    } catch (e) {
      throw e
    }
  }

  _validateForm() {
    if (!this.arrivalNoticeForm.checkValidity()) throw new Error('text.arrival_notice_form_invalid')
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
    if (this.vasGrist.dirtyData.records && this.vasGrist.dirtyData.records.length) {
      // required field (vas && remark)
      if (this.vasGrist.dirtyData.records.filter(record => !record.vas || !record.remark).length)
        throw new Error(i18next.t('text.empty_value_in_list'))

      // duplication of vas for same batch
      const vasBatches = this.vasGrist.dirtyData.records.map(vas => `${vas.vas.id}-${vas.batchId}`)
      if (vasBatches.filter((vasBatch, idx, vasBatches) => vasBatches.indexOf(vasBatch) !== idx).length)
        throw new Error(i18next.t('text.duplicated_vas_on_same_batch'))

      if (!this.vasGrist.dirtyData.records.every(record => record.ready)) throw new Error('there_is_not_ready_vas')
    }
  }

  _updateBatchList() {
    const batchIds = ['', 'all', ...(this.productGrist.dirtyData.records || []).map(record => record.batchId)]

    this.vasGristConfig = {
      ...this.vasGristConfig,
      columns: this.vasGristConfig.columns.map(column => {
        if (column.name === 'batchId') column.record.options = batchIds
        return column
      })
    }

    this.vasData = {
      records: this.vasGrist.dirtyData.records.map(record => {
        return {
          ...record,
          batchId: batchIds.includes(record.batchId) ? record.batchId : null,
          ready: record.vas.operationGuideType
            ? batchIds.includes(record.batchId)
              ? record.ready
              : false
            : record.ready
        }
      })
    }
  }

  _getArrivalNotice() {
    let arrivalNotice = this._serializeForm(this.arrivalNoticeForm)
    delete arrivalNotice.importedOrder

    arrivalNotice.orderProducts = this.productGrist.dirtyData.records.map((record, idx) => {
      let _tempObj = {}
      const seq = idx + 1
      if (record.palletQty) _tempObj.palletQty = record.palletQty

      _tempObj = {
        ..._tempObj,
        seq,
        batchId: record.batchId,
        product: { id: record.product.id },
        packingType: record.packingType,
        weight: record.weight,
        unit: record.unit,
        packQty: record.packQty,
        totalWeight: record.totalWeight
      }

      return _tempObj
    })

    arrivalNotice.orderVass = this.vasGrist.dirtyData.records.map(record => {
      let _tempObj = {}
      if (record.operationGuide && record.operationGuide.data) {
        _tempObj.operationGuide = JSON.stringify(record.operationGuide)
      }

      _tempObj = {
        ..._tempObj,
        vas: { id: record.vas.id },
        batchId: record.batchId,
        remark: record.remark
      }

      return _tempObj
    })

    return arrivalNotice
  }

  _clearView() {
    this._template = null
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

  _updateContext() {
    this._actions = []

    if (this._selectedVasRecord && this._selectedVasRecord.vas && this._selectedVasRecord.vas.operationGuideType) {
      this._actions = [this.adjustButton]
    }

    this._actions = [...this._actions, this.createButton]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _onFieldChange() {
    this.vasData = {
      ...this.vasGrist.dirtyData,
      records: this.vasGrist.dirtyData.records.map(record => {
        return {
          ...record,
          ready: this._isReadyToCreate(record)
        }
      })
    }
  }

  _isReadyToCreate(record) {
    if (record.vas && record.vas.operationGuideType) {
      return Boolean(record.operationGuide && record.inventory && record.remark)
    } else if (record.vas && !record.vas.operationGuideType) {
      return Boolean(record.vas && record.batchId && record.remark)
    } else {
      return false
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

window.customElements.define('create-arrival-notice', CreateArrivalNotice)
