import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { MultiColumnFormStyles } from '../styles'

class ReleaseGoodsDetail extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      orderName: Object,
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
      title: i18next.t('title.create_arrival_notice'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => {
            history.back()
          }
        }
      ]
    }
  }

  render() {
    return html`
      <div>
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.arrival_notice')}</legend>
            <label>${i18next.t('label.purchase_order')}</label>
            <input name="purchase_order" readonly />

            <label>${i18next.t('label.supplier_name')}</label>
            <input name="supplier_name" readonly />

            <label>${i18next.t('label.gan')}</label>
            <input name="gan" />

            <label>${i18next.t('label.delivery_order_no')}</label>
            <input name="delivery_order_no" />

            <label>${i18next.t('label.eta_date')}</label>
            <input name="eta_date" type="date" readonly />

            <label>${i18next.t('label.eta_time')}</label>
            <input name="eta_time" type="time" readonly />

            <label>${i18next.t('label.status')}</label>
            <input name="status" readonly />
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
        ></data-grist>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.vas_request')}</h2>

        <data-grist
          id="services"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.servicesConfig}
          .data=${this.servicesData}
        ></data-grist>
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
          type: 'object',
          name: 'product',
          header: i18next.t('field.product_name'),
          record: {
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
            align: 'left'
          },
          width: 250
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
            align: 'right'
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
            align: 'center',
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
          type: 'float',
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

  stateChanged(state) {
    if (JSON.parse(this.active)) {
      this.orderName = state.route.resourceId
    }
  }

  async updated(changedProps) {
    if (changedProps.has('orderName')) {
      const orderInfo = await this.getOrderInfo(this.orderName)
      this._fillUpForm(orderInfo)
      this.productsData = { records: orderInfo.description.products }
      this.servicesData = { records: orderInfo.description.services }
    }
  }

  async getOrderInfo(name) {
    const response = await client.query({
      query: gql`
        query {
          order: purchaseOrder(${gqlBuilder.buildArgs({ name })}) {
            id
            name
            issuedOn
            state
            description
            updatedAt
          }
        }
      `
    })

    return {
      ...response.data.order,
      description: JSON.parse(response.data.order.description)
    }
  }

  _fillUpForm(orderInfo) {
    this.shadowRoot.querySelector('input[name=purchase_order]').value = orderInfo.name
    this.shadowRoot.querySelector('input[name=supplier_name]').value = orderInfo.description.supplier
    const issuedDate = new Date(Number(orderInfo.issuedOn))
    const year = issuedDate.getFullYear()
    const month = issuedDate.getMonth() + 1 < 10 ? `0${issuedDate.getMonth() + 1}` : issuedDate.getMonth() + 1
    const date = issuedDate.getDate() < 10 ? `0${issuedDate.getDate()}` : issuedDate.getDate()
    const hours = issuedDate.getHours() < 10 ? `0${issuedDate.getHours()}` : issuedDate.getHours()
    const minutes = issuedDate.getMinutes() < 10 ? `0${issuedDate.getMinutes()}` : issuedDate.getMinutes()

    this.shadowRoot.querySelector('input[name=eta_date').value = `${year}-${month}-${date}`
    this.shadowRoot.querySelector('input[name=eta_time').value = `${hours}:${minutes}`
    this.shadowRoot.querySelector('input[name=gan]').value = orderInfo.description.gan
    this.shadowRoot.querySelector('input[name=delivery_order_no]').value = orderInfo.description.orderNo
    this.shadowRoot.querySelector('input[name=status]').value = orderInfo.state
  }
}

window.customElements.define('release-goods-detail', ReleaseGoodsDetail)
