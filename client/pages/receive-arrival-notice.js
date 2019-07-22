import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/simple-ui'
import { css, html } from 'lit-element'

class ReceiveArrivalNotice extends localize(i18next)(PageView) {
  static get properties() {
    return {
      arriveConfig: Object,
      arriveData: Object
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
      .search-form {
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
    `
  }

  render() {
    return html`
      <div class="search-form">
        <form>
          <input name="gan" />
          <input name="eta" />
          <input name="do-no" />
          <input name="company" />
          <input name="supplier-name" />
        </form>
      </div>

      <div class="grist">
        <label>${i18next.t('title.receive-arrival-notice')}</label>
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.arriveConfig}
          .data=${this.arriveData}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>
      </div>
      <div class="button-container">
        <mwc-button id="service-receive">${i18next.t('button.receive')}</mwc-button>
      </div>
    `
  }

  firstUpdated() {
    this.arriveConfig = {
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
          name: 'purchase_order',
          header: i18next.t('field.purchase_order'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'supplier_name',
          header: i18next.t('field.supplier_name'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'gan',
          header: i18next.t('field.gan'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'do_no',
          header: i18next.t('field.do_no'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'eta',
          header: i18next.t('field.eta'),
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
          name: 'reject_date',
          header: i18next.t('field.reject_date'),
          record: {
            align: 'center'
          },
          editable: true
        }
      ]
    }

    this.arriveData = {
      records: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    }
  }
}

window.customElements.define('receive-arrival-notice', ReceiveArrivalNotice)
