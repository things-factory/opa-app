import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { ORDER_STATUS } from '../constants/order'

class VasOrderDetail extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _vasNo: String,
      vasGristConfig: Object,
      vasData: Object,
      _status: String
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
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
      title: i18next.t('title.vas_order_detail')
    }
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.fetchVasOrder()
    }
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this.vasData = {}
  }

  pageInitialized() {
    this.vasGristConfig = {
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
              this.vasData = {
                ...this.vasData,
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
          type: 'object',
          name: 'product',
          header: i18next.t('field.inventory_list'),
          record: { editable: true, align: 'center' },
          width: 250
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('_vasNo')) {
      this.fetchVasOrder()
    }
  }

  async fetchVasOrder() {
    const response = await client.query({
      query: gql`
        query {
          vasOrder(${gqlBuilder.buildArgs({
            name: this._vasNo
          })}) {
            id
            name
            status
            inventoryDetail {
              name
              batchId
              product {
                name
                description
              }
              location {
                name
              }
            }
            orderVass {
              vas {
                name
                description
              }
              description
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._status = response.data.vasOrder.status
      this._actionsHandler()

      this.vasData = {
        ...this.vasData,
        records: response.data.vasOrder.orderVass
      }
    }
  }

  async _updateVasOrder(patch) {
    const response = await client.query({
      query: gql`
        mutation {
          updateVasOrder(${gqlBuilder.buildArgs({
            name: this._vasNo,
            patch
          })}) {
            name 
          }
        }
      `
    })

    if (!response.errors) {
      this.fetchVasOrder()
    } else {
      throw new Error(response.errors[0])
    }
  }

  async _confirmVasOrder() {
    const response = await client.query({
      query: gql`
        mutation {
          confirmVasOrder(${gqlBuilder.buildArgs({
            name: this._vasNo
          })}) {
            name
          }
        }
      `
    })

    if (response.errors) {
      throw new Error(response.errors[0])
    }
  }

  _actionsHandler() {
    let actions = []

    if (this._status === ORDER_STATUS.PENDING.value) {
      actions = [
        {
          title: i18next.t('button.edit'),
          action: async () => {
            try {
              await this._updateVasOrder({ status: ORDER_STATUS.EDITING.value })
              this._showToast({ message: i18next.t('text.order_is_now_editable') })
            } catch (e) {
              this._showToast(e)
            }
          }
        },
        {
          title: i18next.t('button.confirm'),
          action: async () => {
            try {
              await this._confirmVasOrder()
              Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, confirm it!'
              }).then(result => {
                if (result.value) {
                  this._showToast({ message: i18next.t('text.order_is_confirmed') })
                  navigate('vas_orders')
                }
              })
            } catch (e) {
              this._showToast(e)
            }
          }
        }
      ]
    } else if (this._status === ORDER_STATUS.EDITING.value) {
      navigate(`create_vas_order/${this._vasNo}`)
    }

    actions = [...actions, { title: i18next.t('button.back'), action: () => navigate('vas_orders') }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        ...this.context,
        actions
      }
    })
  }

  stateChanged(state) {
    if (this.active) {
      this._vasNo = state && state.route && state.route.resourceId
    }
  }

  _showToast({ type, message }) {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          type,
          message
        }
      })
    )
  }
}

window.customElements.define('vas-order-detail', VasOrderDetail)
