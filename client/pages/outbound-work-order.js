import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

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
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }

        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        data-grist {
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
      title: i18next.t('title.outbound_work_order'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => {}
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.shipping_notice_master')}</legend>
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

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.shipping_notice_detail')}</h2>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.shippingNoticeConfig}
          .data=${this.shippingNoticeData}
        ></data-grist>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.editing_vas_request')}</h2>

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
      pagination: {
        infinite: true
      },
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
      pagination: {
        infinite: true
      },
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
