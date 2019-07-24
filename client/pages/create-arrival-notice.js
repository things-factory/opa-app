import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/simple-ui'
import { css, html } from 'lit-element'
import '../components/resource-selector'

class CreateArrivalNotice extends localize(i18next)(PageView) {
  static get properties() {
    return {
      productsConfig: Object,
      servicesConfig: Object,
      productsData: Object,
      servicesData: Object
    }
  }

  static get styles() {
    return css`
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
  }

  get context() {
    return {
      title: i18next.t('title.create_arrival_notice')
    }
  }

  render() {
    return html`
      <div>
        <label>${i18next.t('title.arrival_notice')}</label>

        <form>
          <label>${i18next.t('label.purchase_order')}</label>
          <input name="purchase_order" />

          <label>${i18next.t('label.supplier_name')}</label>
          <input name="supplier_name" />

          <label>${i18next.t('label.gan')}</label>
          <input name="gan" />

          <label>${i18next.t('label.delivery_order_no')}</label>
          <input name="delivery_order_no" />

          <label>${i18next.t('label.contact_point')}</label>
          <input name="contact_point" />

          <label>${i18next.t('label.contact_no')}</label>
          <input name="contact_no" />

          <label>${i18next.t('label.eta')}</label>
          <input name="eta" />

          <label>${i18next.t('label.fax')}</label>
          <input name="fax" />
        </form>
      </div>

      <div class="grist">
        <label>${i18next.t('title.arrival_notice_detail')}</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productsConfig}
          .data=${this.productsData}
        ></data-grist>

        <div class="button-container">
          <mwc-button
            id="product-add"
            @click="${() => {
              this.productsData = {
                ...this.productsData,
                records: [...this.productsData.records, { id: '', name: '', description: '' }]
              }
            }}"
            >${i18next.t('button.add')}</mwc-button
          >
          <mwc-button id="product-save">${i18next.t('button.save')}</mwc-button>
        </div>
      </div>

      <div class="grist">
        <label>${i18next.t('title.vas_request')}</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
        ></data-grist>

        <div class="button-container">
          <mwc-button
            id="service-add"
            @click="${() => {
              this.servicesData = {
                ...this.servicesData,
                records: [...this.servicesData.records, { id: '', name: '', description: '' }]
              }
            }}"
            >${i18next.t('button.add')}</mwc-button
          >
          <mwc-button id="service-save">${i18next.t('button.save')}</mwc-button>
        </div>
      </div>
    `
  }

  firstUpdated() {
    this.productsData = { records: [] }
    this.servicesData = { records: [] }

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
          name: 'Customer Product',
          header: i18next.t('field.product_name'),
          record: {
            editable: true
          },
          handlers: {
            dblclick: (columns, data, column, record, rowIndex) => {
              openPopup(
                html`
                  <div style="background-color: white; display: flex; flex-direction: column; padding: 10px;">
                    <resource-selector .resource="${column.name}"></resource-selector>
                  </div>
                `,
                {
                  backdrop: true
                }
              )
            }
          },
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'select',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: {
            align: 'left',
            editable: true,
            options: [i18next.t('label.pallet'), i18next.t('label.box'), i18next.t('label.container')]
          },
          width: 120
        },
        {
          type: 'float',
          name: 'pack_in_qty',
          header: i18next.t('field.pack_in_qty'),
          record: {
            align: 'right',
            editable: true
          },
          width: 80
        },
        {
          type: 'float',
          name: 'pack_qty',
          header: i18next.t('field.pack_qty'),
          record: {
            align: 'right',
            editable: true
          },
          width: 80
        },
        {
          type: 'float',
          name: 'total_qty',
          header: i18next.t('field.total_qty'),
          record: {
            align: 'right',
            editable: true
          },
          width: 80
        }
        // {
        //   type: 'float',
        //   name: 'container_no',
        //   header: i18next.t('field.container_no'),
        //   record: {
        //     align: 'right',
        //     editable: true
        //   },
        //   width: 130
        // },
        // {
        //   type: 'string',
        //   name: 'batch_no',
        //   header: i18next.t('field.batch_no'),
        //   record: {
        //     align: 'center',
        //     editable: true
        //   },
        //   width: 200
        // }
      ]
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
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 200
        },
        {
          type: 'float',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: {
            align: 'right',
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
        },
        {
          type: 'float',
          name: 'price',
          header: i18next.t('field.price'),
          record: {
            align: 'right',
            editable: true
          },
          width: 100
        }
      ]
    }
  }
}

window.customElements.define('create-arrival-notice', CreateArrivalNotice)
