import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/simple-ui'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

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
          overflow-x: overlay;
        }
        .input-box {
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

  get context() {
    return {
      title: i18next.t('title.receive_goods_master')
    }
  }

  render() {
    return html`
      <div>
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.receive_goods_master')}</legend>
            <label>${i18next.t('label.order_no')}</label>
            <input
              name="order_no"
              @keypress="${async e => {
                if (e.keyCode === 13) {
                  e.preventDefault()
                  this.data = this._getProducts(e.currentTarget.value)
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
      </div>

      <div class="grist">
        <h2>${i18next.t('title.receive_goods_detail')}</h2>
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
    `
  }

  async firstUpdated() {
    this.config = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'check',
          handlers: {
            dblclick: (columns, data, column, record, rowIndex) => {
              console.log(record)
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

  async _getProducts(orderNumber) {
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
                value: orderNumber
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
      const order = this._parseOrder(response.data.orders.items[0])
      if (order) this._fillUpForm(order)
      this.data = {
        records: order.description.products,
        total: order.description.products.length
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
}

window.customElements.define('receive-goods', ReceiveGoods)
