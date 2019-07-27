import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/simple-ui'
import { css, html } from 'lit-element'
import { SearchFormStyles } from '../styles'

class ConfirmArrivalNotice extends localize(i18next)(PageView) {
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
    ]
  }

  get context() {
    return {
      title: i18next.t('title.confirm_arrival_notice')
    }
  }

  render() {
    return html`
      <div>
        <form class="search-form">
          <label>${i18next.t('label.gan')}</label>
          <input name="gan" />

          <label>${i18next.t('label.eta')}</label>
          <input name="eta" />

          <label>${i18next.t('label.delivery_no')}</label>
          <input name="delivery_no" />

          <label>${i18next.t('label.company')}</label>
          <input name="company" />

          <label>${i18next.t('label.supplier_name')}</label>
          <input name="supplier_name" />
        </form>
      </div>

      <div class="grist">
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
      </div>

      <div class="button-container">
        <mwc-button>${i18next.t('button.confirm')}</mwc-button>
      </div>
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
          name: 'company',
          header: i18next.t('field.company'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'purchase_order',
          header: i18next.t('field.purchase_order'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'supplier_name',
          header: i18next.t('field.supplier_name'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'gan',
          header: i18next.t('field.gan'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'delivery_order_no',
          header: i18next.t('field.delivery_order_no'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'eta',
          header: i18next.t('field.eta'),
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

window.customElements.define('confirm-arrival-notice', ConfirmArrivalNotice)
