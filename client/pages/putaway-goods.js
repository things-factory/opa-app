import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/simple-ui'
import { css, html } from 'lit-element'

class PutawayGoods extends localize(i18next)(PageView) {
  static get properties() {
    return {
      servicesConfig: Object,
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
      .input-area {
        flex: 1;
      }
      .scan-area {
        flex: 1;
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
      <div class="input-area">
        <label>${i18next.t('title.putaway_goods_master')}</label>

        <form>
          <label>${i18next.t('label.work_order')}</label>
          <input name="work_order" />

          <label>${i18next.t('label.purchase_order')}</label>
          <input name="purchase_order" />

          <label>${i18next.t('label.supplier_name')}</label>
          <input name="supplier_name" />

          <label>${i18next.t('label.gan')}</label>
          <input name="gan" />

          <label>${i18next.t('label.do_no')}</label>
          <input name="do_no" />

          <label>${i18next.t('label.contact_point')}</label>
          <input name="contact_point" />

          <label>${i18next.t('label.contact_no')}</label>
          <input name="contact_no" />

          <label>${i18next.t('label.fax')}</label>
          <input name="fax" />

          <label>${i18next.t('label.eta')}</label>
          <input name="eta" />
        </form>
      </div>

      <div class="scan-area">
        <label>${i18next.t('title.putaway_goods_scan_area')}</label>
        <input name="product-barcode" />
        <input name="location" />
      </div>

      <div class="grist">
        <label>${i18next.t('title.putaway_goods_detail')}</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
        ></data-grist>
      </div>
    `
  }

  firstUpdated() {
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
          name: 'product_code',
          header: i18next.t('field.product_code'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'packing_type',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'number',
          name: 'pack_quantity',
          header: i18next.t('field.pack_quantity'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'total_quantity',
          name: 'total_quantity',
          header: i18next.t('field.total_quantity'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'number',
          name: 'container_no',
          header: i18next.t('field.container_no'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'number',
          name: 'batch_no',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'status',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'location',
          header: i18next.t('field.location'),
          record: {
            align: 'center'
          },
          editable: true
        }
      ]
    }

    this.servicesData = {
      records: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    }
  }
}

window.customElements.define('putaway-goods', PutawayGoods)
