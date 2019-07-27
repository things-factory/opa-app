import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView, client, gqlBuilder } from '@things-factory/shell'
import gql from 'graphql-tag'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

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
      title: i18next.t('title.create_arrival_notice')
    }
  }

  render() {
    return html`
      <div>
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.arrival_notice')}</legend>
            <label>${i18next.t('label.purchase_order')}</label>
            <input name="purchase_order" />

            <label>${i18next.t('label.supplier_name')}</label>
            <input name="supplier_name" />

            <label>${i18next.t('label.gan')}</label>
            <input name="gan" />

            <label>${i18next.t('label.delivery_order_no')}</label>
            <input name="delivery_order_no" />

            <label>${i18next.t('label.eta_date')}</label>
            <input name="eta_date" type="date" />

            <label>${i18next.t('label.eta_time')}</label>
            <input name="eta_time" type="time" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.arrival_notice_detail')}</h2>

        <data-grist
          id="products"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productsConfig}
          .data=${this.productsData}
          @record-change="${this._onProductChangeHandler.bind(this)}"
        ></data-grist>

        <div class="button-container">
          <mwc-button
            id="product-add"
            @click="${() => {
              this.productsData = {
                ...this.productsData,
                records: [...this.productsData.records, { product: { id: '', name: '', description: '' } }]
              }
            }}"
            >${i18next.t('button.add')}</mwc-button
          >
        </div>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.vas_request')}</h2>

        <data-grist
          id="services"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
          @record-change="${this._onServiceChangeHandler.bind(this)}"
        ></data-grist>

        <div class="button-container">
          <mwc-button
            id="service-add"
            @click="${() => {
              this.servicesData = {
                ...this.servicesData,
                records: [...this.servicesData.records, { service: { id: '', name: '', description: '' } }]
              }
            }}"
            >${i18next.t('button.add')}</mwc-button
          >
        </div>

        <mwc-button @click="${this.createArrivalNotice}">${i18next.t('button.submit')}</mwc-button>
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
          icon: 'delete',
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
            align: 'center',
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
            align: 'right'
          },
          width: 80
        },
        {
          type: 'float',
          name: 'pack_qty',
          header: i18next.t('field.qty'),
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
          icon: 'delete',
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
          width: 250
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

      this.productsData.records[e.detail.row].unit = productMaster.unit
      this.productsData.records[e.detail.row].pack_in_qty = 10

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

  async getMasterInfo(id) {
    const response = await client.query({
      query: gql`
        query {
          product: productById(${gqlBuilder.buildArgs({ id })}) {
            id
            name
            yourName
            description
            unit
          }
        }
      `
    })

    return response.data.product
  }

  async createArrivalNotice() {
    try {
      const products = this.getProducts()
      const services = this.getServices()
      const orderInfo = this.getOrderInfo()

      await client.query({
        query: gql`
          mutation {
            createPurchaseOrder(${gqlBuilder.buildArgs({
              purchaseOrder: {
                name: orderInfo.purchase_order,
                issuedOn: new Date(orderInfo.eta_date + ' ' + orderInfo.eta_time).getTime().toString(),
                state: 'pending',
                description: JSON.stringify({
                  supplier: orderInfo.supplier_name,
                  orderNo: orderInfo.delivery_order_no,
                  products: products,
                  services: services
                })
              }
            })}) {
              name
            }
          }
        `
      })

      location.href = 'confirm-arrival-notice'
    } catch (e) {
      alert(e.message)
    }
  }

  getProducts() {
    const products = this.shadowRoot.querySelector('#products').dirtyRecords
    if (products.length === 0) {
      throw new Error(i18next.t('text.list_is_not_completed'))
    } else {
      return products
    }
  }

  getServices() {
    return this.shadowRoot.querySelector('#services').dirtyRecords
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
}

window.customElements.define('create-arrival-notice', CreateArrivalNotice)
