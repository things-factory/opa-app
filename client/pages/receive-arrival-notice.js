import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class ReceiveArrivalNotice extends localize(i18next)(PageView) {
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
          background-color: var(--main-section-background-color);
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
        .grist h2 {
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }

        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }

        h2 + data-grist {
          padding-top: var(--grist-title-with-grid-padding);
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
            <legend>${i18next.t('label.gan')}</legend>
            <label>${i18next.t('label.gan')}</label>
            <input name="gan" />

            <label>${i18next.t('label.eta')}</label>
            <input name="eta" />

            <label>${i18next.t('label.do_no')}</label>
            <input name="do_no" />

            <label>${i18next.t('label.company')}</label>
            <input name="company" />

            <label>${i18next.t('label.supplier_name')}</label>
            <input name="supplier" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.receive_arrival_notice')}</h2>
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
          name: 'row-selector'
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'search',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const selectedOrder = this.rawOrderData.find(orderData => orderData.name === record.name)
              location.href = `arrival-notice-detail/${selectedOrder.name}`
            }
          }
        },
        {
          type: 'object',
          name: 'warehouse',
          header: i18next.t('field.buffer_location'),
          record: {
            align: 'center',
            editable: true,
            options: {
              queryName: 'warehouses',
              basicArgs: {
                filters: [
                  {
                    name: 'type',
                    operator: 'eq',
                    value: 'BUFFER'
                  }
                ]
              }
            }
          },
          width: 250
        },
        {
          type: 'string',
          name: 'company',
          width: 120,
          header: i18next.t('field.company'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'link',
          name: 'name',
          width: 160,
          header: i18next.t('field.name'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'supplier',
          width: 120,
          header: i18next.t('field.supplier_name'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'gan',
          width: 120,
          header: i18next.t('field.gan'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'do_no',
          width: 120,
          header: i18next.t('field.do_no'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'datetime',
          name: 'eta',
          width: 120,
          header: i18next.t('field.eta'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'string',
          name: 'status',
          width: 120,
          header: i18next.t('field.status'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'date',
          name: 'request_date',
          width: 120,
          header: i18next.t('field.request_date'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'date',
          name: 'confirm_date',
          width: 120,
          header: i18next.t('field.confirm_date'),
          record: {
            align: 'center'
          },
          editable: true
        },
        {
          type: 'date',
          name: 'receive_date',
          width: 120,
          header: i18next.t('field.receive_date'),
          record: {
            align: 'center'
          },
          editable: true
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

    this.data = await this._getArrivalNotices()
  }

  async _getArrivalNotices() {
    const response = await client.query({
      query: gql`
        query {
          orders: purchaseOrders(${gqlBuilder.buildArgs({
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

    this.rawOrderData = response.data.orders.items || []

    return {
      records: response.data.orders.items.map(item => {
        const orderInfo = JSON.parse(item.description)
        return {
          warehouse: {
            id: '',
            name: i18next.t('label.buffer_location'),
            description: i18next.t('text.please_choose_buffer_location')
          },
          company: 'Company name',
          name: item.name,
          supplier: orderInfo.supplier,
          gan: orderInfo.gan,
          do_no: orderInfo.orderNo,
          eta: item.issuedOn,
          status: item.state,
          request_date: orderInfo.requestedDate,
          confirm_date: orderInfo.confirmedDate,
          receive_date: orderInfo.receivedDate
        }
      }),
      total: response.data.orders.total
    }
  }

  async _receiveOrder() {
    const selectedOrder = this._getGrist().selected[0]
    const foundOrder = this.rawOrderData.find(orderData => orderData.name === selectedOrder.name)
    if (foundOrder && selectedOrder.warehouse.id) {
      await this._updateOrder(foundOrder, selectedOrder.warehouse)
      this.data = await this._getArrivalNotices()
    } else if (!foundOrder) {
      this._notify(i18next.t('text.there_no_selected'))
    } else {
      this._notify(i18next.t('text.buffer_location_is_not_selected'))
    }
  }

  async _updateOrder(order, bufferLocation) {
    try {
      if (order.state.toLowerCase() !== 'requested') throw new Error('text.status_not_suitable')
      let description = {
        ...JSON.parse(order.description),
        confirmedDate: new Date().getTime(),
        bufferLocation
      }

      await client.query({
        query: gql`
          mutation {
            updatePurchaseOrder(${gqlBuilder.buildArgs({
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

window.customElements.define('receive-arrival-notice', ReceiveArrivalNotice)
