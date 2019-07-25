import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/simple-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class ReceiveArrivalNotice extends localize(i18next)(PageView) {
  static get properties() {
    return {
      arriveConfig: Object,
      arriveData: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
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
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
      `
    ]
  }

  render() {
    return html`
      <div>
        <!-- <div class="search-form"> -->
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('label.gan')}</legend>
            <label>${i18next.t('label.gan')}</label>
            <input name="gan" />

            <label>${i18next.t('label.eta')}</label>
            <input name="eta" />

            <label>${i18next.t('label.do_no')}</label>
            <input name="do_no" />

            <label>${i18next.t('label.company')}</label>
            <input name="company" />

            <label>${i18next.t('label.supplier_name')}</label>
            <input name="supplier_name" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.receive_arrival_notice')}</h2>
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
          width: 120,
          header: i18next.t('field.company'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'link',
          name: 'purchase_order',
          width: 160,
          header: i18next.t('field.purchase_order'),
          record: {
            align: 'center',
            options: {
              href: function(column, record, rowIndex) {
                return `${location.origin}/arrival-notice-detail/${record.purchase_order}`
              }
            }
          },
          editable: true
        },
        {
          type: 'string',
          name: 'supplier_name',
          width: 120,
          header: i18next.t('field.supplier_name'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'gan',
          width: 120,
          header: i18next.t('field.gan'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'do_no',
          width: 120,
          header: i18next.t('field.do_no'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'datetime',
          name: 'eta',
          width: 120,
          header: i18next.t('field.eta'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'status',
          width: 120,
          header: i18next.t('field.status'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'date',
          name: 'confirm_date',
          width: 120,
          header: i18next.t('field.confirm_date'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'date',
          name: 'receive_date',
          width: 120,
          header: i18next.t('field.receive_date'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'date',
          name: 'reject_date',
          width: 120,
          header: i18next.t('field.reject_date'),
          record: {
            align: 'center'
          },
          editable: true
        }
      ]
    }

    this.arriveData = {
      records: [
        {
          company: 'Company',
          purchase_order: 'ORD-1002034',
          supplier_name: 'HatioLab',
          gan: 'GAN-1995820385',
          do_no: 'DO-195877392-02-49185',
          eta: Date.now(),
          statue: 'ARRIVED',
          confirm_date: Date.now(),
          receive_date: Date.now(),
          reject_date: Date.now()
        }
      ],
      total: 1
    }
  }
}

window.customElements.define('receive-arrival-notice', ReceiveArrivalNotice)
