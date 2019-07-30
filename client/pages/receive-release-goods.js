import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class ReceiveReleaseGoods extends localize(i18next)(PageView) {
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
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.receive_release_goods'),
      actions: [
        {
          title: i18next.t('button.confirm'),
          action: this._confirmOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <label>${i18next.t('label.delivery_no')}</label>
          <input name="delivery_no" />

          <label>${i18next.t('label.delivery_date')}</label>
          <input name="delivery_date" />

          <label>${i18next.t('label.shipping_no')}</label>
          <input name="shipping_no" />

          <label>${i18next.t('label.receiver_contact_point')}</label>
          <input name="receiver_contact_point" />
        </fieldset>
      </form>

      <div class="grist">
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
          name: 'row-selector',
          multiple: true
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'search',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const selectedOrder = this.rawOrderData.find(orderData => orderData.name === record.name)
              navigate(`release-goods-detail/${selectedOrder.name}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 200
        },
        // {
        //   type: 'string',
        //   name: 'company',
        //   header: i18next.t('field.company'),
        //   record: {
        //     align: 'left'
        //   },
        //   sortable: true,
        //   width: 200
        // },
        {
          type: 'string',
          name: 'contact_point',
          header: i18next.t('field.contact_point'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'delivery_order_no',
          header: i18next.t('field.delivery_order_no'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 180
        },
        {
          type: 'date',
          name: 'release_date',
          header: i18next.t('field.release_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            align: 'center'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'datetime',
          name: 'request_date',
          header: i18next.t('field.request_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'datetime',
          name: 'confirm_date',
          header: i18next.t('field.confirm_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'datetime',
          name: 'reject_date',
          header: i18next.t('field.reject_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'receive_date',
          header: i18next.t('field.receive_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        }
      ],
      rows: {
        selectable: {
          multiple: true
        },
        handlers: {
          click: 'select-row'
        }
      }
    }

    this.data = await this.getReleaseGoods()
  }

  async getReleaseGoods() {
    const response = await client.query({
      query: gql`
        query {
          orders: deliveryOrders(${gqlBuilder.buildArgs({
            filters: []
          })}) {
            items {
              id
              name
              issuedOn
              type
              state
              description
              updatedAt
            }
            total
          }
        }
      `
    })

    this.rawOrderData = response.data.orders.items

    return {
      records: this._parseOrderData(response.data.orders.items),
      total: response.data.orders.total
    }
  }

  _parseOrderData(orders) {
    return orders.map(order => {
      const info = JSON.parse(order.description)
      return {
        company: 'Company Name',
        name: order.name,
        delivery_order_no: info.orderNo,
        status: order.state,
        type: order.type,
        contact_point: info.contactPoint,
        release_date: info.releaseDate,
        container_no: info.containerNo,
        load_type: info.loadType,
        arrival_date: info.arrivalDate,
        departure_date: info.departureDate,
        ship_name: info.shipName,
        deliver_to: info.deliverTo,
        transporter_name: info.transporterName,
        driver_name: info.driverName,
        reg_number: info.regNumber,
        reject_date: info.rejectedDate,
        request_date: info.requestedDate,
        confirm_date: info.confirmedDate,
        receive_date: info.receivedDate
      }
    })
  }

  async _confirmOrder() {
    const selectedOrder = this.rawOrderData.find(orderData => orderData.name === this._grist.selected[0].name)
    if (selectedOrder) {
      await this._updateOrder(selectedOrder)
      this.data = await this.getReleaseGoods()
    } else {
      this._notify(i18next.t('text.there_no_selected'))
    }
  }

  get _grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async _updateOrder(order) {
    try {
      if (order.state.toLowerCase() !== 'pending') throw new Error('text.status_not_suitable')

      let state = ''
      let description = JSON.parse(order.description)

      if (isConfirm) {
        state = 'Requested'
        description = {
          ...description,
          requestedDate: new Date().getTime()
        }
      } else {
        state = 'Rejected'
        description = {
          ...description,
          rejectedDate: new Date().getTime()
        }
      }

      await client.query({
        query: gql`
          mutation {
            updateDeliveryOrder(${gqlBuilder.buildArgs({
              name: order.name,
              patch: {
                state: state,
                description: JSON.stringify(description)
              }
            })}) {
              name
              state
            }
          }
        `
      })
    } catch (e) {
      this._notify(e.message)
    }
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

window.customElements.define('receive-release-goods', ReceiveReleaseGoods)