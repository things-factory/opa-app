import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../../popup-note'
import { LOAD_TYPES, ORDER_STATUS } from '../constants/order'

class ReceiveArrivalNotice extends connect(store)(localize(i18next)(PageView)) {
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
      title: i18next.t('title.receive_arrival_notice'),
      actions: [
        {
          title: i18next.t('button.reject'),
          action: this._rejectArrivalNotice.bind(this)
        },
        {
          title: i18next.t('button.receive'),
          action: this._receiveArrivalNotice.bind(this)
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
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
          <legend>${i18next.t('title.gan_no')}: ${this._ganNo}</legend>
          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" disabled />

          <input type="checkbox" name="ownTransport" ?checked="${this._ownTransport}" disabled />
          <label>${i18next.t('label.use_own_transport')}</label>

          <!-- Show when userOwnTransport is true -->
          <label ?hidden="${this._ownTransport}">${i18next.t('label.collection_date')}</label>
          <input ?hidden="${this._ownTransport}" name="collectionDateTime" type="datetime-local" disabled />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.from')}</label>
          <input ?hidden="${this._ownTransport}" name="from" disabled />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.to')}</label>
          <input ?hidden="${this._ownTransport}" name="to" disabled />

          <label ?hidden="${this._ownTransport}">${i18next.t('label.load_type')}</label>
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

  pageInitialized() {
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
          width: 350
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
      Array.from(this.form.querySelectorAll('input, textarea, select')).forEach(field => {
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

  async _receiveArrivalNotice() {
    const response = await client.query({
      query: gql`
        mutation {
          receiveArrivalNotice(${gqlBuilder.buildArgs({
            name: this._ganNo
          })}) {
            name
          }
        }
      `
    })

    if (!response.errors) {
      history.back()

      this._showToast({ message: i18next.t('text.arrival_notice_received') })
    }
  }

  async _rejectArrivalNotice() {
    openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.remark')}"
          @submit="${async e => {
            try {
              if (!e.detail.remark) throw new Error(i18next.t('text.remark_is_empty'))
              const response = await client.query({
                query: gql`
                mutation {
                  rejectArrivalNotice(${gqlBuilder.buildArgs({
                    name: this._ganNo,
                    patch: { remark: e.detail.value }
                  })}) {
                    name
                  }
                }
              `
              })

              if (!response.errors) {
                navigate('arrival_notice_requests')
                this._showToast({ message: i18next.t('text.arrival_notice_rejected') })
              }
            } catch (e) {
              this._showToast(e)
            }
          }}"
        ></popup-note>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.reject_arrival_notice')
      }
    )
  }

  _getTextAreaByName(name) {
    return this.shadowRoot.querySelector(`textarea[name=${name}]`)
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

window.customElements.define('receive-arrival-notice', ReceiveArrivalNotice)
