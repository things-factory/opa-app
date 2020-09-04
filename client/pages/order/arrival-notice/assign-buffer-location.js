import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { getRenderer } from '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../components/attachment-viewer'
import '../../components/popup-note'
import '../../components/vas-templates'
import {
  ORDER_STATUS,
  VAS_BATCH_AND_PRODUCT_TYPE,
  VAS_BATCH_NO_TYPE,
  VAS_ETC_TYPE,
  VAS_PRODUCT_TYPE
} from '../../constants'
import './buffer-location-selector'

class AssignBufferLocation extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _ganNo: String,
      _ownTransport: Boolean,
      _crossDocking: Boolean,
      _hasContainer: Boolean,
      _looseItem: Boolean,
      _attachments: Array,
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

        .gan-preview {
          display: flex;
          flex-direction: row;
          flex: 1;
        }
        attachment-viewer {
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.assign_warehouse'),
      actions: [
        {
          title: i18next.t('button.assign_warehouse'),
          action: this._assignBufferLocation.bind(this)
        },
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ]
    }
  }

  render() {
    return html`
      <form name="arrivalNotice" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.gan_no')}: ${this._ganNo}</legend>

          <input id="container" type="checkbox" name="container" ?checked="${this._hasContainer}" disabled />
          <label for="container">${i18next.t('label.container')}</label>

          <input id="looseItem" type="checkbox" name="looseItem" ?checked="${this._looseItem}" disabled />
          <label for="looseItem">${i18next.t('label.loose_item')}</label>

          <input id="importCargo" type="checkbox" name="importCargo" ?checked="${this._importCargo}" disabled />
          <label>${i18next.t('label.import_cargo')}</label>

          <input id="ownTransport" type="checkbox" name="ownTransport" ?checked="${this._ownTransport}" disabled />
          <label>${i18next.t('label.own_transport')}</label>

          <input
            id="warehouseTransport"
            type="checkbox"
            name="warehouseTransport"
            ?checked="${!this._ownTransport}"
            disabled
          />
          <label>${i18next.t('label.warehouse_transport')}</label>

          ${this._crossDocking
            ? html`
                <input
                  id="crossDocking"
                  type="checkbox"
                  name="crossDocking"
                  ?checked="${this._crossDocking}"
                  disabled
                />
                <label for="crossDocking">${i18next.t('label.cross_docking')}</label>
              `
            : ''}
        </fieldset>

        <fieldset>
          <legend></legend>

          <label>${i18next.t('label.ref_no')}</label>
          <input name="refNo" readonly />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.do_no')}</label>
          <input name="deliveryOrderNo" ?hidden="${!this._ownTransport}" readonly />

          <label>${i18next.t('label.eta_date')}</label>
          <input name="etaDate" type="date" readonly />

          <label ?hidden="${this._importCargo || !this._ownTransport}">${i18next.t('label.truck_no')}</label>
          <input ?hidden="${this._importCargo || !this._ownTransport}" name="truckNo" readonly />

          <label ?hidden="${!this._hasContainer}">${i18next.t('label.container_no')}</label>
          <input ?hidden="${!this._hasContainer}" type="text" name="containerNo" readonly />

          <label>${i18next.t('label.container_size')}</label>
          <input type="text" name="containerSize" readonly />

          <label>${i18next.t('label.status')}</label>
          <select name="status" disabled>
            ${Object.keys(ORDER_STATUS).map(key => {
              const status = ORDER_STATUS[key]
              return html` <option value="${status.value}">${i18next.t(`label.${status.name}`)}</option> `
            })}
          </select>
        </fieldset>

        <fieldset>
          <legend>${i18next.t('title.assign_warehouse')}</legend>
          <label>${i18next.t('label.warehouse')}</label>
          <input id="buffer-location" name="buffer-location" readonly @click="${this._openBufferSelector.bind(this)}" />
        </fieldset>
      </form>

      <div class="gan-attachment-container" ?hidden="${this._attachments.length > 0 ? false : true}">
        <form name="ganAttachment" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.attachment')}</legend>
            <div class="gan-preview">
              ${(this._attachments || []).map(
                attachment =>
                  html`
                    <attachment-viewer
                      name="${attachment.name}"
                      src="${location.origin}/attachment/${attachment.path}"
                      .mimetype="${attachment.mimetype}"
                      .downloadable="${this._downloadable}"
                    ></attachment-viewer>
                  `
              )}
            </div>
          </fieldset>
        </form>
      </div>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

          <data-grist
            id="product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.productGristConfig}
            .data="${this.productData}"
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

          <data-grist
            id="vas-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.vasGristConfig}
            .data="${this.vasData}"
          ></data-grist>
        </div>

        <div class="guide-container">${this._template}</div>
      </div>
    `
  }

  constructor() {
    super()
    this.productData = { records: [] }
    this.vasData = { records: [] }
    this._downloadable = true
    this._attachments = []
    this._importedOrder = false
    this._ownTransport = true
  }

  get arrivalNoticeForm() {
    return this.shadowRoot.querySelector('form[name=arrivalNotice]')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  get bufferLocationField() {
    return this.shadowRoot.querySelector('input#buffer-location')
  }

  pageInitialized() {
    this.vasGristConfig = {
      list: { fields: ['targetType', 'targetDisplay', 'packingType'] },
      pagination: { infinite: true },
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.vas && record.vas.operationGuideType === 'template') {
              this._template = document.createElement(record.vas.operationGuide)
              this._template.record = { ...record, operationGuide: JSON.parse(record.operationGuide) }
            } else {
              this._template = null
            }
          }
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'set',
          header: i18next.t('field.set'),
          record: { align: 'center' },
          width: 100
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
          name: 'target',
          header: i18next.t('field.target'),
          record: {
            renderer: (value, column, record, rowIndex, field) => {
              if (record.targetType === VAS_BATCH_NO_TYPE) {
                return getRenderer()(record.targetBatchId, column, record, rowIndex, field)
              } else if (record.targetType === VAS_PRODUCT_TYPE) {
                return getRenderer('object')(record.targetProduct, column, record, rowIndex, field)
              } else if (record.targetType === VAS_BATCH_AND_PRODUCT_TYPE) {
                return getRenderer()(
                  `${record.targetBatchId} / ${record.targetProduct.name}`,
                  column,
                  record,
                  rowIndex,
                  field
                )
              } else if (record.targetType === VAS_ETC_TYPE) {
                return getRenderer()(record.otherTarget, column, record, rowIndex, field)
              }
            },
            align: 'center'
          },

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
          type: 'integer',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'center' },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.comment'),
          width: 350
        }
      ]
    }
  }

  pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._ganNo = changes.resourceId
      this._fetchGAN()
    }
  }

  async _fetchGAN() {
    if (!this._ganNo) return
    this._status = ''
    const response = await client.query({
      query: gql`
        query {
          arrivalNotice(${gqlBuilder.buildArgs({
            name: this._ganNo
          })}) {
            name
            bizplace {
              id
              name
            }
            containerNo
            ownTransport
            crossDocking
            etaDate
            deliveryOrderNo
            status
            truckNo
            refNo
            importCargo
            attachment {
              id
              name
              refBy
              path
              mimetype
            }
            orderProducts {
              id
              batchId
              product {
                name
                description
              }
              status
              packingType
              weight
              unit
              packQty
              totalWeight
              palletQty
              releaseQty
              releaseWeight
            }
            jobSheet {
              containerSize
            }
            orderVass {
              vas {
                name
                operationGuide
                operationGuideType
              }
              set
              targetType
              targetBatchId
              targetProduct {
                id
                name
                description
              }
              packingType
              qty
              weight
              otherTarget
              description
              remark
              status
              operationGuide
            }
          }
        }
      `
    })

    if (!response.errors) {
      const arrivalNotice = response.data.arrivalNotice
      const orderProducts = arrivalNotice.orderProducts
      const orderVass = arrivalNotice.orderVass
      this.orderBizplace = arrivalNotice.bizplace

      this._hasContainer = arrivalNotice.containerNo ? true : false
      this._ownTransport = arrivalNotice.ownTransport
      this._crossDocking = arrivalNotice.crossDocking
      this._importCargo = arrivalNotice.importCargo
      this._status = arrivalNotice.status
      this._fillupANForm({
        ...arrivalNotice,
        ...arrivalNotice.jobSheet
      })

      if (arrivalNotice && arrivalNotice?.attachment) {
        this._attachments = arrivalNotice && arrivalNotice.attachment
      }

      this.setProductGristConfig()
      this.productData = { records: orderProducts }
      this.vasData = {
        records: orderVass
          .sort((a, b) => a.set - b.set)
          .map(orderVas => {
            return {
              ...orderVas,
              set: `Set ${orderVas.set}`
            }
          })
      }
    }
  }

  setProductGristConfig() {
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

    let productGristColumns = [
      { type: 'gutter', gutterName: 'sequence' },
      {
        type: 'string',
        name: 'batchId',
        header: i18next.t('field.batch_no'),
        record: { align: 'center' },
        width: 150
      },
      {
        type: 'object',
        name: 'product',
        header: i18next.t('field.product'),
        record: { align: 'center', options: { queryName: 'products' } },
        width: 350
      },
      {
        type: 'code',
        name: 'packingType',
        header: i18next.t('field.packing_type'),
        record: { align: 'center', codeName: 'PACKING_TYPES' },
        width: 150
      },
      {
        type: 'float',
        name: 'weight',
        header: i18next.t('field.weight'),
        record: { align: 'center' },
        width: 80
      },
      {
        type: 'code',
        name: 'unit',
        header: i18next.t('field.unit'),
        record: { align: 'center', codeName: 'WEIGHT_UNITS' },
        width: 80
      },
      {
        type: 'integer',
        name: 'packQty',
        header: i18next.t('field.pack_qty'),
        record: { align: 'center' },
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

    if (this._crossDocking) {
      const packQtyColumnIdx =
        productGristColumns.findIndex(column => column.name === 'packQty') || productGristColumns.length - 1
      productGristColumns.splice(packQtyColumnIdx + 1, 0, ...crossDockingColumns)
    }

    this.productGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      columns: productGristColumns
    }
  }

  _openBufferSelector() {
    openPopup(
      html`
        <buffer-location-selector
          @selected="${e => {
            this.bufferLocationField.value = `${e.detail.name} ${
              e.detail.description ? `(${e.detail.description})` : ''
            }`
            this.bufferLocationField.setAttribute('location-id', e.detail.id)
          }}"
        ></buffer-location-selector>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.select_warehouse')
      }
    )
  }

  async _assignBufferLocation() {
    try {
      this._validateBufferLocation()

      let result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.assign_warehouse'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      if (this._crossDocking) {
        result = await CustomAlert({
          title: i18next.t('title.cross_docking'),
          text: i18next.t('text.picking_worksheet_will_be_generated'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) return
      }

      const response = await client.query({
        query: gql`
          mutation {
            generateArrivalNoticeWorksheet(${gqlBuilder.buildArgs({
              arrivalNoticeNo: this._ganNo,
              bufferLocation: { id: this.bufferLocationField.getAttribute('location-id') }
            })}) {
              unloadingWorksheet {
                name
              }
            }
          }
        `
      })

      if (!response.errors) {
        navigate(`inbound_worksheets`)
        this._showToast({ message: i18next.t('text.warehouse_is_assigned') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateBufferLocation() {
    if (!this.bufferLocationField.getAttribute('location-id'))
      throw new Error(i18next.t('text.warehouse_is_not_assigned'))
  }

  _fillupANForm(data) {
    this._fillupForm(this.arrivalNoticeForm, data)
  }

  _fillupForm(form, data) {
    for (let key in data) {
      Array.from(form.querySelectorAll('input, textarea, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
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

window.customElements.define('assign-buffer-location', AssignBufferLocation)
