import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

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
            <label>${i18next.t('label.delivery_order')}</label>
          <input name="delivery_order" />

            <label>${i18next.t('label.receiver_contact_point')}</label>
            <input name="receiver_contact_point" />

            <label>${i18next.t('label.receiver_contact_no')}</label>
            <input name="receiver_contact_no" />

            <label>${i18next.t('label.release_date')}</label>
            <input name="release_date" type="date" />

            <input name="shipping_export" id="shipping-export" type="checkbox" @change="${this._exportingChanged.bind(
              this
            )}" />
            <label>${i18next.t('label.shipping_export')}</label>

            <label class="exp-input" hidden>${i18next.t('label.container_no')}</label>
            <input class="exp-input" name="container_no" hidden />

            <label class="exp-input" hidden>${i18next.t('label.container_load_type')}</label>
            <select name="container_load_type" class="exp-input" hidden>
              <option>FCL</option>
              <option>LCL</option>
              <option>40 ton</option>
            </select>

            <label class="exp-input" hidden>${i18next.t('label.container_arrival_date')}</label>
            <input name="container_arrival_date" type="date" class="exp-input"  hidden />

            <label class="exp-input" hidden>${i18next.t('label.container_leaving_date')}</label>
            <input name="container_leaving_date" type="date" class="exp-input" hidden />

            <label class="exp-input" hidden>${i18next.t('label.ship_name')}</label>
            <input name="ship_name" class="exp-input" hidden />

            <input name="need_transport" type="checkbox" checked @change="${this._needTrsptChanged.bind(this)}" />
            <label>${i18next.t('label.need_transport')}</label>

            <label class="trs-input" hidden>${i18next.t('label.deliver_to')}</label>
            <input name="deliver_to" class="trs-input" hidden />

            <label class="trs-input" hidden>${i18next.t('label.transporter_name')}</label>
            <input name="transporter_name" class="trs-input" hidden />

            <label class="trs-input" hidden>${i18next.t('label.driver_name')}</label>
            <input name="driver_name" class="trs-input" hidden />

            <label class="trs-input" hidden>${i18next.t('label.reg_number')}</label>
            <input name="reg_number" class="trs-input" hidden />
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
    this.productsData = { records: [] }
    this.servicesData = { records: [] }

    this.productsConfig = {
      pagination: {
        infinite: true
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'button',
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
          name: 'unit',
          header: i18next.t('field.unit'),
          record: {
            align: 'center'
          },
          width: 120
        },
        {
          type: 'string',
          name: 'pack_in_qty',
          header: i18next.t('field.pack_in_qty'),
          record: {
            align: 'center'
          },
          width: 120
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
          type: 'string',
          name: 'total_qty',
          header: i18next.t('field.total_qty'),
          record: {
            align: 'center'
          },
          width: 120
        }
        // ,
        // {
        //   type: 'string',
        //   name: 'batch_no',
        //   header: i18next.t('field.batch_no'),
        //   record: {
        //     align: 'center'
        //   },
        //   width: 120
        // }
      ]
    }

    this.servicesConfig = {
      pagination: {
        infinite: true
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'button',
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
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: {
            align: 'center'
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
    const before = e.detail.before || {}
    const after = e.detail.after

    if ((before.product && before.product.id) != (after.product && after.product.id)) {
      const productMaster = await this.getMasterInfo(after.product.id)
      const productUnit = productMaster.unit.split(' ')

      let record = this.productsData.records[e.detail.row]

      if (!record) {
        record = {}
        this.productsData.records.push(record)
      }

      record.pack_in_qty = productUnit[0]
      record.unit = productUnit[1]
      record.description = productMaster.description

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
    const before = e.detail.before || {}
    const after = e.detail.after

    if ((before.service && before.service.id) != (after.service && after.service.id)) {
      const serviceMaster = await this.getMasterInfo(after.service.id)

      let record = this.servicesData.records[e.detail.row]

      if (!record) {
        record = {}
        this.servicesData.records.push(record)
      }

      record.unit = serviceMaster.unit
      record.unit_price = 5
      record.description = serviceMaster.description

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
                  releaseDate: new Date(orderInfo.release_date).getTime().toString(),
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

      navigate('confirm_release_goods')
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

  _getServices() {
    return this.shadowRoot.querySelector('#services').dirtyRecords
  }

  getOrderInfo() {
    const orderInfo = {}
    const inputs = Array.from(this.shadowRoot.querySelectorAll('form input')).filter(input => !input.hidden)
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
    if (this.shadowRoot.querySelector('#shipping-export').checked) {
      return `SO-${new Date().getTime().toString()}`
    } else {
      return ''
    }
  }

  _needTrsptChanged(e) {
    const isNeedTransport = e.currentTarget.checked
    if (isNeedTransport) {
      this._hideTransportInputs()
    } else {
      this._showTransportInputs()
    }
  }

  _exportingChanged(e) {
    const isExporting = e.currentTarget.checked
    if (isExporting) {
      this._showExportingInputs()
    } else {
      this._hideExportingInputs()
    }
  }

  _showTransportInputs() {
    this._transportElements.forEach(el => (el.hidden = false))
  }

  _hideTransportInputs() {
    this._transportElements.forEach(el => (el.hidden = true))
  }

  _showExportingInputs() {
    this._exportElements.forEach(el => (el.hidden = false))
  }

  _hideExportingInputs() {
    this._exportElements.forEach(el => (el.hidden = true))
  }

  get _exportElements() {
    return Array.from(this.shadowRoot.querySelectorAll('.exp-input'))
  }

  get _transportElements() {
    return Array.from(this.shadowRoot.querySelectorAll('.trs-input'))
  }
}

window.customElements.define('create-release-goods', CreateReleaseGoods)
