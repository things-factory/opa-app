import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS } from './constants/order'

class ArrivalNoticeDetail extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _ganNo: String,
      _ownTransport: Boolean,
      _status: String,
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
      title: i18next.t('title.arrival_notice_detail')
    }
  }

  activated(active) {
    if (JSON.parse(active)) {
      this.fetchGAN()
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

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.gan')}: ${this._ganNo}</legend>
          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" ?disabled="${this._status !== ORDER_STATUS.EDITING.value}" />

          <label>${i18next.t('label.use_own_transport')}</label>
          <input
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            ?disabled="${this._status !== ORDER_STATUS.EDITING.value}"
            @change=${e => {
              console.log('value changed')
              this._ownTransport = e.currentTarget.checked
            }}
          />

          <!-- Show when userOwnTransport is true -->
          <label ?hidden="${this._ownTransport}">${i18next.t('label.picking_date')}</label>
          <input
            ?hidden="${this._ownTransport}"
            name="pickingDateTime"
            type="datetime-local"
            ?disabled="${this._status !== ORDER_STATUS.EDITING.value}"
          />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.from')}</label>
          <input
            ?hidden="${this._ownTransport}"
            name="from"
            ?disabled="${this._status !== ORDER_STATUS.EDITING.value}"
          />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.loadType')}</label>
          <select
            ?hidden="${this._ownTransport}"
            name="loadType"
            ?disabled="${this._status !== ORDER_STATUS.EDITING.value}"
          >
            ${LOAD_TYPES.map(
              loadType => html`
                <option value="${loadType.value}">${i18next.t(`label.${loadType.name}`)}</option>
              `
            )}
          </select>

          <!-- Show when userOwnTransport option is false-->
          <label ?hidden="${!this._ownTransport}">${i18next.t('label.transport_reg_no')}</label>
          <input
            ?hidden="${!this._ownTransport}"
            ?required="${this._ownTransport}"
            name="truckNo"
            ?disabled="${this._status !== ORDER_STATUS.EDITING.value}"
          />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.delivery_order_no')}</label>
          <input
            ?hidden="${!this._ownTransport}"
            name="deliveryOrderNo"
            ?disabled="${this._status !== ORDER_STATUS.EDITING.value}"
          />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.eta_date')}</label>
          <input
            ?hidden="${!this._ownTransport}"
            ?required="${this._ownTransport}"
            name="eta"
            type="datetime-local"
            ?disabled="${this._status !== ORDER_STATUS.EDITING.value}"
          />

          <label>${i18next.t('label.status')}</label>
          <select name="status" ?disabled="${this._status !== ORDER_STATUS.EDITING.value}"
            >${Object.keys(ORDER_STATUS).map(key => {
              const status = ORDER_STATUS[key]
              return html`
                <option value="${status.value}">${i18next.t(`label.${status.name}`)}</option>
              `
            })}</select
          >
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

  firstUpdated() {
    this.productGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: {
            align: 'center',
            options: { queryName: 'products' }
          },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            align: 'center',
            options: { queryName: 'products' }
          },
          width: 180
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: this._status === ORDER_STATUS.EDITING.value },
          width: 180
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'right' },
          width: 80
        },
        {
          type: 'select',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { align: 'center', options: ['kg', 'g'] },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { align: 'right' },
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
          record: { align: 'center' },
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
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: {
            align: 'center',
            options: { queryName: 'vass' }
          },
          width: 250
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          width: 180
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: {
            align: 'center',
            options: [i18next.t('label.all')]
          },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: this._status === ORDER_STATUS.EDITING.value },
          width: 350
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('_ganNo')) {
      this.fetchGAN()
    }
  }

  async fetchGAN() {
    const response = await client.query({
      query: gql`
        query {
          arrivalNotice(${gqlBuilder.buildArgs({
            name: this._ganNo
          })}) {
            id
            name
            containerNo
            ownTransport
            pickingDateTime
            eta
            from
            loadType
            truckNo
            deliveryOrderNo
            status
            collectionOrder {
              id
              name
              description
            }
            arrivalNoticeProducts {
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
            }
            arrivalNoticeVass {
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
      this._ownTransport = response.data.arrivalNotice.ownTransport
      this._status = response.data.arrivalNotice.status
      this._actionsHandler()
      this._fillupForm(response.data.arrivalNotice)
      this.productData = {
        ...this.productData,
        records: response.data.arrivalNotice.arrivalNoticeProducts
      }

      this.vasData = {
        ...this.vasData,
        records: response.data.arrivalNotice.arrivalNoticeVass
      }
    }
  }

  _fillupForm(arrivalNotice) {
    for (let key in arrivalNotice) {
      Array.from(this.form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = arrivalNotice[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          let date = new Date(Number(arrivalNotice[key]))
          date = date.toISOString()
          field.value = date.substr(0, date.length - 1)
        } else if (field.name === key) {
          field.value = arrivalNotice[key]
        }
      })
    }
  }

  async _updateArrivalNotice(patch, successCallback) {
    const response = await client.query({
      query: gql`
        mutation {
          updateArrivalNotice(${gqlBuilder.buildArgs({
            name: this._ganNo,
            patch
          })}) {
            name 
          }
        }
      `
    })

    if (!response.errors) {
      this.fetchGAN()
      if (successCallback && typeof successCallback === 'function') successCallback()
    }
  }

  async _editArrivalNotice(arrivalNotice) {
    const response = await client.query({
      query: gql`
        mutation {
          editArrivalNotice(${gqlBuilder.buildArgs({
            name: this._ganNo,
            arrivalNotice
          })}) {
            name 
          }
        }
      `
    })

    if (!response.errors) {
      this.fetchGAN()
      this._showToast({ message: i18next.t('text.gan_ready_to_confirmation') })
    }
  }

  _actionsHandler() {
    this._modifyGrist()
    let actions

    if (this._status === ORDER_STATUS.PENDING.value) {
      actions = [
        {
          title: i18next.t('button.edit'),
          action: () => {
            this._updateArrivalNotice({ status: ORDER_STATUS.EDITING.value }, () => {
              this._showToast({ message: i18next.t('text.gan_now_editable') })
            })
          }
        },
        {
          title: i18next.t('button.confirm'),
          action: () => {
            this._updateArrivalNotice({ status: ORDER_STATUS.PENDING_RECIEVE.value }, () => {
              this._showToast({ message: i18next.t('text.gan_confirmed') })
              history.back()
            })
          }
        }
      ]
    } else if (this._status === ORDER_STATUS.EDITING.value) {
      actions = [
        {
          title: i18next.t('button.update'),
          action: () => {
            try {
              this._validateForm()
              this._validateProducts()
              this._validateVas()

              this._editArrivalNotice(this._getArrivalNotice())
            } catch (e) {
              this._showToast(e)
            }
          }
        }
      ]
    } else if (this._status === ORDER_STATUS.PENDING_RECIEVE.value) {
      actions = [
        {
          title: i18next.t('button.decline'),
          action: () => {
            console.log('todo decline')
          }
        },
        {
          title: i18next.t('button.accept'),
          action: () => {
            console.log('todo accept')
          }
        }
      ]
    }

    actions = [...actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        ...this.context,
        actions
      }
    })
  }

  _modifyGrist() {
    const gutters =
      this._status === ORDER_STATUS.EDITING.value
        ? [
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

                  // TODO: 시점 문제...
                  setTimeout(this._updateBatchList.bind(this), 300)
                }
              }
            }
          ]
        : [{ type: 'gutter', gutterName: 'sequence' }]
    this.productGristConfig = {
      ...this.productGristConfig,
      columns: [
        ...gutters,
        ...this.productGristConfig.columns
          .filter(column => column.record)
          .map(column => {
            return {
              ...column,
              record: {
                ...column.record,
                editable: this._status === ORDER_STATUS.EDITING.value
              }
            }
          })
      ]
    }

    this.vasGristConfig = {
      ...this.vasGristConfig,
      columns: [
        ...gutters,
        ...this.vasGristConfig.columns
          .filter(column => column.record)
          .map(column => {
            return {
              ...column,
              record: {
                ...column.record,
                editable: this._status === ORDER_STATUS.EDITING.value
              }
            }
          })
      ]
    }
  }

  _validateForm() {
    if (!this.form.checkValidity()) throw new Error(i18next.t('text.invalid_form'))
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

  _getArrivalNotice() {
    let arrivalNotice = { status: ORDER_STATUS.PENDING }
    Array.from(this.form.querySelectorAll('input, select')).forEach(field => {
      if (!field.hasAttribute('hidden') && field.value) {
        arrivalNotice[field.name] = field.type === 'checkbox' ? field.checked : field.value
      }
    })

    const products = this.productGrist.data.records.map((record, idx) => {
      const seq = idx + 1
      delete record.id
      delete record.__typename
      delete record.product.__typename

      return {
        ...record,
        seq
      }
    })

    const vass = this.vasGrist.data.records.map(record => {
      delete record.id
      delete record.__typename
      delete record.vas.__typename

      return {
        ...record,
        name
      }
    })

    return {
      arrivalNotice,
      products,
      vass
    }
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

  _updateBatchList() {
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
  }

  stateChanged(state) {
    if (this.active) {
      this._ganNo = state && state.route && state.route.resourceId
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

window.customElements.define('arrival-notice-detail', ArrivalNoticeDetail)
