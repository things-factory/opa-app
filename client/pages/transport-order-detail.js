import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { MultiColumnFormStyles } from '../styles'

class TransportOrderDetail extends connect(store)(localize(i18next)(PageView)) {
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
            <legend>${i18next.t('title.transport_order')}</legend>
            <label>${i18next.t('label.contact_point')}</label>
            <input name="name" readonly />

            <label>${i18next.t('label.description')}</label>
            <input name="description" readonly />

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="when" type="date" readonly />

            <label>${i18next.t('label.contact_no')}</label>
            <input name="contact_no" readonly />

            <label>${i18next.t('label.from')}</label>
            <input name="from" readonly />

            <label>${i18next.t('label.to')}</label>
            <input name="to" readonly />

            <label>${i18next.t('label.load_type')}</label>
            <input name="load_type" readonly />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.products')}</h2>

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

      <div class="button-container">
        <mwc-button
          @click="${() => {
            history.back()
          }}"
          >${i18next.t('button.back')}</mwc-button
        >
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
          type: 'string',
          name: 'product',
          header: i18next.t('field.product_name'),
          record: {
            align: 'center'
          },
          width: 280
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
      ],
      pagination: {
        infinite: true
      }
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
      ],
      pagination: {
        infinite: true
      }
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

      this.productsData = {
        records: orderInfo.description.products.map(item => {
          return {
            ...item,
            product: typeof item.product === 'string' ? item.product : `${item.product.name}`
          }
        })
      }
      this.servicesData = { records: orderInfo.description.services }
    }
  }

  async getOrderInfo(name) {
    const response = await client.query({
      query: gql`
        query {
          order: transportOrder(${gqlBuilder.buildArgs({ name })}) {
            id
            name
            description
            when
            from
            to
            loadType
            state
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
    this.shadowRoot.querySelector('input[name=name]').value = orderInfo.name
    this.shadowRoot.querySelector('input[name=description]').value = orderInfo.description.description
    this.shadowRoot.querySelector('input[name=contact_no]').value = orderInfo.description.contactNo
    this.shadowRoot.querySelector('input[name=from]').value = orderInfo.from
    this.shadowRoot.querySelector('input[name=to]').value = orderInfo.to
    this.shadowRoot.querySelector('input[name=load_type]').value = orderInfo.loadType

    const devliveryDate = new Date(Number(orderInfo.when))
    const year = devliveryDate.getFullYear()
    const month = devliveryDate.getMonth() + 1 < 10 ? `0${devliveryDate.getMonth() + 1}` : devliveryDate.getMonth() + 1
    const date = devliveryDate.getDate() < 10 ? `0${devliveryDate.getDate()}` : devliveryDate.getDate()
    this.shadowRoot.querySelector('input[name=when]').value = `${year}-${month}-${date}`
  }
}

window.customElements.define('transport-order-detail', TransportOrderDetail)
