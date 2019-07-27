import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class ReceiveGoods extends localize(i18next)(PageView) {
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
        }

        data-grist {
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.receive_goods_master'),
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
      <div>
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.receive_goods_master')}</legend>
            <label>${i18next.t('label.work_order_goods_master')}</label>
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
            <input name="contact_no." />

            <label>${i18next.t('label.fax')}</label>
            <input name="fax" />

            <label>${i18next.t('label.eta')}</label>
            <input name="eta" />
          </fieldset>
        </form>
      </div>

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
          name: 'check box',
          header: i18next.t('field.check_box'),
          record: {
            align: 'center',
            editable: true
          }
        },
        {
          type: 'string',
          name: 'product code',
          header: i18next.t('field.product_code'),
          record: {
            align: 'center',
            editable: true
          }
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'center',
            editable: true
          }
        },
        {
          type: 'string',
          name: 'packing type',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'center',
            editable: true
          }
        },
        {
          type: 'number',
          name: 'pack quantity',
          header: i18next.t('field.pack_quantity'),
          record: {
            align: 'center',
            editable: true
          }
        },
        {
          type: 'number',
          name: 'total quantity',
          header: i18next.t('field.total_quantity'),
          record: {
            align: 'center',
            editable: true
          }
        },
        {
          type: 'number',
          name: 'container No.',
          header: i18next.t('field.catainer_no'),
          record: {
            align: 'center',
            editable: true
          }
        },
        {
          type: 'number',
          name: 'batch No.',
          header: i18next.t('field.product_code'),
          record: {
            align: 'center',
            editable: true
          }
        },
        {
          type: 'string',
          name: 'buffer location',
          header: i18next.t('field.buffer_location'),
          record: {
            align: 'center',
            editable: true
          }
        }
      ]
    }

    this.servicesData = {
      records: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    }
  }
}

window.customElements.define('receive-goods', ReceiveGoods)
