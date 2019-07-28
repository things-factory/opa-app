import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { SearchFormStyles } from '../styles'

class ConfirmTransportOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      config: Object,
      data: Object
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
      title: i18next.t('title.confirm_transport_order'),
      actions: [
        {
          title: i18next.t('button.confirm'),
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
        <input name="delivery_address" />

        <label>${i18next.t('label.fleet_spec')}</label>
        <input name="fleet_spec" />
      </form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .data=${this.data}
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
    this.config = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
        },
        {
          type: 'gutter',
          name: 'row-selector',
          multiple: true
        },
        {
          type: 'string',
          name: 'delivery_date',
          header: i18next.t('field.delivery_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'customer_company',
          header: i18next.t('field.customer_company'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'contact_point',
          header: i18next.t('field.contact_point'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'contact_number',
          header: i18next.t('field.contact_number'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'delivery_address',
          header: i18next.t('field.delivery_address'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'fleet_spec',
          header: i18next.t('field.fleet_spec'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'confirm_date',
          header: i18next.t('field.confirm_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'receive_date',
          header: i18next.t('field.receive_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'reject_date',
          header: i18next.t('field.reject_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'fleet_no',
          header: i18next.t('field.fleet_no'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'driver',
          header: i18next.t('field.driver'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        }
      ],
      pagination: {
        pages: [20, 30, 50, 100, 200],
        page: 30,
        limit: 50
      }
    }

    this.data = {
      records: new Array(50).fill().map(() => new Object())
    }
  }
}

window.customElements.define('confirm-transport-order', ConfirmTransportOrder)
