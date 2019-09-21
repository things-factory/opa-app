import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, store, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS } from './constants/order'
import './location-selector'
import Swal from 'sweetalert2'

class AssignBufferLocation extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _ganNo: String,
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
      title: i18next.t('title.assign_buffer_location'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        },
        {
          title: i18next.t('button.assign_buffer_location'),
          action: this._assignBufferLocation.bind(this)
        }
      ]
    }
  }

  get bufferLocationField() {
    return this.shadowRoot.querySelector('input#buffer-location')
  }

  activated(active) {
    if (JSON.parse(active)) {
      this.fetchGAN()
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.gan')}: ${this._ganNo}</legend>
          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" disabled />

          <input type="checkbox" name="ownTransport" ?checked="${this._ownTransport}" disabled />
          <label>${i18next.t('label.use_own_transport')}</label>

          <!-- Show when userOwnTransport is true -->
          <label ?hidden="${this._ownTransport}">${i18next.t('label.collection_date_time')}</label>
          <input ?hidden="${this._ownTransport}" name="collectionDateTime" type="datetime-local" disabled />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.from')}</label>
          <input ?hidden="${this._ownTransport}" name="from" disabled />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.to')}</label>
          <input ?hidden="${this._ownTransport}" name="to" disabled />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.loadType')}</label>
          <select ?hidden="${this._ownTransport}" name="loadType" disabled>
            ${LOAD_TYPES.map(
              loadType => html`
                <option value="${loadType.value}">${i18next.t(`label.${loadType.name}`)}</option>
              `
            )}
          </select>

          <!-- Show when userOwnTransport option is false-->
          <label ?hidden="${!this._ownTransport}">${i18next.t('label.transport_reg_no')}</label>
          <input ?hidden="${!this._ownTransport}" ?required="${this._ownTransport}" name="truckNo" disabled />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.delivery_order_no')}</label>
          <input ?hidden="${!this._ownTransport}" name="deliveryOrderNo" disabled />

          <label ?hidden="${!this._ownTransport}">${i18next.t('label.eta_date')}</label>
          <input
            ?hidden="${!this._ownTransport}"
            ?required="${this._ownTransport}"
            name="eta"
            type="datetime-local"
            disabled
          />

          <label>${i18next.t('label.status')}</label>
          <select name="status" disabled
            >${Object.keys(ORDER_STATUS).map(key => {
              const status = ORDER_STATUS[key]
              return html`
                <option value="${status.value}">${i18next.t(`label.${status.name}`)}</option>
              `
            })}</select
          >

          <label>${i18next.t('label.buffer_location')}</label>
          <input id="buffer-location" name="buffer-location" readonly @focus="${this._openBufferSelector.bind(this)}" />
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

        <data-grist
          id="product-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productGristConfig}
          .data="${this.productData}"
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
    if (!this._ganNo) return
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
            collectionDateTime
            eta
            from
            to
            loadType
            truckNo
            deliveryOrderNo
            status
            collectionOrder {
              id
              name
              description
            }
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
      this._arrivalNoticeId = response.data.arrivalNotice.id
      this._ownTransport = response.data.arrivalNotice.ownTransport
      this._fillupForm(response.data.arrivalNotice)
      this.productData = {
        ...this.productData,
        records: response.data.arrivalNotice.orderProducts
      }

      this.vasData = {
        ...this.vasData,
        records: response.data.arrivalNotice.orderVass
      }
    }
  }

  _fillupForm(arrivalNotice) {
    for (let key in arrivalNotice) {
      Array.from(this.form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = arrivalNotice[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(arrivalNotice[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = arrivalNotice[key]
        }
      })
    }
  }

  async _assignBufferLocation() {
    try {
      this._validateBufferLocation()
      const response = await client.query({
        query: gql`
          mutation {
            generateArrivalNoticeWorksheet(${gqlBuilder.buildArgs({
              arrivalNotice: { id: this._arrivalNoticeId, name: this._ganNo },
              bufferLocation: { id: this.bufferLocationField.getAttribute('location-id') }
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) {
        navigate(`worksheet_unloading/${response.data.generateArrivalNoticeWorksheet.name}`)
        Swal.fire({
          // position: 'top-end',
          type: 'info',
          title: 'Buffer location assigned',
          // showConfirmButton: false,
          timer: 1500
        })
        // this._showToast({ message: i18next.t('text.buffer_location_assigned') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateBufferLocation() {
    if (!this.bufferLocationField.getAttribute('location-id'))
      Swal.fire({
        // position: 'top-end',
        type: 'error',
        title: 'Buffer location is not assigned',
        // showConfirmButton: false,
        timer: 1500
      })
    //throw new Error(i18next.t('text.buffer_location_is_not_assigned'))
  }

  _openBufferSelector() {
    openPopup(
      html`
        <location-selector
          @selected="${e => {
            this.bufferLocationField.value = `${e.detail.name} ${
              e.detail.description ? `(${e.detail.description})` : ''
            }`
            this.bufferLocationField.setAttribute('location-id', e.detail.id)
          }}"
        ></location-selector>
      `,
      {
        backdrop: true,
        size: 'large'
      }
    )
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

window.customElements.define('assign-buffer-location', AssignBufferLocation)
