import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

class ConfirmVasOrder extends localize(i18next)(PageView) {
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
      title: i18next.t('title.confirm_arrival_notice'),
      actions: [
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
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('label.gan')}</legend>
          <label>${i18next.t('label.gan_no')}</label>
          <input name="gan" />

          <label>${i18next.t('label.eta')}</label>
          <input name="eta" />

          <label>${i18next.t('label.do_no')}</label>
          <input name="delivery_no" />

          <label>${i18next.t('label.company')}</label>
          <input name="company" />

          <label>${i18next.t('label.supplier_name')}</label>
          <input name="supplier_name" />
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
              navigate(`arrival_notice_detail/${selectedOrder.name}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.purchase_order'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 230
        },
        {
          type: 'string',
          name: 'supplier_name',
          header: i18next.t('field.supplier_name'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'gan',
          header: i18next.t('field.gan_no'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 230
        },
        {
          type: 'string',
          name: 'delivery_order_no',
          header: i18next.t('field.do_no'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 230
        },
        {
          type: 'datetime',
          name: 'eta',
          header: i18next.t('field.eta'),
          record: {
            align: 'center'
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
          name: 'reject_date',
          header: i18next.t('field.reject_date'),
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
            align: 'center'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'datetime',
          name: 'confirm_date',
          header: i18next.t('field.confirm_date'),
          record: {
            align: 'center'
          },
          sortable: true,
          width: 120
        },
        {
          type: 'datetime',
          name: 'receive_date',
          header: i18next.t('field.receive_date'),
          record: {
            align: 'center'
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
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.data = await this.getArrivalNotices()
    }
  }

  async getArrivalNotices() {
    const response = await client.query({
      query: gql`
        query {
          orders: purchaseOrders(${gqlBuilder.buildArgs({
            filters: []
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
        supplier_name: info.supplier,
        gan: info.gan,
        delivery_order_no: info.orderNo,
        eta: order.issuedOn,
        status: order.state,
        reject_date: info.rejectedDate,
        request_date: info.requestedDate,
        confirm_date: info.confirmedDate,
        receive_date: info.receivedDate
      }
    })
  }

  async _cancelOrder() {
    const selectedOrder = this.rawOrderData.find(orderData => orderData.name === this._grist.selected[0].name)
    if (selectedOrder) {
      await this._deleteOrder(selectedOrder)
      this.data = await this.getArrivalNotices()
    } else {
      this._notify(i18next.t('text.there_no_selected'))
    }
  }

  async _rejectOrder() {
    const selectedOrder = this.rawOrderData.find(orderData => orderData.name === this._grist.selected[0].name)
    if (selectedOrder) {
      await this._updateOrder(selectedOrder, false)
      this.data = await this.getArrivalNotices()
    } else {
      this._notify(i18next.t('text.there_no_selected'))
    }
  }

  async _confirmOrder() {
    const selectedOrder = this.rawOrderData.find(orderData => orderData.name === this._grist.selected[0].name)
    if (selectedOrder) {
      await this._updateOrder(selectedOrder, true)
      this.data = await this.getArrivalNotices()
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
            deletePurchaseOrder(${gqlBuilder.buildArgs({ name: order.name })}) {
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
            updatePurchaseOrder(${gqlBuilder.buildArgs({
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

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.data = await this.getArrivalNotices()
    }
  }
}

window.customElements.define('confirm-vas-order', ConfirmVasOrder)
