import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/simple-ui'
import { html, css } from 'lit-element'

class CreateArrivalNotice extends localize(i18next)(PageView) {
  static get properties() {
    return {
      productsConfig: Object,
      servicesConfig: Object,
      productsData: Object,
      servicesData: Object
    }
  }

  static get styles() {
    return css`
      :host {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-x: overlay;
        height: 100%;
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

  render() {
    return html`
      <div>
        <label>Arrival Notice</label>

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
        <label>Arrive Notice Detail</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productsConfig}
          .data=${this.productsData}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>

        <div class="button-container">
          <mwc-button id="product-add">Add</mwc-button>
          <mwc-button id="product-save">Save</mwc-button>
        </div>
      </div>

      <div class="grist">
        <label>VAS Request</label>
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>

        <div class="button-container">
          <mwc-button id="service-add">Add</mwc-button>
          <mwc-button id="service-save">Save</mwc-button>
        </div>
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
            align: 'center'
          },
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left'
          },
          width: 200
        },
        {
          type: 'string',
          name: 'packing_type',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'left'
          },
          width: 130
        },
        {
          type: 'string',
          name: 'pack_qty',
          header: i18next.t('field.pack_qty'),
          record: {
            align: 'left'
          },
          width: 80
        },
        {
          type: 'number',
          name: 'total_qty',
          header: i18next.t('field.total_qty'),
          record: {
            align: 'right'
          },
          width: 80
        },
        {
          type: 'number',
          name: 'container_no',
          header: i18next.t('field.container_no'),
          record: {
            align: 'right'
          },
          width: 130
        },
        {
          type: 'string',
          name: 'batch_no',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'center'
          },
          width: 200
        }
      ]
    }

    this.productsData = {
      records: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
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
            align: 'center'
          },
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left'
          },
          width: 200
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: {
            align: 'right'
          },
          width: 100
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: {
            align: 'center'
          },
          width: 100
        },
        {
          type: 'number',
          name: 'price',
          header: i18next.t('field.price'),
          record: {
            align: 'right'
          },
          width: 100
        }
      ]
    }

    this.servicesData = {
      records: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    }
  }
}

window.customElements.define('create-arrival-notice', CreateArrivalNotice)
