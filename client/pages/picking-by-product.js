import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/simple-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class PickingByProduct extends localize(i18next)(PageView) {
  static get properties() {
    return {
      productsConfig: Object,
      servicesConfig: Object,
      productsData: Object,
      servicesData: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
        }
        .input-area {
          display: flex;
          flex: 1;
        }
        .scan-area {
          display: flex;
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
        .button-container {
          display: flex;
          margin-left: auto;
        }
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.picking_by_product')
    }
  }

  render() {
    return html`
      <div class="input-area">
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.picking_by_unit_master')}</legend>
            <label>${i18next.t('label.work_order_no')}</label>
            <input name="work_order_no" />

            <label>${i18next.t('label.customer_company')}</label>
            <input name="customer_company" />

            <label>${i18next.t('label.contact_point')}</label>
            <input name="contact_point" />

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="delivery_date" />

            <label>${i18next.t('label.contact_no')}</label>
            <input name="contact_number" />

            <label>${i18next.t('label.export')}</label>
            <input name="export" />

            <label>${i18next.t('label.delivery_address')}</label>
            <input name="delivery_address" />

            <label>${i18next.t('label.need_fleet')}</label>
            <input name="need_fleet" />

            <label>${i18next.t('label.fleet_spec')}</label>
            <input name="fleet_spec" />
          </fieldset>
        </form>
        <div class="button-container">
          <mwc-button id="product-save">${i18next.t('button.save')}</mwc-button>
        </div>
      </div>

      <div class="scan-area">
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.picking_by_unit_scan_area')}</legend>
            <label>${i18next.t('label.product_barcode')}</label>
            <input name="product_barcode" />

            <label>${i18next.t('label.location')}</label>
            <input name="location" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.picking_by_unit_detail')}</h2>

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
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'packing_type',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'number',
          name: 'pack_quantity',
          header: i18next.t('field.pack_quantity'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'number',
          name: 'total_quantity',
          header: i18next.t('field.total_quantity'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'batch_no',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'location',
          header: i18next.t('field.location'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        }
      ]
    }

    this.servicesData = {
      records: new Array(20).fill().map(() => new Object())
    }
  }
}

window.customElements.define('picking-by-product', PickingByProduct)
