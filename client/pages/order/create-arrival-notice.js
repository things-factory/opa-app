import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

// TODO: transport base의 ENUM 임포트 하도록 수정
const LOAD_TYPE = [{ name: 'Full container load', value: 'fcl' }, { name: 'Low container load', value: 'lcl' }]

class CreateArrivalNotice extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _transportFlag: Boolean,
      productGristConfig: Object,
      vasGristConfig: Object
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
          background-color: var(--main-section-background-color);
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
      title: i18next.t('title.create_arrival_notice')
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.arrival_notice')}</legend>
          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" />

          <label>${i18next.t('label.transport_option')}</label>
          <input
            type="checkbox"
            name="transportFlag"
            @change=${e => {
              this._transportFlag = e.currentTarget.checked
            }}
          />

          <!-- Show when transportFlag is true -->
          <label ?hidden="${!this._transportFlag}">${i18next.t('label.picking_date')}</label>
          <input ?hidden="${!this._transportFlag}" name="pickingDate" type="date" />

          <label ?hidden="${!this._transportFlag}">${i18next.t('label.picking_time')}</label>
          <input ?hidden="${!this._transportFlag}" name="pickingTime" type="time" />

          <label ?hidden="${!this._transportFlag}">${i18next.t('label.from')}</label>
          <input ?hidden="${!this._transportFlag}" name="from" />

          <label ?hidden="${!this._transportFlag}">${i18next.t('label.loadType')}</label>
          <select ?hidden="${!this._transportFlag}" name="loadType">
            ${LOAD_TYPE.map(
              loadType => html`
                <option value="${loadType.value}">${loadType.name}</option>
              `
            )}
          </select>

          <!-- Show when transportFlag option is false-->
          <label ?hidden="${this._transportFlag}">${i18next.t('label.transport_reg_no')}</label>
          <input ?hidden="${this._transportFlag}" name="transportRegNo" />

          <label ?hidden="${this._transportFlag}">${i18next.t('label.delivery_order_no')}</label>
          <input ?hidden="${this._transportFlag}" name="deliveryOrderNo" />

          <label ?hidden="${this._transportFlag}">${i18next.t('label.eta_date')}</label>
          <input ?hidden="${this._transportFlag}" name="etaDate" type="date" />

          <label ?hidden="${this._transportFlag}">${i18next.t('label.eta_time')}</label>
          <input ?hidden="${this._transportFlag}" name="etaTime" type="time" />
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

        <data-grist
          id="product-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productGristConfig}
          .data="${this.productData}"
        ></data-grist>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this.productData = {}
    this.vasData = {}
  }

  firstUpdated() {
    this.productGristConfig = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'products'
            }
          },
          width: 200
        },
        {
          type: 'object',
          name: 'productOption',
          header: i18next.t('field.product_option'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'productOptions'
            }
          },
          width: 200
        },
        {
          type: 'object',
          name: 'productOptionDetail',
          header: i18next.t('field.product_option_detail'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'productOptionDetails'
            }
          },
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: false, align: 'left' },
          width: 150
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { editable: true, align: 'right' },
          width: 80
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { editable: true, align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { editable: true, align: 'right' },
          width: 80
        }
      ]
    }

    this.vasGristConfig = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'vass'
            }
          },
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: false, align: 'left' },
          width: 150
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 200
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: {
            editable: true
          },
          width: 250
        }
      ]
    }
  }
}

window.customElements.define('create-arrival-notice', CreateArrivalNotice)
