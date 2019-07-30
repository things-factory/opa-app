import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class CreateReleaseGoods extends localize(i18next)(PageView) {
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
          background-color: var(--main-section-background-color);
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
      title: i18next.t('title.create_release_of_goods_notice'),
      actions: [
        {
          title: i18next.t('button.submit'),
          action: this.createReleaseOfGoods.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.release_of_goods')}</legend>

            <label>${i18next.t('label.receiver_contact_point')}</label>
            <input name="receiver_contact_point" />

            <label>${i18next.t('label.receiver_contact_no')}</label>
            <input name="receiver_contact_no" />

            <label>${i18next.t('label.release_date')}</label>
            <input name="release_date" />

            <input name="shipping_export" id="shipping-export" type="checkbox" />
            <label>${i18next.t('label.shipping_export')}</label>

            <label>${i18next.t('label.container_no')}</label>
            <input name="container_no" />

            <label>${i18next.t('label.container_load_type')}</label>
            <select name="container_load_type">
              <option>FCL</option>
              <option>LCL</option>
              <option>40 ton</option>
            </select>

            <label>${i18next.t('label.container_arrival_date')}</label>
            <input name="container_arrival_date" type="date" />

            <label>${i18next.t('label.container_leaving_date')}</label>
            <input name="container_leaving_date" type="date" />

            <label>${i18next.t('label.ship_name')}</label>
            <input name="ship_name" />

            <input name="need_transport" type="checkbox" />
            <label>${i18next.t('label.need_transport')}</label>

            <label>${i18next.t('label.deliver_to')}</label>
            <input name="deliver_to" />

            <label>${i18next.t('label.transporter_name')}</label>
            <input name="transporter_name" />

            <label>${i18next.t('label.driver_name')}</label>
            <input name="driver_name" />

            <label>${i18next.t('label.reg_number')}</label>
            <input name="reg_number" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_of_goods_detail')}</h2>

        <data-grist
          id="products"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productsConfig}
          .data=${this.productsData}
          @record-change="${this._onProductChangeHandler.bind(this)}"
        ></data-grist>

      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas_request')}</h2>

        <data-grist
          id="services"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
          @record-change="${this._onServiceChangeHandler.bind(this)}"
        ></data-grist>
    `
  }

  firstUpdated() {
    this.productsConfig = {
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
          icon: 'delete_outline',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.productsData.records.splice(rowIndex, 1)

              this.productsData = {
                ...this.productsData,
                records: [...this.productsData.records]
              }
            }
          }
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product_name'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'customerProducts'
            }
          },
          width: 250
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

    this.servicesConfig = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'delete_outline',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.servicesData.records.splice(rowIndex, 1)

              this.servicesData = {
                ...this.servicesData,
                records: [...this.servicesData.records]
              }
            }
          }
        },
        {
          type: 'object',
          name: 'service',
          header: i18next.t('field.service'),
          record: {
            align: 'center',
            editable: true,
            options: {
              queryName: 'ownerProducts'
            }
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
          type: 'select',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: {
            align: 'center',
            options: [i18next.t('label.pallet'), i18next.t('label.box'), i18next.t('label.container')]
          },
          width: 120
        },
        {
          type: 'float',
          name: 'unit_price',
          header: i18next.t('field.unit_price'),
          record: {
            align: 'right'
          },
          width: 100
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
          name: 'total_price',
          header: i18next.t('field.price'),
          record: {
            align: 'right'
          },
          width: 100
        }
      ]
    }
  }

  async _onProductChangeHandler(e) {
    const before = e.detail.before
    const after = e.detail.after

    if ((before.product && before.product.id) != (after.product && after.product.id)) {
      const productMaster = await this.getMasterInfo(after.product.id)
      const productUnit = productMaster.unit.split(' ')

      this.productsData.records[e.detail.row].pack_in_qty = productUnit[0]
      this.productsData.records[e.detail.row].unit = productUnit[1]
      this.productsData.records[e.detail.row].description = productMaster.description

      this.productsData = {
        ...this.productsData,
        records: [...this.productsData.records]
      }
    }

    if (after.unit && before.pack_qty != after.pack_qty) {
      this.productsData.records[e.detail.row].total_qty = after.pack_in_qty * after.pack_qty

      this.productsData = {
        ...this.productsData,
        records: [...this.productsData.records]
      }
    }
  }

  async _onServiceChangeHandler(e) {
    const before = e.detail.before
    const after = e.detail.after

    if ((before.service && before.service.id) != (after.service && after.service.id)) {
      const serviceMaster = await this.getMasterInfo(after.service.id)

      this.servicesData.records[e.detail.row].unit = serviceMaster.unit
      this.servicesData.records[e.detail.row].unit_price = 5
      this.servicesData.records[e.detail.row].description = serviceMaster.description

      this.servicesData = {
        ...this.servicesData,
        records: [...this.servicesData.records]
      }
    }

    if (after.unit_price && before.qty != after.qty) {
      this.servicesData.records[e.detail.row].total_price = 'RM ' + after.unit_price * after.qty

      this.servicesData = {
        ...this.servicesData,
        records: [...this.servicesData.records]
      }
    }
  }

  async createReleaseOfGoods() {
    try {
      const products = this._getProducts()
      const services = this._getServices()
      const orderInfo = this.getOrderInfo()

      await client.query({
        query: gql`
          mutation {
            createDeliveryOrder(${gqlBuilder.buildArgs({
              deliveryOrder: {
                name: orderInfo.delivery_order,
                issuedOn: new Date().getTime().toString(),
                state: 'Pending',
                type: 'do',
                description: JSON.stringify({
                  contactPoint: orderInfo.receiver_contact_point,
                  releaseDate: new Date(orderInfo.release_date),
                  containerNo: orderInfo.container_no,
                  loadType: orderInfo.container_load_type,
                  arrivalDate: orderInfo.container_arrival_date,
                  departureDate: orderInfo.container_leaving_date,
                  shipName: orderInfo.ship_name,
                  deliverTo: orderInfo.deliver_to,
                  transporterName: orderInfo.transporter_name,
                  driverName: orderInfo.driver_name,
                  regNumber: orderInfo.reg_number,
                  orderNo: this._generateOrderNo(),
                  products: products,
                  services: services,
                  so: this._generateSO()
                })
              }
            })}) {
              name
            }
          }
        `
      })

      location.href = 'confirm-release-of-goods'
    } catch (e) {
      alert(e.message)
    }
  }

  _getProducts() {
    const products = this.shadowRoot.querySelector('#products').dirtyRecords
    if (products.length === 0) {
      throw new Error(i18next.t('text.list_is_not_completed'))
    } else {
      return products
    }
  }

  getOrderInfo() {
    const orderInfo = {}
    const inputs = Array.from(this.shadowRoot.querySelectorAll('form input'))
    inputs
      .filter(input => input.value)
      .forEach(input => {
        orderInfo[input.name] = input.value
      })

    if (inputs.length !== Object.keys(orderInfo).length) {
      throw new Error(i18next.t('text.form_is_not_completed'))
    } else {
      return orderInfo
    }
  }

  _generateOrderNo() {
    return `DO-NO-${new Date().getTime().toString()}`
  }

  _generateSO() {
    // check wheter it's so or not
    const shippingBoolean = this.shadowRoot.querySelector('#shipping-export').checked
    if (shippingBoolean == 'TRUE') {
      return `SO-${new Date().getTime().toString()}`
    } else {
      return ''
    }
  }
}

window.customElements.define('create-release-goods', CreateReleaseGoods)
