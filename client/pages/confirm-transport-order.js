import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { SearchFormStyles } from '@things-factory/form-ui'

class ConfirmTransportOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      SearchFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }

        data-grist {
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.confirm_transport_order'),
      actions: [
        {
          title: i18next.t('button.cancel'),
          action: this._cancelOrder.bind(this)
        },
        {
          title: i18next.t('button.reject'),
          action: this._rejectOrder.bind(this)
        },
        {
          title: i18next.t('button.confirm'),
          action: this._confirmOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form class="search-form">
        <label>${i18next.t('label.company')}</label>
        <input name="company" />

        <label>${i18next.t('label.delivery_date')}</label>
        <input name="delivery_date" type="date" />

        <label>${i18next.t('label.vehicle_reg_no')}</label>
        <input name="vehicle_reg_no" />

        <label>${i18next.t('label.driver')}</label>
        <input name="driver" />

        <label>${i18next.t('label.to')}</label>
        <input name="to" />

        <label>${i18next.t('label.load_type')}</label>
        <input name="load_type" />
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

  async firstUpdated() {
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
          gutterName: 'row-selector',
          multiple: false
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'search',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const selectedOrder = this.rawOrderData.find(orderData => orderData.name === record.name)
              navigate(`transport-order-detail/${selectedOrder.name}`)
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
          width: 120
        },
        {
          type: 'string',
          name: 'do_no',
          header: i18next.t('field.delivery_order_no'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'company',
          header: i18next.t('field.company'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'contact_no',
          header: i18next.t('field.contact_point'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'date',
          name: 'when',
          header: i18next.t('field.delivery_date'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'from',
          header: i18next.t('field.from'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },

        {
          type: 'string',
          name: 'to',
          header: i18next.t('field.to'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'load_type',
          header: i18next.t('field.load_type'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'object',
          name: 'transport_vehicle',
          header: i18next.t('field.transport_vehicle'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'transportVehicles'
            }
          },
          width: 250
        },
        {
          type: 'object',
          name: 'driver',
          header: i18next.t('field.driver'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'workers',
              basicArgs: {
                filters: [
                  {
                    name: 'type',
                    operator: 'like',
                    value: 'driver'
                  }
                ]
              }
            }
          },
          width: 250
        },
        {
          type: 'string',
          name: 'state',
          header: i18next.t('field.state'),
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
          name: 'delivered_date',
          header: i18next.t('field.delivered_date'),
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

    this.data = await this.getTransportOrders()
  }

  async getTransportOrders() {
    const response = await client.query({
      query: gql`
        query {
          orders: transportOrders(${gqlBuilder.buildArgs({
            filters: []
          })}) {
            items {
              id
              name
              description
              when
              from
              to
              loadType
              state
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
        contact_no: info.contactNo,
        name: order.name,
        description: info.description,
        do_no: info.orderNo,
        when: order.when,
        from: order.from,
        to: order.to,
        load_type: order.loadType,
        state: order.state,
        reject_date: info.rejectedDate,
        request_date: info.requestedDate,
        confirm_date: info.confirmedDate,
        delivered_date: info.deliveredDate
      }
    })
  }

  async _cancelOrder() {
    const selectedOrder = this.rawOrderData.find(orderData => orderData.name === this._grist.selected[0].name)
    if (selectedOrder) {
      await this._deleteOrder(selectedOrder)
      this.data = await this.getTransportOrders()
    } else {
      this._notify(i18next.t('text.there_no_selected'))
    }
  }

  async _rejectOrder() {
    const selectedOrder = this.rawOrderData.find(orderData => orderData.name === this._grist.selected[0].name)
    if (selectedOrder) {
      await this._updateOrder(selectedOrder, false)
      this.data = await this.getTransportOrders()
    } else {
      this._notify(i18next.t('text.there_no_selected'))
    }
  }

  async _confirmOrder() {
    const selectedOrder = this.rawOrderData.find(orderData => orderData.name === this._grist.selected[0].name)
    if (selectedOrder) {
      await this._updateOrder(selectedOrder, true)
      this.data = await this.getTransportOrders()
    } else {
      this._notify(i18next.t('text.there_no_selected'))
    }
  }

  get _grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async _deleteOrder(order) {
    try {
      if (order.state.toLowerCase() !== 'pending') throw new Error('text.status_not_suitable')

      await client.query({
        query: gql`
          mutation {
            deleteTransportOrder(${gqlBuilder.buildArgs({ name: order.name })}) {
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
            updateTransportOrder(${gqlBuilder.buildArgs({
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

window.customElements.define('confirm-transport-order', ConfirmTransportOrder)
