import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class InboundWorkOrder extends localize(i18next)(PageView) {
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
      title: i18next.t('title.inbound_work_order')
    }
  }

  render() {
    return html`
      <div>
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('field.work_order')}</legend>
            <label>${i18next.t('label.order_no')}</label>
            <input
              name="order_no"
              @keypress="${e => {
                if (e.keyCode === 13) {
                  this._getOrderDetail(e.currentTarget.value)
                  e.preventDefault()
                }
              }}"
            />
          </fieldset>
        </form>
      </div>

      <div>
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('field.work_order')}</legend>

            <label>${i18next.t('label.name')}</label>
            <input name="name" readonly />

            <label>${i18next.t('label.supplier_name')}</label>
            <input name="supplier_name" readonly />

            <label>${i18next.t('label.gan')}</label>
            <input name="gan" readonly />

            <label>${i18next.t('label.delivery_order_no')}</label>
            <input name="delivery_order_no" readonly />

            <!--label>${i18next.t('label.contact_point')}</label>
            <input name="contact_point" /-->

            <!--label>${i18next.t('label.contact_no')}</label>
            <input name="contact_no" /-->

            <!--label>${i18next.t('label.fax')}</label>
            <input name="fax" /-->

            <label>${i18next.t('label.eta_date')}</label>
            <input name="eta_date" type="date" readonly />

            <label>${i18next.t('label.eta_time')}</label>
            <input name="eta_time" type="time" readonly />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.arrival_notice_detail')}</h2>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productsConfig}
          .data=${this.productsData}
        ></data-grist>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.vas_request')}</h2>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
        ></data-grist>
      </div>
    `
  }

  firstUpdated() {
    this.productsConfig = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
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
          width: 80
        },
        {
          type: 'string',
          name: 'pack_qty',
          header: i18next.t('field.pack_qty'),
          record: {
            align: 'center'
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
          width: 80
        },
        {
          type: 'string',
          name: 'container_no',
          header: i18next.t('field.container_no'),
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
          type: 'object',
          name: 'service',
          header: i18next.t('field.service'),
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
            align: 'left'
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
          width: 80
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: {
            align: 'right'
          },
          width: 80
        }
      ]
    }

    this._focusOnBarcodField()
  }

  _focusOnBarcodField() {
    this.shadowRoot.querySelector('input[name=order_no]').focus()
  }

  async _getOrderDetail(orderNumber) {
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

    const order = this._parseOrder(response.data.orders.items[0])

    this._fillUpForm(order)
    this.productsData = {
      records: order.description.products,
      total: order.description.products.length
    }

    this.servicesData = {
      records: order.description.services,
      total: order.description.services.length
    }
  }

  _parseOrder(rawData) {
    return {
      ...rawData,
      description: JSON.parse(rawData.description)
    }
  }

  _fillUpForm(order) {
    this.shadowRoot.querySelector('input[name=name]').value = order.name
    this.shadowRoot.querySelector('input[name=supplier_name]').value = order.description.supplier
    this.shadowRoot.querySelector('input[name=gan]').value = order.description.gan
    this.shadowRoot.querySelector('input[name=delivery_order_no]').value = order.description.orderNo

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

window.customElements.define('inbound-work-order', InboundWorkOrder)
