import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView, store } from '@things-factory/shell'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '@things-factory/simple-ui'
import { css, html } from 'lit-element'

class ArrivalNoticeDetail extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      productsConfig: Object,
      servicesConfig: Object,
      productsData: Object,
      servicesData: Object,
      _orderId: String
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        overflow-x: overlay;
      }
      .grist {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      data-grist {
        overflow-y: hidden;
        flex: 1;
      }
    `
  }

  get context() {
    return {
      title: i18next.t('title.create_arrival_notice')
    }
  }

  render() {
    return html`
      <div>
        <label>${i18next.t('title.arrival_notice')}</label>

        <form>
          <input name="purchase-order" />
          <input name="supplier-name" />
          <input name="gan" />
          <input name="delivery-order-no" />
          <input name="contact-point" />
          <input name="contact-no" />
          <input name="eta" />
          <input name="fax" />
        </form>
      </div>

      <div class="grist">
        <label>${i18next.t('title.arrival_notice_detail')}</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productsConfig}
          .data=${this.productsData}
        ></data-grist>
      </div>

      <div class="grist">
        <label>${i18next.t('title.vas_request')}</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
        ></data-grist>
      </div>
    `
  }

  firstUpdated() {
    this.productsConfig = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'delete'
        },
        {
          type: 'string',
          name: 'product_code',
          header: i18next.t('field.product_code'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 200
        },
        {
          type: 'string',
          name: 'packing_type',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'left',
            editable: true
          },
          width: 130
        },
        {
          type: 'string',
          name: 'pack_qty',
          header: i18next.t('field.pack_qty'),
          record: {
            align: 'left',
            editable: true
          },
          width: 80
        },
        {
          type: 'float',
          name: 'total_qty',
          header: i18next.t('field.total_qty'),
          record: {
            align: 'right',
            editable: true
          },
          width: 80
        },
        {
          type: 'float',
          name: 'container_no',
          header: i18next.t('field.container_no'),
          record: {
            align: 'right',
            editable: true
          },
          width: 130
        },
        {
          type: 'string',
          name: 'batch_no',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'center',
            editable: true
          },
          width: 200
        }
      ]
    }

    this.productsData = {
      records: new Array(20).fill().map(el => new Object())
    }

    this.servicesConfig = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'delete'
        },
        {
          type: 'string',
          name: 'service',
          header: i18next.t('field.service'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 200
        },
        {
          type: 'float',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: {
            align: 'right',
            editable: true
          },
          width: 100
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: {
            align: 'center',
            editable: true
          },
          width: 100
        },
        {
          type: 'float',
          name: 'price',
          header: i18next.t('field.price'),
          record: {
            align: 'right',
            editable: true
          },
          width: 100
        }
      ]
    }
  }

  stateChanged(state) {
    this._orderId = state.route.resourceId
  }

  updated(changedProps) {
    if (changedProps.has('_orderId')) {
      this._getOrderInfo(this._orderId)
    }
  }

  _getOrderInfo() {
    console.log('Order Id is changed', this._orderId)
  }
}

window.customElements.define('arrival-notice-detail', ArrivalNoticeDetail)
