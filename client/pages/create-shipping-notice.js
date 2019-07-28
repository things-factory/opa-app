import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class CreateShippingNotice extends localize(i18next)(PageView) {
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
          overflow-x: auto;
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
      title: i18next.t('title.create_shipping_notice')
    }
  }

  render() {
    return html`
      <div>
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.shipping_notice')}</legend>
            <label>${i18next.t('label.customer_company')}</label>
            <input name="customer_company" />

            <label>${i18next.t('label.contact_point')}</label>
            <input name="contact_point" />

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="delivery_date" />

            <label>${i18next.t('label.contact_no')}</label>
            <input name="contact_number" />

            <input name="export" type="checkbox" />
            <label>${i18next.t('label.export')}</label>

            <label>${i18next.t('label.delivery_address')}</label>
            <input name="delivery_address" />

            <input name="need_fleet" type="checkbox" />
            <label>${i18next.t('label.need_fleet')}</label>

            <label>${i18next.t('label.fleet_spec')}</label>
            <input name="fleet_spec" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.shipping_notice_detail')}</h2>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productsConfig}
          .data=${this.productsData}
        ></data-grist>

        <div class="button-container">
          <mwc-button id="product-add">${i18next.t('button.add')}</mwc-button>
          <mwc-button id="product-save">${i18next.t('button.save')}</mwc-button>
        </div>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.vas_request')}</h2>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
        ></data-grist>

        <div class="button-container">
          <mwc-button id="product-add">${i18next.t('button.add')}</mwc-button>
          <mwc-button id="product-save">${i18next.t('button.save')}</mwc-button>
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
      records: new Array(50).fill().map(() => new Object())
    }
  }
}

window.customElements.define('create-shipping-notice', CreateShippingNotice)
