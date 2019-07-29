// Services,description,quantity,unit,status
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '../styles'

class VasWorkOrder extends localize(i18next)(PageView) {
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
      title: i18next.t('title.vas_work_order'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => {}
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset class="multi-column-form">
          <legend>${i18next.t('title.arrival_notice_master')}</legend>
          <label>${i18next.t('label.order_no')}</label>
          <input
            name="order_no"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this.orderNo = e.currentTarget.value
                await this._getServices()
              }
            }}"
          />

          <label>${i18next.t('label.purchase_order')}</label>
          <input name="purchase_order" readonly />

          <label>${i18next.t('label.supplier_name')}</label>
          <input name="supplier_name" readonly />

          <label>${i18next.t('label.gan')}</label>
          <input name="gan" readonly />

          <!--label>${i18next.t('label.contact_point')}</label>
          <input name="contact_point" />

          <label>${i18next.t('label.contact_no')}</label>
          <input name="contact_no" />

          <label>${i18next.t('label.fax')}</label>
          <input name="fax" /-->

          <label>${i18next.t('label.eta_date')}</label>
          <input name="eta_date" readonly />

          <label>${i18next.t('label.eta_time')}</label>
          <input name="eta_time" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <h2>${i18next.t('title.vas_request_and_materials')}</h2>
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

  firstUpdated() {
    this.config = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'check',
          handlers: {
            dblclick: async (columns, data, column, record, rowIndex) => {
              this.rawOrderData.description.services.forEach(item => {
                if (item.service.name === record.service.name) {
                  item.serviceState = 'done'
                }
              })

              await this._updatePurchaseOrder()
              await this._getServices()
            }
          }
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
          width: 100
        },
        {
          type: 'number',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: {
            align: 'right'
          },
          width: 100
        }
      ]
    }

    this._focusOnBarcodField()
  }

  _focusOnBarcodField() {
    this.shadowRoot.querySelector('input[name=order_no]').focus()
  }

  async _updatePurchaseOrder() {
    const response = await client.query({
      query: gql`
        mutation {
          order: updatePurchaseOrder(${gqlBuilder.buildArgs({
            name: this.rawOrderData.name,
            patch: {
              description: JSON.stringify(this.rawOrderData.description)
            }
          })}) {
            name
            description
          }
        }
      `
    })

    const currentProducts = JSON.parse(response.data.order.description).products
    const currentServices = JSON.parse(response.data.order.description).services
    const issReadyToPutaway =
      currentProducts.every(product => product.productState === 'unloaded') &&
      currentServices.every(service => service.serviceState === 'done')

    if (issReadyToPutaway) {
      await this._updateOrderState()
    }
  }

  async _updateOrderState() {
    await client.query({
      query: gql`
        mutation {
          order: updatePurchaseOrder(${gqlBuilder.buildArgs({
            name: this.rawOrderData.name,
            patch: {
              state: 'Unloaded'
            }
          })}) {
            name
            description
          }
        }
      `
    })
    this._notify(i18next.t('text.order_is_ready_for_putaway'))
  }

  async _getServices() {
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
                value: this.orderNo
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

    if (response.data.orders.items[0]) {
      this.rawOrderData = this._parseOrder(response.data.orders.items[0])
      this._fillUpForm(this.rawOrderData)
      this.data = {
        records: this.rawOrderData.description.services.filter(service => service.serviceState !== 'done'),
        total: this.rawOrderData.description.services.length
      }
    }
  }

  _parseOrder(rawData) {
    return {
      ...rawData,
      description: JSON.parse(rawData.description)
    }
  }

  _fillUpForm(order) {
    this.shadowRoot.querySelector('input[name=purchase_order]').value = order.name
    this.shadowRoot.querySelector('input[name=supplier_name]').value = order.description.supplier
    this.shadowRoot.querySelector('input[name=gan]').value = order.description.gan

    const issuedDate = new Date(Number(order.issuedOn))
    const year = issuedDate.getFullYear()
    const month = issuedDate.getMonth() + 1 < 10 ? `0${issuedDate.getMonth() + 1}` : issuedDate.getMonth() + 1
    const date = issuedDate.getDate() < 10 ? `0${issuedDate.getDate()}` : issuedDate.getDate()
    const hours = issuedDate.getHours() < 10 ? `0${issuedDate.getHours()}` : issuedDate.getHours()
    const minutes = issuedDate.getMinutes() < 10 ? `0${issuedDate.getMinutes()}` : issuedDate.getMinutes()

    this.shadowRoot.querySelector('input[name=eta_date').value = `${year}-${month}-${date}`
    this.shadowRoot.querySelector('input[name=eta_time').value = `${hours}:${minutes}`
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

window.customElements.define('vas-work-order', VasWorkOrder)
