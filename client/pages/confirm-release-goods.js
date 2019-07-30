import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import '@things-factory/grist-ui'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class ConfirmReleaseGoods extends localize(i18next)(PageView) {
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
      title: i18next.t('title.confirm_release_goods'),
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

          <label>${i18next.t('label.driver_name')}</label>
          <input name="driver_name" />

          <label>${i18next.t('label.reg_number')}</label>
          <input name="reg_number" />
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
              location.href = `release-goods-detail/${selectedOrder.name}`
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.delivery_order'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 230
        },
        {
          type: 'string',
          name: 'delivery_date',
          header: i18next.t('field.delivery_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'delivery_address',
          header: i18next.t('field.delivery_address'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'receiver_contact_point',
          header: i18next.t('field.receiver_contact_point'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'receiver_contact_number',
          header: i18next.t('field.receiver_contact_number'),
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
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'confirm_date',
          header: i18next.t('field.confirm_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
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
          multiple: false
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
      await this._updateOrder(selectedOrder, true)
      this.data = await this.getReleaseGoods()
    } else {
      this._notify(i18next.t('text.there_no_selected'))
    }
  }

  get _grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async _rejectOrder() {
    const selectedOrder = this.rawOrderData.find(orderData => orderData.name === this._grist.selected[0].name)
    if (selectedOrder) {
      await this._updateOrder(selectedOrder, false)
      this.data = await this.getReleaseGoods()
    } else {
      this._notify(i18next.t('text.there_no_selected'))
    }
  }

  async _deleteOrder(order) {
    try {
      if (order.state.toLowerCase() !== 'pending') throw new Error('text.status_not_suitable')

      await client.query({
        query: gql`
          mutation {
            deleteDeliveryOrder(${gqlBuilder.buildArgs({ name: order.name })}) {
              name
            }
          }
        `
      })
    } catch (e) {
      this._notify(e.message)
    }
  }

  async _updateOrder(order, isConfirm) {
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

window.customElements.define('confirm-release-goods', ConfirmReleaseGoods)
