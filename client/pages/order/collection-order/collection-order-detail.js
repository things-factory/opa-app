import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS } from '../constants/order'

class CollectionOrderDetail extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _orderName: String,
      _status: String,
      _assignedDriverName: String,
      _assignedVehicleName: String,
      productGristConfig: Object,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object
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
      title: i18next.t('title.collection_order_detail')
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.fetchCollectionOrder()
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>
            ${i18next.t('title.co_no')}: ${this._orderName}
          </legend>

          <label>${i18next.t('label.from')}</label>
          <input name="from" disabled />

          <label>${i18next.t('label.to')}</label>
          <input name="to" disabled />

          <label>${i18next.t('label.collection_date')}</label>
          <input name="collectionDateTime" type="datetime-local" disabled />

          <label>${i18next.t('label.loadType')}</label>
          <select name="loadType" disabled>
            ${LOAD_TYPES.map(
              loadType => html`
                <option value="${loadType.value}">${i18next.t(`label.${loadType.name}`)}</option>
              `
            )}
          </select>

          <label>${i18next.t('label.assigned_truck')}</label>
          <input name=${this._assignedVehicleName} value=${this._assignedVehicleName} disabled />

          <label>${i18next.t('label.assigned_driver')}</label>
          <input name=${this._assignedDriverName} value=${this._assignedDriverName} disabled />

          <label>${i18next.t('label.tel_no')}</label>
          <input name="telNo" disabled />
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

        <data-grist
          id="product-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productGristConfig}
          .data="${this.productData}"
        ></data-grist>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this.productData = {}
    this.vasData = {}
  }

  pageInitialized() {
    this.productGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: {
            align: 'center',
            options: { queryName: 'products' }
          },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: {
            align: 'center',
            options: { queryName: 'products' }
          },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { align: 'center' },
          width: 180
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'select',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { align: 'center', options: ['kg', 'g'] },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'totalWeight',
          header: i18next.t('field.total_weight'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { align: 'center' },
          width: 80
        }
      ]
    }

    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: {
            align: 'center',
            options: { queryName: 'vass' }
          },
          width: 250
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { align: 'center' },
          width: 180
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: {
            align: 'center',
            options: [i18next.t('label.all')]
          },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'center' },
          width: 350
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('_orderName')) {
      this.fetchCollectionOrder()
    }
  }

  async fetchCollectionOrder() {
    const response = await client.query({
      query: gql`
        query {
          collectionOrder(${gqlBuilder.buildArgs({
            name: this._orderName
          })}) {
            id
            name
            collectionDateTime
            from
            to
            loadType
            truckNo
            telNo
            status
            transportDriver {
              id
              name
            }
            transportVehicle {
              id
              name
            }
            orderProducts {
              id
              batchId
              product {
                id
                name
                description
              }
              description
              packingType
              weight
              unit
              packQty
              totalWeight
              palletQty
            }
            orderVass {
              vas {
                id
                name
                description
              }
              description
              batchId
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      const driver = response.data.collectionOrder.transportDriver || { name: '' }
      const vehicle = response.data.collectionOrder.transportVehicle || { name: '' }
      this._assignedDriverName = driver.name
      this._assignedVehicleName = vehicle.name

      this._status = response.data.collectionOrder.status
      this._actionsHandler()
      this._fillupForm(response.data.collectionOrder)
      this.productData = {
        ...this.productData,
        records: response.data.collectionOrder.orderProducts
      }

      this.vasData = {
        ...this.vasData,
        records: response.data.collectionOrder.orderVass
      }
    }
  }

  _fillupForm(collectionOrder) {
    for (let key in collectionOrder) {
      Array.from(this.form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(collectionOrder[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = collectionOrder[key]
        }
      })
    }
  }

  async _updateCollectionOrder(patch) {
    const response = await client.query({
      query: gql`
        mutation {
          updateCollectionOrder(${gqlBuilder.buildArgs({
            name: this._orderName,
            patch
          })}) {
            name 
          }
        }
      `
    })

    if (!response.errors) {
      this.fetchCollectionOrder()
    } else {
      throw new Error(response.errors[0])
    }
  }

  async _confirmCollectionOrder() {
    const response = await client.query({
      query: gql`
        mutation {
          confirmCollectionOrder(${gqlBuilder.buildArgs({
            name: this._orderName
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
              await this._updateCollectionOrder({ status: ORDER_STATUS.EDITING.value })
              this._showToast({ message: i18next.t('text.collection_order_now_editable') })
            } catch (e) {
              this._showToast(e)
            }
          }
        },
        {
          title: i18next.t('button.confirm'),

          action: async () => {
            try {
              await this._confirmCollectionOrder()
              Swal.fire({
                title: i18next.t('text.are_you_sure?'),
                text: i18next.t('text.you_wont_be_able_to_revert_this!'),
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#22a6a7',
                cancelButtonColor: '#cfcfcf',
                confirmButtonText: 'Yes, confirm it!'
              }).then(result => {
                if (result.value) {
                  this._showToast({ message: i18next.t('text.collection_order_confirmed') })
                  navigate('collection_orders')
                }
              })
            } catch (e) {
              this._showToast(e)
            }
          }
        }
      ]
    } else if (this._status === ORDER_STATUS.EDITING.value) {
      navigate(`create_collection_order/${this._orderName}`)
    }

    actions = [...actions, { title: i18next.t('button.back'), action: () => navigate('collection_orders') }]

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
      this._orderName = state && state.route && state.route.resourceId
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

window.customElements.define('collection-order-detail', CollectionOrderDetail)
