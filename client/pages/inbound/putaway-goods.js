import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

class PutawayGoods extends localize(i18next)(PageView) {
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
          background-color: var(--main-section-background-color);
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
      title: i18next.t('title.putaway_goods_master'),
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
        <fieldset>
          <legend>${i18next.t('title.putaway_goods_master')}</legend>
          <label>${i18next.t('label.order_no')}</label>
          <input
            name="order_no"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this.orderNo = e.currentTarget.value
                this.data = this._getProducts()
              }
            }}"
          />

          <label>${i18next.t('label.purchase_order')}</label>
          <input name="purchase_order" readonly />

          <label>${i18next.t('label.supplier_name')}</label>
          <input name="supplier_name" readonly />

          <label>${i18next.t('label.gan')}</label>
          <input name="gan" readonly />

          <label>${i18next.t('label.eta_date')}</label>
          <input name="eta_date" readonly />

          <label>${i18next.t('label.eta_time')}</label>
          <input name="eta_time" readonly />
        </fieldset>

        <fieldset>
          <legend>${i18next.t('title.putaway_goods_scan_area')}</legend>

          <label>${i18next.t('label.product_barcode')}</label>
          <input name="product-barcode" />

          <label>${i18next.t('labe.location')}</label>
          <input name="location" />
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.putaway_goods_detail')}</h2>

        <data-grist .mode=${isMobileDevice() ? 'LIST' : 'GRID'} .config=${this.config} .data=${this.data}></data-grist>
      </div>
    `
  }

  firstUpdated() {
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
          gutterName: 'button',
          icon: 'check',
          handlers: {
            dblclick: async (columns, data, column, record, rowIndex) => {
              this.rawOrderData.description.products.forEach(item => {
                if (item.product.name === record.product.name) {
                  item.productState = 'putaway'
                }
              })

              await this._updatePurchaseOrder()
              await this._getProducts()
            }
          }
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
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
            align: 'center'
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
          name: 'pack_qty',
          header: i18next.t('field.pack_qty'),
          record: {
            align: 'center'
          },
          width: 80
        },
        {
          type: 'number',
          name: 'total_qty',
          header: i18next.t('field.total_qty'),
          record: {
            align: 'center'
          },
          width: 80
        },
        {
          type: 'number',
          name: 'container_no',
          header: i18next.t('field.container_no'),
          record: {
            align: 'center'
          },
          width: 120
        },
        {
          type: 'number',
          name: 'batch_no',
          header: i18next.t('field.batch_no'),
          record: {
            align: 'center'
          },
          width: 80
        },
        {
          type: 'string',
          name: 'buffer_location',
          header: i18next.t('field.buffer_location'),
          record: {
            align: 'center'
          },
          width: 120
        }
      ]
    }

    this._focusOnBarcodField()
  }

  _focusOnBarcodField() {
    this.shadowRoot.querySelector('input[name=order_no]').focus()
  }

  async _getProducts() {
    const response = await client.query({
      query: gql`
        query {
          orders: purchaseOrders(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'state',
                operator: 'eq',
                value: 'Unloaded'
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
        records: this.rawOrderData.description.products.filter(product => product.productState !== 'putaway'),
        total: this.rawOrderData.description.products.length
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
    if (currentProducts.every(product => product.productState === 'putaway')) {
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
              state: 'Putaway'
            }
          })}) {
            name
            description
          }
        }
      `
    })

    this._notify(i18next.t('text.putaway_is_done'))
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

window.customElements.define('putaway-goods', PutawayGoods)
