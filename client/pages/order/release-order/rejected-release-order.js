import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES } from '../constants/order'

class RejectedReleaseOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _releaseOrderNo: String,
      _ownTransport: Boolean,
      _exportOption: Boolean,
      inventoryGristConfig: Object,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
      _status: String
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
      title: i18next.t('title.rejected_release_order'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ]
    }
  }

  render() {
    return html`
        <form name="releaseOrder" class="multi-column-form">
          <fieldset>
          <legend>${i18next.t('title.release_order_no')}: ${this._releaseOrderNo}</legend>
            <label>${i18next.t('label.release_date')}</label>
            <input name="releaseDate" type="date" readonly/>

            <label>${i18next.t('label.rejection_remark')}</label>
            <textarea name="remark" type="text" readonly></textarea>

            <label ?hidden="${!this._ownTransport}">${i18next.t('label.co_no')}</label>
            <input name="collectionOrderNo" ?hidden="${!this._ownTransport}" readonly/>

            <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
            <input name="truckNo" ?hidden="${!this._ownTransport}" readonly/>

            <input
            id="exportOption"
            type="checkbox"
            name="exportOption"
            ?checked="${this._exportOption}"
            disabled
            />
            <label>${i18next.t('label.export')}</label>

            <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            ?hidden="${this._exportOption}"
            disabled
            />
            <label ?hidden="${this._exportOption}">${i18next.t('label.own_transport')}</label>
          </fieldset>
        </form>
      </div>

      <div class="so-form-container" ?hidden="${!this._exportOption || (this._exportOption && !this._ownTransport)}">
        <form name="shippingOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.export_order')}</legend>
            <label>${i18next.t('label.container_no')}</label>
            <input name="containerNo" readonly/>

            <label>${i18next.t('label.container_arrival_date')}</label>
            <input 
              name="containerArrivalDate" 
              type="date"  
              readonly
            />

            <label>${i18next.t('label.container_leaving_date')}</label>
            <input name="containerLeavingDate" type="date" readonly/>

            <label>${i18next.t('label.ship_name')}</label>
            <input name="shipName" readonly/>

          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_product_list')}</h2>

        <data-grist
          id="inventory-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.inventoryGristConfig}
          .data=${this.inventoryData}
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

      <div class="do-form-container" ?hidden="${this._exportOption || (!this._exportOption && this._ownTransport)}">
        <form name="deliveryOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.delivery_order')}</legend>

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="deliveryDate" type="date" readonly/>

            <label>${i18next.t('label.destination')}</label>
            <input name="to" readonly/>

            <label>${i18next.t('label.load_type')}</label>
            <select name="loadType" disabled>
              <option value=""></option>
              ${this._loadTypes.map(
                loadType => html`
                  <option value="${loadType.name}">${i18next.t(`label.${loadType.description}`)}</option>
                `
              )}
            </select>

            <label>${i18next.t('label.tel_no')}</label>
            <input delivery name="telNo"/>

            <!--label>${i18next.t('label.document')}</label>
            <input name="attiachment" type="file" /-->
          </fieldset>
        </form>
      </div>
    `
  }

  constructor() {
    super()
    this._exportOption = false
    this._ownTransport = true
    this.inventoryData = { records: [] }
    this.vasData = { records: [] }
    this._loadTypes = []
  }

  get releaseOrderForm() {
    return this.shadowRoot.querySelector('form[name=releaseOrder]')
  }

  get deliveryOrderForm() {
    return this.shadowRoot.querySelector('form[name=deliveryOrder]')
  }

  get shippingOrderForm() {
    return this.shadowRoot.querySelector('form[name=shippingOrder]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async firstUpdated() {
    this._loadTypes = await getCodeByName('LOAD_TYPES')
  }

  async pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._releaseOrderNo = changes.resourceId
      await this._fetchReleaseOrder()
    }
  }

  pageInitialized() {
    this.inventoryGristConfig = {
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
              this.inventoryData = { ...this.inventoryData, records: newData }
              this.inventoryGrist.dirtyData.records = newData
              this._updateBatchList()
            }
          }
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.release_inventory_list'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'center',
            codeName: 'PACKING_TYPES'
          },
          width: 150
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.available_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { align: 'center', options: { min: 0 } },
          width: 100
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
          record: { align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { align: 'center', options: ['', i18next.t('label.all')] },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'center' },
          width: 350
        }
      ]
    }
  }

  async _fetchReleaseOrder() {
    this._status = ''
    const response = await client.query({
      query: gql`
        query {
          releaseGoodDetail(${gqlBuilder.buildArgs({
            name: this._releaseOrderNo
          })}) {
            id
            name
            truckNo
            status
            ownTransport
            exportOption
            releaseDate
            collectionOrderNo
            remark
            inventoryInfos {
              name
              batchId
              packingType
              qty
              releaseQty
              product {
                name
                description
              }
              location {
                name
              }              
            }
            shippingOrder {
              containerNo
              containerLeavingDate
              containerArrivalDate
              shipName
            }
            deliveryOrder {
              to
              loadType
              deliveryDate
              telNo
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
      const releaseOrder = response.data.releaseGoodDetail
      const deliveryOrder = releaseOrder.deliveryOrder
      const shippingOrder = releaseOrder.shippingOrder
      const orderInventories = releaseOrder.inventoryInfos
      const orderVass = releaseOrder.orderVass

      this._exportOption = response.data.releaseGoodDetail.exportOption
      if (this._exportOption) {
        this._ownTransport = true
      } else if (!this._exportOption) {
        this._ownTransport = response.data.releaseGoodDetail.ownTransport
      }
      this._status = releaseOrder.status

      this._fillupRGForm(response.data.releaseGoodDetail)
      if (this._exportOption) this._fillupSOForm(shippingOrder)
      if (!this._ownTransport) this._fillupDOForm(deliveryOrder)

      this.inventoryData = { records: orderInventories }
      this.vasData = { records: orderVass }
    }
  }

  _fillupRGForm(data) {
    this._fillupForm(this.releaseOrderForm, data)
  }

  _fillupDOForm(data) {
    this._fillupForm(this.deliveryOrderForm, data)
  }

  _fillupSOForm(data) {
    this._fillupForm(this.shippingOrderForm, data)
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

window.customElements.define('rejected-release-order', RejectedReleaseOrder)
