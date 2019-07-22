import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/simple-ui'
import { css, html } from 'lit-element'

class OutboundWorkOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      shippingNoticeConfig: Object,
      servicesConfig: Object,
      shippingNoticeData: Object,
      servicesData: Object
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
      .button-container {
        display: flex;
        margin-left: auto;
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
        <label>${i18next.t('title.Shipping Notice Master')}</label>

        <form>
          <input name="work_order_no" />
          <input name="customer_company" />
          <input name="contact_point" />
          <input name="delivery_date" />
          <input name="contact_number" />
          <input name="export" />
          <input name="delivery_address" />
          <input name="need_fleet" />
          <input name="fleet_spec" />
        </form>
        <div class="button-container">
          <mwc-button id="service-save">${i18next.t('button.save')}</mwc-button>
        </div>
      </div>

      <div class="grist">
        <label>${i18next.t('title.Shipping Notice Detail')}</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.shippingNoticeConfig}
          .data=${this.shippingNoticeData}
        ></data-grist>
      </div>

      <div class="grist">
        <label>${i18next.t('title.Editing VAS Request')}</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
        ></data-grist>
      </div>
    `
  }

  firstUpdated() {
    this.shippingNoticeConfig = {
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
          width: 100
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'center',
            editable: true
          },
          width: 100
        },
        {
          type: 'string',
          name: 'packing_type',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'center',
            editable: true
          },
          width: 100
        },
        {
          type: 'number',
          name: 'pack_quantity',
          header: i18next.t('field.pack_quantity'),
          record: {
            align: 'center',
            editable: true
          },
          width: 100
        },
        {
          type: 'number',
          name: 'total_quantity',
          header: i18next.t('field.total_quantity'),
          record: {
            align: 'center',
            editable: true
          },
          width: 100
        },
        {
          type: 'string',
          name: 'batch_no',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'center',
            editable: true
          },
          width: 100
        },
        {
          type: 'string',
          name: 'location',
          header: i18next.t('field.location'),
          record: {
            align: 'center',
            editable: true
          },
          width: 100
        }
      ]
    }

    this.shippingNoticeData = {
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
          name: 'services',
          header: i18next.t('field.services'),
          record: {
            align: 'center',
            editable: true
          },
          width: 100
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'center',
            editable: true
          },
          width: 100
        },
        {
          type: 'number',
          name: 'quantity',
          header: i18next.t('field.quantity'),
          record: {
            align: 'center',
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
        }
      ]
    }

    this.servicesData = {
      records: new Array(20).fill().map(() => new Object())
    }
  }
}

window.customElements.define('outbound-work-order', OutboundWorkOrder)
