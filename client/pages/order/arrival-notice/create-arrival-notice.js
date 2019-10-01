import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'

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
      _loadTypes: Array,
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
      actions: [
        {
          title: i18next.t('button.create'),
          type: 'transaction',
          action: this._generateArrivalNotice.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form name="arrivalNotice" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.arrival_notice')}</legend>
          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" />

          <label>${i18next.t('label.do_no')}</label>
          <input name="deliveryOrderNo" />

          <label>${i18next.t('label.eta_date')}</label>
          <input
            name="etaDate"
            type="date"
            min="${this._getStdDate()}"
            required
            @change="${e => {
              this._collectionDateInput.setAttribute('max', e.currentTarget.value)
            }}"
          />

          <input
            id="importedOrder"
            type="checkbox"
            name="importedOrder"
            ?checked="${this._importedOrder}"
            @change="${e => {
              this._importedOrder = e.currentTarget.checked
              if (this._importedOrder) {
                this._ownTransportInput.checked = true
                this._ownTransport = true
              }
            }}"
          />
          <label for="importedOrder">${i18next.t('label.imported')}</label>

          <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            @change="${e => (this._ownTransport = e.currentTarget.checked)}"
            ?hidden="${this._importedOrder}"
          />
          <label for="ownTransport" ?hidden="${this._importedOrder}">${i18next.t('label.own_transport')}</label>

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.transport_reg_no')}</label>
          <input ?hidden="${!this._ownTransport}" name="truckNo" ?required="${this._ownTransport}" />
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

        <data-grist
          id="product-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productGristConfig}
          .data="${this.productData}"
          @record-change="${this._onProductChangeHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
        ></data-grist>
      </div>

      <div class="co-form-container" ?hidden="${this._importedOrder || (!this._importedOrder && this._ownTransport)}">
        <form name="collectionOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.collection_order')}</legend>

            <label>${i18next.t('label.collection_date')}</label>
            <input name="collectionDate" type="date" min="${this._getStdDate()}" ?required="${!this._ownTransport}" />

            <label>${i18next.t('label.destination')}</label>
            <input name="from" ?required="${!this._ownTransport}" />

            <label>${i18next.t('label.load_type')}</label>
            <select name="loadType" ?required="${!this._ownTransport}">
              <option value=""></option>
              ${this._loadTypes.map(
                loadType => html`
                  <option value="${loadType.name}">${i18next.t(`label.${loadType.description}`)}</option>
                `
              )}
            </select>

            <!--label>${i18next.t('label.document')}</label>
            <input name="attiachment" type="file" ?required="${!this._ownTransport}" /-->
          </fieldset>
        </form>
      </div>
    `
  }

  constructor() {
    super()
    this.productData = { records: [] }
    this.vasData = { records: [] }
    this._importedOrder = false
    this._ownTransport = true
    this._loadTypes = []
  }

  get arrivalNoticeForm() {
    return this.shadowRoot.querySelector('form[name=arrivalNotice]')
  }

  get collectionOrderForm() {
    return this.shadowRoot.querySelector('form[name=collectionOrder]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get _collectionDateInput() {
    return this.shadowRoot.querySelector('input[name=collectionDate]')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async firstUpdated() {
    this._loadTypes = await getCodeByName('LOAD_TYPES')
  }

  pageInitialized() {
    this.productGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
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
          header: i18next.t('field.batch_id'),
          record: { editable: true, align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { editable: true, align: 'center', options: { queryName: 'products' } },
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
          record: { editable: true, align: 'center' },
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
          record: { editable: true, align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'totalWeight',
          header: i18next.t('field.total_weight'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { editable: true, align: 'center' },
          width: 80
        }
      ]
    }

    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const newData = data.records.filter((_, idx) => idx !== rowIndex)
              this.vasData = { ...this.vasData, records: newData }
            }
          }
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { editable: true, align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
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

  _clearPage() {
    this.arrivalNoticeForm.reset()
    this.productGrist.data = Object.assign({ records: [] })
    this.vasGrist.data = Object.assign({ records: [] })
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate() + 1)
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

  async _generateArrivalNotice(cb) {
    try {
      this._validateForm()
      this._validateProducts()
      this._validateVas()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_arrival_notice'),
        confirmButton: {
          text: i18next.t('button.confirm')
        }
      })

      if (result.value) {
        let args = { arrivalNotice: this._getArrivalNotice() }
        if (!this._importedOrder && !this._ownTransport) args.collectionOrder = this._getCollectionOrder()

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
          navigate(`arrival_notice_detail/${response.data.generateArrivalNotice.name}`)
          this._showToast({ message: i18next.t('arrival_notice_created') })
        }
      }
    } catch (e) {
      this._showToast(e)
    } finally {
      cb()
    }
  }

  _validateForm() {
    if (!this.arrivalNoticeForm.checkValidity()) throw new Error('text.arrival_notice_form_invalid')

    // arrival notice and collection order
    //    - condition: not imported and not own transport
    if (!this._importedOrder && !this._ownTransport) {
      if (!this.collectionOrderForm.checkValidity()) throw new Error('text.collection_order_form_invalid')
    }
  }

  _validateProducts() {
    this.productGrist.commit()
    // no records
    if (!this.productGrist.data.records || !this.productGrist.data.records.length)
      throw new Error(i18next.t('text.no_products'))

    // required field (batchId, packingType, weight, unit, packQty, palletQty)
    if (
      this.productGrist.data.records.filter(
        record =>
          !record.batchId ||
          !record.packingType ||
          !record.weight ||
          !record.unit ||
          !record.packQty ||
          !record.palletQty
      ).length
    )
      throw new Error(i18next.t('text.empty_value_in_list'))

    // duplication of batch id
    const batchIds = this.productGrist.data.records.map(product => product.batchId)
    if (batchIds.filter((batchId, idx, batchIds) => batchIds.indexOf(batchId) !== idx).length)
      throw new Error(i18next.t('text.batch_id_is_duplicated'))
  }

  _validateVas() {
    this.vasGrist.commit()
    if (this.vasGrist.data.records && this.vasGrist.data.records.length) {
      // required field (vas && remark)
      if (this.vasGrist.data.records.filter(record => !record.vas || !record.remark).length)
        throw new Error(i18next.t('text.empty_value_in_list'))

      // duplication of vas for same batch
      const vasBatches = this.vasGrist.data.records.map(vas => `${vas.vas.id}-${vas.batchId}`)
      if (vasBatches.filter((vasBatch, idx, vasBatches) => vasBatches.indexOf(vasBatch) !== idx).length)
        throw new Error(i18next.t('text.duplicated_vas_on_same_batch'))
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
          batchId: batchIds.includes(record.batchId) ? record.batchId : null
        }
      })
    }
  }

  _getArrivalNotice() {
    let arrivalNotice = this._serializeForm(this.arrivalNoticeForm)
    delete arrivalNotice.importedOrder

    arrivalNotice.orderProducts = this.productGrist.data.records.map((record, idx) => {
      const seq = idx + 1
      delete record.id
      delete record.__typename
      delete record.product.__typename

      return { ...record, seq }
    })

    arrivalNotice.orderVass = this.vasGrist.data.records.map(record => {
      delete record.id
      delete record.__typename
      delete record.vas.__typename

      return { ...record, name }
    })

    return arrivalNotice
  }

  _getCollectionOrder() {
    return this._serializeForm(this.collectionOrderForm)
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
