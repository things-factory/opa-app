import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

class ReceiveGoods extends localize(i18next)(PageView) {
  static get properties() {
    return {
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }

        .grist {
          display: flex;
          flex-direction: column;

          flex: 1;
        }

        data-grist {
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.receive_goods_master'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => {}
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.receive_goods_master')}</legend>
          <label>${i18next.t('label.order_no')}</label>
          <input
            name="order_no"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this.orderNo = e.currentTarget.value
                this.data = this._getProducts()
              }
            }}"
          />

          <label>${i18next.t('label.purchase_order')}</label>
          <input name="purchase_order" readonly />

          <label>${i18next.t('label.supplier_name')}</label>
          <input name="supplier_name" readonly />

          <label>${i18next.t('label.gan')}</label>
          <input name="gan" readonly />

          <!--label>${i18next.t('label.do_no')}</label>
            <input name="do_no" readonly />

            <label>${i18next.t('label.contact_point')}</label>
            <input name="contact_point" readonly />

            <label>${i18next.t('label.contact_no')}</label>
            <input name="contact_no." readonly />

            <label>${i18next.t('label.fax')}</label>
            <input name="fax" readonly /-->

          <label>${i18next.t('label.eta_date')}</label>
          <input name="eta_date" readonly />

          <label>${i18next.t('label.eta_time')}</label>
          <input name="eta_time" readonly />
        </fieldset>
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

  pageInitialized() {
    this.config = {
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
          icon: 'check',
          handlers: {
            dblclick: async (columns, data, column, record, rowIndex) => {
              this.rawOrderData.description.products.forEach(item => {
                if (item.product.name === record.product.name) {
                  item.productState = 'unloaded'
                }
              })

              await this._updatePurchaseOrder()
              await this._getProducts()
            }
          }
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            align: 'center'
          },
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'center'
          },
          width: 250
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: {
            align: 'center'
          },
          width: 100
        },
        {
          type: 'number',
          name: 'pack_qty',
          header: i18next.t('field.pack_qty'),
          record: {
            align: 'center'
          },
          width: 80
        },
        {
          type: 'number',
          name: 'total_qty',
          header: i18next.t('field.total_qty'),
          record: {
            align: 'center'
          },
          width: 80
        },
        {
          type: 'number',
          name: 'container_no',
          header: i18next.t('field.container_no'),
          record: {
            align: 'center'
          },
          width: 120
        },
        {
          type: 'number',
          name: 'batch_no',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'center'
          },
          width: 80
        },
        {
          type: 'string',
          name: 'buffer_location',
          header: i18next.t('field.buffer_location'),
          record: {
            align: 'center'
          },
          width: 120
        }
      ]
    }

    this._focusOnBarcodField()
  }

  _focusOnBarcodField() {
    this.shadowRoot.querySelector('input[name=order_no]').focus()
  }

  async _updatePurchaseOrder() {
    const response = await client.query({
      query: gql`
        mutation {
          order: updatePurchaseOrder(${gqlBuilder.buildArgs({
            name: this.rawOrderData.name,
            patch: {
              description: JSON.stringify(this.rawOrderData.description)
            }
          })}) {
            name
            description
          }
        }
      `
    })

    const currentProducts = JSON.parse(response.data.order.description).products
    const currentServices = JSON.parse(response.data.order.description).services
    const issReadyToPutaway =
      currentProducts.every(product => product.productState === 'unloaded') &&
      currentServices.every(service => service.serviceState === 'done')

    if (issReadyToPutaway) {
      await this._updateOrderState()
    }
  }

  async _updateOrderState() {
    await client.query({
      query: gql`
        mutation {
          order: updatePurchaseOrder(${gqlBuilder.buildArgs({
            name: this.rawOrderData.name,
            patch: {
              state: 'Unloaded'
            }
          })}) {
            name
            description
          }
        }
      `
    })

    this._notify(i18next.t('text.order_is_ready_for_putaway'))
  }

  async _getProducts() {
    const response = await client.query({
      query: gql`
        query {
          orders: purchaseOrders(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'state',
                operator: 'eq',
                value: 'Confirmed'
              },
              {
                name: 'description',
                operator: 'like',
                value: this.orderNo
              }
            ]
          })}) {
            items {
              id
              name
              issuedOn
              state
              description
              updatedAt
            }
            total
          }
        }
      `
    })

    if (response.data.orders.items[0]) {
      this.rawOrderData = this._parseOrder(response.data.orders.items[0])
      this._fillUpForm(this.rawOrderData)
      this.data = {
        records: this.rawOrderData.description.products.filter(product => product.productState !== 'unloaded'),
        total: this.rawOrderData.description.products.length
      }
    }
  }

  _parseOrder(rawData) {
    return {
      ...rawData,
      description: JSON.parse(rawData.description)
    }
  }

  _fillUpForm(order) {
    this.shadowRoot.querySelector('input[name=purchase_order]').value = order.name
    this.shadowRoot.querySelector('input[name=supplier_name]').value = order.description.supplier
    this.shadowRoot.querySelector('input[name=gan]').value = order.description.gan

    const issuedDate = new Date(Number(order.issuedOn))
    const year = issuedDate.getFullYear()
    const month = issuedDate.getMonth() + 1 < 10 ? `0${issuedDate.getMonth() + 1}` : issuedDate.getMonth() + 1
    const date = issuedDate.getDate() < 10 ? `0${issuedDate.getDate()}` : issuedDate.getDate()
    const hours = issuedDate.getHours() < 10 ? `0${issuedDate.getHours()}` : issuedDate.getHours()
    const minutes = issuedDate.getMinutes() < 10 ? `0${issuedDate.getMinutes()}` : issuedDate.getMinutes()

    this.shadowRoot.querySelector('input[name=eta_date').value = `${year}-${month}-${date}`
    this.shadowRoot.querySelector('input[name=eta_time').value = `${hours}:${minutes}`
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

window.customElements.define('receive-goods', ReceiveGoods)
