import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class InboundWorkOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      productsConfig: Object,
      productsData: Object,
      servicesConfig: Object,
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
      title: i18next.t('title.inbound_work_order')
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('field.work_order')}<span>BARCODE</span></legend>
          <label>${i18next.t('label.purchase_order')}</label>
          <input name="purchase_order" />

          <label>${i18next.t('label.supplier_name')}</label>
          <input name="supplier_name" />

          <label>${i18next.t('label.gan')}</label>
          <input name="gan" />

          <label>${i18next.t('label.delivery_no')}</label>
          <input name="delivery_no" />

          <label>${i18next.t('label.contact_point')}</label>
          <input name="contact_point" />

          <label>${i18next.t('label.contact_no')}</label>
          <input name="contact_no" />

          <label>${i18next.t('label.fax')}</label>
          <input name="fax" />

          <label>${i18next.t('label.eta')}</label>
          <input name="eta" />
        </fieldset>
      </form>

      <div class="grist">
        <h2>${i18next.t('title.arrival_notice_detail')}</h2>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productsConfig}
          .data=${this.productsData}
        ></data-grist>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.vas_request')}</h2>

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
            align: 'center'
          },
          width: 120
        },
        {
          type: 'string',
          name: 'packing_type',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'center'
          },
          width: 120
        },
        {
          type: 'string',
          name: 'pack_qty',
          header: i18next.t('field.pack_qty'),
          record: {
            align: 'center'
          },
          width: 120
        },
        {
          type: 'string',
          name: 'total_qty',
          header: i18next.t('field.total_qty'),
          record: {
            align: 'center'
          },
          width: 120
        },
        {
          type: 'string',
          name: 'container_no',
          header: i18next.t('field.container_no'),
          record: {
            align: 'center'
          },
          width: 120
        },
        {
          type: 'string',
          name: 'batch_no',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'center'
          },
          width: 120
        }
      ]
    }

    this.productsData = {
      records: new Array(50).fill().map(() => new Object())
    }

    this.servicesConfig = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
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
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            align: 'center'
          },
          width: 100
        }
      ]
    }

    this.servicesData = {
      records: new Array(50).fill().map(() => new Object())
    }
  }
}

window.customElements.define('inbound-work-order', InboundWorkOrder)
