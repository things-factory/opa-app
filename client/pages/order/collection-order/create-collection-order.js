import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS, PACKING_TYPES, ORDER_TYPES } from '../constants/order'

class CreateCollectionOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _orderName: String,
      productGristConfig: Object,
      currentOrderType: String,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object,
      _orderStatus: String
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
      title: i18next.t('title.create_collection_order'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._generateCollectionOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.collection_order')}</legend>
          <label>${i18next.t('label.from')}</label>
          <input name="from" />

          <label>${i18next.t('label.to')}</label>
          <input name="to" />

          <label>${i18next.t('label.collection_date')}</label>
          <input name="collectionDateTime" type="datetime-local" min="${this._getStdDatetime()}" />

          <label>${i18next.t('label.load_type')}</label>
          <select name="loadType" required>
            ${LOAD_TYPES.map(
              loadType => html`
                <option value="${loadType.value}">${i18next.t(`label.${loadType.name}`)}</option>
              `
            )}
          </select>

          <label>${i18next.t('label.tel_no')}</label>
          <input name="telNo" />
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
    `
  }

  constructor() {
    super()
    this.productData = {}
    this.vasData = {}
  }

  updated(changedProps) {
    if (changedProps.has('_orderName') && this._orderName) {
      this.fetchCollectionOrder()
      this._updateBatchList()
    } else if (changedProps.has('_orderName') && !this._orderName) {
      this._clearPage()
      this._updateBatchList()
      this._orderStatus = undefined
    }
    this._contextHandler()
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
              this.productData = {
                ...this.productData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }

              this._updateBatchList()
            }
          }
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { editable: true, align: 'center', options: { queryName: 'products' } },
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
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'center' },
          width: 180
        },
        {
          type: 'select',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: true,
            align: 'center',
            options: ['', ...Object.keys(PACKING_TYPES).map(key => PACKING_TYPES[key].value)]
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
          type: 'select',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { editable: true, align: 'center', options: ['', 'kg', 'g'] },
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
              this.vasData = {
                ...this.vasData,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
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
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'center' },
          width: 180
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { editable: true, align: 'center', options: [i18next.t('label.all')] },
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

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  _getStdDatetime() {
    let date = new Date()
    date.setDate(date.getDate() + 1)
    return `${date.toISOString().substr(0, 11)}00:00:00`
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

  async _generateCollectionOrder() {
    try {
      this._validateForm()
      this._validateProducts()
      this._validateVas()

      const response = await client.query({
        query: gql`
          mutation {
            generateCollectionOrder(${gqlBuilder.buildArgs({
              collectionOrder: this._getCollectionOrder()
            })}) {
              id
              name
            }
          }
        `
      })

      if (!response.errors) {
        navigate(`collection_order_detail/${response.data.generateCollectionOrder.name}`)
        this._showToast({ message: i18next.t('collection_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateForm() {
    const elements = Array.from(this.form.querySelectorAll('input, select'))
    if (!elements.filter(e => !e.hasAttribute('hidden')).every(e => e.checkValidity()))
      throw new Error(i18next.t('text.invalid_form'))
  }

  _validateProducts() {
    this.productGrist.commit()
    // no records
    if (!this.productGrist.data.records || !this.productGrist.data.records.length)
      throw new Error(i18next.t('text.no_products'))

    // required field (batchId, packingType, weight, unit, packQty)
    if (
      this.productGrist.data.records.filter(
        record => !record.batchId || !record.packingType || !record.weight || !record.unit || !record.packQty
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
    // TODO: 시점 문제...
    setTimeout(() => {
      this.productGrist.commit()
      this.productData = this.productGrist.data
      const batchIds = (this.productGrist.data.records || []).map(record => record.batchId)

      this.vasGrist.commit()
      this.vasData = {
        ...this.vasGrist.data,
        records: this.vasGrist.data.records.map(record => {
          return {
            ...record,
            batchId: batchIds.includes(record.batchId) ? record.batchId : null
          }
        })
      }

      this.vasGristConfig = {
        ...this.vasGristConfig,
        columns: this.vasGristConfig.columns.map(column => {
          if (column.name === 'batchId') column.record.options = [i18next.t('label.all'), ...batchIds]

          return column
        })
      }
    }, 300)
  }

  _getCollectionOrder() {
    let collectionOrder = { status: ORDER_STATUS.PENDING.value }
    Array.from(this.form.querySelectorAll('input, select')).forEach(field => {
      if (!field.hasAttribute('hidden') && field.value) {
        collectionOrder[field.name] = field.type === 'checkbox' ? field.checked : field.value
      }
    })

    const products = this.productGrist.data.records.map((record, idx) => {
      const seq = idx + 1
      delete record.id
      delete record.__typename
      delete record.product.__typename

      return { ...record, seq, type: ORDER_TYPES.ARRIVAL_NOTICE.value }
    })

    const vass = this.vasGrist.data.records.map(record => {
      delete record.id
      delete record.__typename
      delete record.vas.__typename

      return { ...record, name }
    })

    return { collectionOrder, products, vass }
  }

  _clearPage() {
    this.form.reset()
    this.productData = {}
    this.vasGrist.data = {}
  }

  async fetchCollectionOrder() {
    const response = await client.query({
      query: gql`
        query {
          collectionOrder(${gqlBuilder.buildArgs({
            name: this._orderName
          })}) {
            id
            name
            collectionDateTime
            from
            to
            loadType
            truckNo
            telNo
            status
            orderProducts {
              id
              batchId
              product {
                id
                name
                description
              }
              description
              packingType
              weight
              unit
              packQty
              totalWeight
              palletQty
            }
            orderVass {
              vas {
                id
                name
                description
              }
              description
              batchId
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._fillupForm(response.data.collectionOrder)
      this._orderStatus = response.data.collectionOrder.status
      this.productData = {
        ...this.productData,
        records: response.data.collectionOrder.orderProducts
      }

      this.vasData = {
        ...this.vasData,
        records: response.data.collectionOrder.orderVass
      }
    }
  }

  _fillupForm(orderInformations) {
    for (let key in orderInformations) {
      Array.from(this.form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(orderInformations[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = orderInformations[key]
        }
      })
    }
  }

  _contextHandler() {
    if (this._orderName) {
      store.dispatch({
        type: UPDATE_CONTEXT,
        context: {
          ...this.context,
          actions: [
            {
              title: i18next.t('button.update'),
              action: () => {
                try {
                  this._validateForm()
                  this._validateProducts()
                  this._validateVas()

                  this._editCollectionOrder(this._getCollectionOrder())
                } catch (e) {
                  this._showToast(e)
                }
              }
            }
          ]
        }
      })
    } else {
      store.dispatch({
        type: UPDATE_CONTEXT,
        context: {
          ...this.context
        }
      })
    }
  }

  async _editCollectionOrder(collectionOrder) {
    const response = await client.query({
      query: gql`
        mutation {
          editCollectionOrder(${gqlBuilder.buildArgs({
            name: this._orderName,
            collectionOrder
          })}) {
            name 
          }
        }
      `
    })

    if (!response.errors) {
      navigate(`collection_order_detail/${response.data.editCollectionOrder.name}`)
      this._showToast({ message: i18next.t('collection_order_updated') })
    }
  }

  stateChanged(state) {
    if (JSON.parse(this.active)) {
      this._orderName = state && state.route && state.route.resourceId
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

window.customElements.define('create-collection-order', CreateCollectionOrder)
