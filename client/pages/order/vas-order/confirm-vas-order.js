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
      title: i18next.t('title.confirm_vas_order'),
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
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.data = {
                ...this.data,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
            }
          }
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { editable: true, align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { editable: true, align: 'center', options: ['', i18next.t('label.all')] },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'center' },
          width: 350
        }
      ]
    }
  }
  
  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          orderVass(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items{
              id
              name
              bizplace {
                id
              }
              vas {
                id
                name
                description
              }
              status
              description
              batchId
              remark
              updatedAt
              updater {
                id
                name
                description
              }
            }   
            total
          }
        }
      `
    })
    if (!response.errors) {
      return {
        total: response.data.orderVass.total || 0,
        records: response.data.orderVass.items || []
      }
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
