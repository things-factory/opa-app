import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class ReceiveTransportOrder extends localize(i18next)(PageView) {
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
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          height: 100%;
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
      title: i18next.t('title.receive_arrival_notice'),
      actions: [
        {
          title: i18next.t('button.receive'),
          action: this._receiveOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <div>
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('label.transport_order')}</legend>
            <label>${i18next.t('label.name')}</label>
            <input name="name" />

            <label>${i18next.t('label.to_no')}</label>
            <input name="to_no" />

            <label>${i18next.t('label.from')}</label>
            <input name="from" />

            <label>${i18next.t('label.to')}</label>
            <input name="to" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.receive_transport_order')}</h2>
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
          multiple: false
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'search',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const selectedOrder = this.rawOrderData.find(orderData => orderData.name === record.name)
              location.href = `transport-order-detail/${selectedOrder.name}`
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
            align: 'center',
            editable: true,
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
            align: 'center',
            editable: true,
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
        }
      ],
      rows: {
        selectable: {
          multiple: false
        },
        handlers: {
          click: 'row-select'
        }
      }
    }

    this.data = await this._getTransportOrders()
  }

  async _getTransportOrders() {
    const response = await client.query({
      query: gql`
        query {
          orders: transportOrders(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'state',
                operator: 'eq',
                value: 'Requested'
              }
            ]
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

    this.rawOrderData = response.data.orders.items || []

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
        transport_vehicle: info.transportVehicle,
        driver: info.driver,
        delivered_date: info.deliveredDate
      }
    })
  }

  async _receiveOrder() {
    const selectedOrder = this._getGrist().selected[0]
    const foundOrder = this.rawOrderData.find(orderData => orderData.name === selectedOrder.name)
    if (foundOrder && typeof selectedOrder.transport_vehicle == 'object' && typeof selectedOrder.driver == 'object') {
      await this._updateOrder(foundOrder, selectedOrder.transport_vehicle, selectedOrder.driver)
      this.data = await this._getTransportOrders()
    } else if (!foundOrder) {
      this._notify(i18next.t('text.there_no_selected'))
    } else {
      this._notify(i18next.t('text.vehicle_or_driver_not_selected'))
    }
  }

  async _updateOrder(order, transportVehicle, driver) {
    try {
      if (order.state.toLowerCase() !== 'requested') throw new Error('text.status_not_suitable')
      let description = {
        ...JSON.parse(order.description),
        confirmedDate: new Date().getTime(),
        transportVehicle,
        driver
      }

      await client.query({
        query: gql`
          mutation {
            updateTransportOrder(${gqlBuilder.buildArgs({
              name: order.name,
              patch: {
                state: 'Confirmed',
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

  _getGrist() {
    return this.shadowRoot.querySelector('data-grist')
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

window.customElements.define('receive-transport-order', ReceiveTransportOrder)
