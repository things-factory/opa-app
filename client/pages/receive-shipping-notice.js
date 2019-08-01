// Services,description,quantity,unit,status
import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { SearchFormStyles } from '@things-factory/form-ui'

class ReceiveShippingNotice extends localize(i18next)(PageView) {
  static get properties() {
    return {
      shippingConfig: Object,
      shippingData: Object
    }
  }

  static get styles() {
    return [
      SearchFormStyles,
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
      title: i18next.t('title.receive_shipping_notice'),
      actions: [
        {
          title: i18next.t('button.receive'),
          action: () => {}
        }
      ]
    }
  }

  render() {
    return html`
      <form class="search-form">
        <label>${i18next.t('label.company')}</label>
        <input name="company" />

        <label>${i18next.t('label.delivery_date')}</label>
        <input name="delivery_date" />

        <label>${i18next.t('label.fleet_no')}</label>
        <input name="fleet_no" />

        <label>${i18next.t('label.driver')}</label>
        <input name="driver" />

        <label>${i18next.t('label.delivery_address')}</label>
        <input name="delivery_addr" />

        <label>${i18next.t('label.fleet_spec')}</label>
        <input name="fleet_spec" />
      </form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.shippingConfig}
        .data=${this.shippingData}
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
    this.shippingConfig = {
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
          name: 'company',
          header: i18next.t('field.company'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'delivary_date',
          header: i18next.t('field.delivary_date'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'contact_point',
          header: i18next.t('field.contact_point'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'number',
          name: 'contact_number',
          header: i18next.t('field.contact_number'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'delivery_address',
          header: i18next.t('field.delivery_address'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'export',
          header: i18next.t('field.export'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'need_fleet',
          header: i18next.t('field.need_fleet'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'fleet_spec',
          header: i18next.t('field.fleet_spec'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'confirm_date',
          header: i18next.t('field.confirm_date'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'receive_date',
          header: i18next.t('field.receive_date'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'REJECT DATE',
          header: i18next.t('field.reject_date'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'number',
          name: 'FLLET NO',
          header: i18next.t('field.fleet_no'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'driver',
          header: i18next.t('field.driver'),
          record: {
            align: 'center'
          },
          editable: true
        }
      ]
    }

    this.shippingData = {
      records: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    }
  }
}

window.customElements.define('receive-shipping-notice', ReceiveShippingNotice)
