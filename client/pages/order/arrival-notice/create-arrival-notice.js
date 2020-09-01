import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { VAS_BATCH_AND_PRODUCT_TYPE, VAS_BATCH_NO_TYPE, VAS_PRODUCT_TYPE } from '../../constants'
import '../../order/vas-order/popup/vas-create-popup'

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
      _warehouseTransport: Boolean,
      _crossDocking: Boolean,
      _hasContainer: Boolean,
      _looseItem: Boolean,
      _files: Array,
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
          <input name="etaDate" type="date" required />

          <label ?hidden="${!this._hasContainer}">${i18next.t('label.container_no')}</label>
          <input ?hidden="${!this._hasContainer}" type="text" name="containerNo" />

          <label ?hidden="${!this._hasContainer}">${i18next.t('label.container_size')}</label>
          <select name="containerSize" ?hidden="${!this._hasContainer}">
            <option value="">--${i18next.t('label.please_select_a_container_size')}--</option>
            ${(this.containerSizes || []).map(
              containerSize =>
                html`
                  <option value="${containerSize && containerSize.name}">${containerSize && containerSize.name}</option>
                `
            )}
          </select>

          <label>${i18next.t('label.upload_documents')}</label>
          <file-uploader
            name="attachments"
            id="uploadDocument"
            label="${i18next.t('label.select_file')}"
            accept="*"
            multiple="true"
            custom-input
          ></file-uploader>

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
                this._warehouseTransportInput.checked = false
                this._warehouseTransport = false
              } else {
                this._ownTransportInput.checked = false
                this._ownTransport = false
                this._warehouseTransportInput.checked = false
                this._warehouseTransport = false
              }
            }}"
          />
          <label for="importedOrder">${i18next.t('label.import_cargo')}</label>

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            @change="${e => {
              this._ownTransport = e.currentTarget.checked
              if (this._ownTransport) {
                this._warehouseTransportInput.checked = false
                this._warehouseTransport = false
              } else {
                this._warehouseTransportInput.checked = true
                this._warehouseTransport = true
              }
            }}"
            ?hidden="${this._importedOrder}"
          />
          <label for="ownTransport" ?hidden="${this._importedOrder}">${i18next.t('label.own_transport')}</label>

          <input
            id="warehouseTransport"
            type="checkbox"
            name="warehouseTransport"
            ?checked="${this._warehouseTransport}"
            @change="${e => {
              this._warehouseTransport = e.currentTarget.checked
              if (this._warehouseTransport) {
                this._ownTransportInput.checked = false
                this._ownTransport = false
              } else {
                this._ownTransportInput.checked = true
                this._ownTransport = true
              }
            }}"
            ?hidden="${this._importedOrder}"
          />
          <label for="warehouseTransport" ?hidden="${this._importedOrder}">${i18next.t('label.warehouse_transport')}</label>

          <input
            id="crossDocking"
            type="checkbox"
            name="crossDocking"
            ?checked="${this._crossDocking}"
            @change="${e => (this._crossDocking = e.currentTarget.checked)}"
          />
          <label for="crossDocking">${i18next.t('label.cross_docking')}</label>
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
    this._ownTransport = false
    this._warehouseTransport = false
    this._crossDocking = false
    this._orderType = null
  }

  get arrivalNoticeForm() {
    return this.shadowRoot.querySelector('form[name=arrivalNotice]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get _warehouseTransportInput() {
    return this.shadowRoot.querySelector('input[name=warehouseTransport]')
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

  get _document() {
    return this.shadowRoot.querySelector('#uploadDocument')
  }

  async pageInitialized() {
    this.containerSizes = await getCodeByName('CONTAINER_SIZES')
    this._configureProductGrist()

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

  updated(changedProps) {
    if (changedProps.has('_crossDocking')) {
      this._configureProductGrist()
    }
  }

  /**
   * @description Configure product grist
   * Product grist columns should be change by value of _crossDocking
   */
  _configureProductGrist() {
    const crossDockingColumns = [
      {
        type: 'integer',
        name: 'releaseQty',
        header: i18next.t('field.release_qty'),
        record: { editable: true, align: 'center' },
        width: 160
      },
      {
        type: 'float',
        name: 'releaseWeight',
        header: i18next.t('field.release_weight'),
        record: { editable: true, align: 'center' },
        width: 160
      }
    ]

    const productGristColumns = [
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

    if (this._crossDocking) {
      const packQtyColumnIdx =
        productGristColumns.findIndex(column => column.name === 'packQty') || productGristColumns.length - 1
      productGristColumns.splice(packQtyColumnIdx + 1, 0, ...crossDockingColumns)
    }

    this.productGristConfig = {
      pagination: { infinite: true },
      list: { fields: ['batch_no', 'product', 'packingType', 'totalWeight'] },
      columns: productGristColumns
    }
  }

  _onProductChangeHandler(event) {
    try {
      this._checkProductDuplication()
      let changeRecord = event.detail.after
      const changedColumn = event.detail.column.name

      const amountRelatedColumns = ['weight', 'unit', 'packQty', 'releaseQty', 'releaseWeight']
      if (amountRelatedColumns.indexOf(changedColumn) >= 0) {
        const calcedAmount = this._calcAmount(changedColumn, changeRecord)
        for (let key in calcedAmount) {
          changeRecord[key] = calcedAmount[key]
        }
      }

      this._updateVasTargets(true)
    } catch (e) {
      const beforeValue = event.detail.before && event.detail.before[event.detail.column.name]
      if (beforeValue) {
        event.detail.after[event.detail.column.name] = beforeValue
      } else {
        delete event.detail.after[event.detail.column.name]
      }

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

  _calcAmount(changedColumn, changeRecord) {
    let calcedRecord = {}
    let { weight, unit, packQty, releaseQty, releaseWeight } = changeRecord

    if (changedColumn === 'weight' && (!weight || weight < 0))
      throw new Error(i18next.t('text.x_should_be_positive', { state: { x: i18next.t('label.weight') } }))
    if (changedColumn === 'packQty' && (!packQty || packQty < 0))
      throw new Error(i18next.t('text.x_should_be_positive', { state: { x: i18next.t('label.pack_qty') } }))
    if (changedColumn === 'unit' && !unit)
      throw new Error(i18next.t('text.x_is_empty', { state: { x: i18next.t('label.unit') } }))

    if (weight && unit && packQty) {
      calcedRecord.totalWeight = `${(weight * packQty).toFixed(2)} ${unit}`
    } else {
      calcedRecord.totalWeight = ''
    }

    if (!this._crossDocking) return calcedRecord

    if (changedColumn === 'releaseQty' || changedColumn === 'releaseWeight') {
      if (isNaN(releaseQty)) {
        releaseQty = 0
        calcedRecord.releaseQty = releaseQty
      }
      if (isNaN(releaseWeight)) {
        releaseWeight = 0
        calcedRecord.releaseWeight = releaseWeight
      }

      if (!weight) throw new Error(i18next.t('text.x_should_be_positive', { state: { x: i18next.t('label.weight') } }))
      if (!packQty)
        throw new Error(i18next.t('text.x_should_be_positive', { state: { x: i18next.t('label.pack_qty') } }))

      if (changedColumn === 'releaseQty') {
        if (typeof releaseQty === undefined || releaseQty < 0) {
          throw new Error(i18next.t('text.x_should_be_positive', { state: { x: i18next.t('label.release_qty') } }))
        }
        if (releaseQty > packQty) {
          throw new Error(i18next.t('text.x_exceed_limit', { state: { x: i18next.t('label.release_qty') } }))
        }
        calcedRecord.releaseWeight = releaseQty * weight
      } else {
        if (releaseWeight === undefined || releaseWeight < 0) {
          throw new Error(i18next.t('text.x_should_be_positive', { state: { x: i18next.t('label.release_weight') } }))
        }

        if (releaseWeight > packQty * weight) {
          throw new Error(i18next.t('text.x_exceed_limit', { state: { x: i18next.t('label.release_weight') } }))
        }

        if (releaseWeight % weight) {
          throw new Error(i18next.t('text.invalid_x', { state: { x: i18next.t('label.release_weight') } }))
        }

        calcedRecord.releaseQty = releaseWeight / weight
      }
    }

    return calcedRecord
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
      delete arrivalNotice.warehouseTransport
      arrivalNotice.orderProducts = this._getOrderProducts()
      const attachments = this._document?.files ? this._document.files : undefined

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
            mutation ($attachments: Upload) {
              generateArrivalNotice(${gqlBuilder.buildArgs(args)}, file:$attachments) {
                id
                name
                crossDocking
              }
            }
          `,
        variables: {
          attachments
        },
        context: {
          hasUpload: true
        }
      })

      if (!response.errors) {
        this._clearView()
        const ganNo = response.data.generateArrivalNotice.name
        const isCrossDocking = response.data.generateArrivalNotice.crossDocking
        if (!isCrossDocking) {
          navigate(`arrival_notice_detail/${ganNo}`)
        } else {
          const result = await CustomAlert({
            title: i18next.t('title.move_to_page', { state: { page: i18next.t('title.create_release_order') } }),
            text: i18next.t('text.creating_release_order_is_required'),
            confirmButton: { text: i18next.t('button.move') },
            cancelButton: { text: i18next.t('button.cancel') }
          })

          if (!result.value) {
            navigate(`arrival_notice_detail/${ganNo}`)
          } else {
            navigate(`create_release_order/${ganNo}`)
          }
        }

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
    if (!this.arrivalNoticeForm.checkValidity())
      throw new Error(i18next.t('text.arrival_notice_form_invalid'))

    if (this._hasContainer)
      if (!this.containerNo.value)
        throw new Error(i18next.t('text.container_no_is_empty'))

    if (this._ownTransport && this._warehouseTransport)
      throw new Error(i18next.t('text.you_can_only_select_one_transport_type'))

    else if (!this._ownTransport && !this._warehouseTransport)
      throw new Error(i18next.t('text.please_select_transport_type'))
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

    if (
      this._crossDocking &&
      this.productGrist.dirtyData.records.every(record => !record.releaseQty || !record.releaseWeight)
    ) {
      throw new Error(
        i18next.t('text.invalid_x', {
          state: {
            x: `${i18next.t('label.release_qty')}, ${i18next.t('label.release_weight')}`
          }
        })
      )
    }
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
          record.targetType === VAS_BATCH_NO_TYPE &&
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
          record.targetType === VAS_PRODUCT_TYPE &&
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
          record.targetType === VAS_BATCH_AND_PRODUCT_TYPE &&
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

      if (record.palletQty) orderProduct.palletQty = record.palletQty
      if (this._crossDocking && record.releaseQty !== undefined && record.releaseWeight !== undefined) {
        orderProduct.releaseQty = record.releaseQty
        orderProduct.releaseWeight = record.releaseWeight
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

          if (record.targetType === VAS_BATCH_NO_TYPE) {
            result.targetBatchId = record.target
            result.packingType = record.packingType
            result.qty = record.qty
          } else if (record.targetType === VAS_PRODUCT_TYPE) {
            result.targetProduct = { id: record.target }
            result.packingType = record.packingType
            result.qty = record.qty
          } else if (record.targetType === VAS_BATCH_AND_PRODUCT_TYPE) {
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
    if (this._document?._files) {
      this._document._files = []
    }
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
                packQty: record.packQty - (record.releaseQty || 0),
                totalWeight: record.weight * (record.packQty - (record.releaseQty || 0))
              }
            })}"
            .vasList="${this.vasData.records}"
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
