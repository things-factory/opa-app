import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

// TODO: transport base의 ENUM 임포트 하도록 수정
const LOAD_TYPE = [{ name: 'Full container load', value: 'fcl' }, { name: 'Low container load', value: 'lcl' }]

class CreateArrivalNotice extends localize(i18next)(PageView) {
  static get properties() {
    return {
      /**
       * @description
       * flag for whether use transportation from warehouse or not.
       * true =>
       */
      _ownTransport: Boolean,
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
          action: this._generateArrivalNotice.bind(this)
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

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.arrival_notice')}</legend>
          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" />

          <label>${i18next.t('label.use_own_transport')}</label>
          <input
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            @change=${e => {
              this._ownTransport = e.currentTarget.checked
            }}
          />

          <!-- Show when userOwnTransport is true -->
          <label ?hidden="${this._ownTransport}">${i18next.t('label.picking_date')}</label>
          <input ?hidden="${this._ownTransport}" ?required="${!this._ownTransport}" name="pickingDateTime"
          type="datetime-local"" min="${this._getStdDatetime()}" />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.from')}</label>
          <input ?hidden="${this._ownTransport}" ?required="${!this._ownTransport}" name="from" />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.loadType')}</label>
          <select ?hidden="${this._ownTransport}" ?required="${!this._ownTransport}" name="loadType">
            ${LOAD_TYPE.map(
              loadType => html`
                <option value="${loadType.value}">${loadType.name}</option>
              `
            )}
          </select>

          <!-- Show when userOwnTransport option is false-->
          <label ?hidden="${!this._ownTransport}">${i18next.t('label.transport_reg_no')}</label>
          <input ?hidden="${!this._ownTransport}" ?required="${this._ownTransport}" name="truckNo" />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.delivery_order_no')}</label>
          <input ?hidden="${!this._ownTransport}" name="deliveryOrderNo" />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.eta_date')}</label>
          <input
            ?hidden="${!this._ownTransport}"
            ?required="${this._ownTransport}"
            name="eta"
            type="datetime-local"
            min="${this._getStdDatetime()}"
          />
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
    this._ownTransport = true
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
          width: 180
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true },
          width: 180
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { editable: true, align: 'center' },
          width: 150
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { editable: true, align: 'right' },
          width: 80
        },
        {
          type: 'select',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { editable: true, align: 'center', options: ['kg', 'g'] },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { editable: true, align: 'right' },
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
          record: { editable: true },
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
          record: { editable: true },
          width: 350
        }
      ]
    }
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

  async _generateArrivalNotice() {
    try {
      this._validateForm()
      this._validateProducts()
      this._validateVas()

      const response = await client.query({
        query: gql`
          mutation {
            generateArrivalNotice(${gqlBuilder.buildArgs({
              arrivalNotice: this._getArrivalNotice()
            })}) {
              id
              name
            }
          }
        `
      })

      if (!response.errors) {
        console.log('arrival notice created')
      }
    } catch (e) {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            type: 'warn',
            message: e.message
          }
        })
      )
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

  _getArrivalNotice() {
    let arrivalNotice = { status: 'PENDING' }
    Array.from(this.shadowRoot.querySelectorAll('form input, select')).forEach(field => {
      if (!field.hasAttribute('hidden') && field.value) {
        arrivalNotice[field.name] = field.type === 'checkbox' ? field.checked : field.value
      }
    })

    const products = this.productGrist.data.records.map((record, idx) => {
      const seq = idx + 1
      return {
        ...record,
        seq
      }
    })

    const vass = this.vasGrist.data.records.map(record => {
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
}

window.customElements.define('create-arrival-notice', CreateArrivalNotice)
