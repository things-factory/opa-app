import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class CreateTransportOrder extends localize(i18next)(PageView) {
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
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          height: 100%;
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
      title: i18next.t('title.create_transport_order'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._createTransportOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.transport_order')}</legend>
            <label>${i18next.t('label.contact_point')}</label>
            <input name="name" />

            <label>${i18next.t('label.description')}</label>
            <input name="description" />

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="when" type="date" />

            <label>${i18next.t('label.contact_no')}</label>
            <input name="contact_no" />

            <label>${i18next.t('label.from')}</label>
            <input name="from" />

            <label>${i18next.t('label.to')}</label>
            <input name="to" />

            <label>${i18next.t('label.load_type')}</label>
            <input name="load_type" />

            
            <input
              name="from_warehouse"
              type="checkbox"
              checked
              @change="${e => {
                this.productsConfig = {
                  columns: this.productsConfig.columns.map(column => {
                    if (column.name === 'product') {
                      column.type = e.currentTarget.checked ? 'object' : 'string'
                    }

                    return { ...column }
                  })
                }

                this.productsData = { records: [] }
              }}"
            />
            <label>${i18next.t('label.from_warehouse')}</label>
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.products')}</h2>
        <data-grist
          id="products"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productsConfig}
          .data=${this.productsData}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
          @record-change="${this._onProductChangeHandler.bind(this)}"
        ></data-grist>

        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas_request')}</h2>
        <data-grist
          id="services"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
          @record-change="${this._onServiceChangeHandler.bind(this)}"
        ></data-grist>
      </div>
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
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'string',
          name: 'container_no',
          header: i18next.t('field.container_no'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'batch_no',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: {
            align: 'center',
            editable: true
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
            align: 'right'
          },
          width: 80
        }
      ]
    }

    this.servicesConfig = {
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
    const before = e.detail.before
    const after = e.detail.after
    const needObjValue = this.shadowRoot.querySelector('input[name=from_warehouse]').checked

    if (needObjValue && (before.product && before.product.id) != (after.product && after.product.id)) {
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

    if ((after.unit && before.pack_qty != after.pack_qty) || (after.unit && before.pack_in_qty != after.pack_in_qty)) {
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

  async _createTransportOrder() {
    try {
      const formData = this._serializeForm()
      await client.query({
        query: gql`
          mutation {
            orders: createTransportOrder(${gqlBuilder.buildArgs({
              transportOrder: {
                name: formData.name,
                description: JSON.stringify({
                  orderNo: this._generateDONo(),
                  description: formData.description,
                  contactNo: formData.contact_no,
                  products: this._getProducts(),
                  services: this._getServices()
                }),
                when: new Date(formData.when).getTime().toString(),
                from: formData.from,
                to: formData.to,
                loadType: formData.load_type,
                orderType: 'TO',
                state: 'Pending'
              }
            })}) {
              name
            }
          }
        `
      })

      navigate('confirm-transport-order')
    } catch (e) {
      this._notify(e.message)
    }
  }

  _generateDONo() {
    return `D-ORD-${new Date().getTime().toString()}`
  }

  get _getInputs() {
    return Array.from(this.shadowRoot.querySelectorAll('form input'))
  }

  _serializeForm() {
    try {
      let tempObj = {}

      this._getInputs.map(input => {
        if (input.value) {
          tempObj[input.name] = input.value
        } else {
          throw new Error(i18next.t('text.form_is_not_completed'))
        }
      })
      return tempObj
    } catch (e) {
      this._notify(e.message)
    }
  }

  _clearForm() {
    this._getInputs.forEach(input => (input.value = ''))
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

  _notify(message, level = '') {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          level,
          message
        }
      })
    )
  }
}

window.customElements.define('create-transport-order', CreateTransportOrder)
