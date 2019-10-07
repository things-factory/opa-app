import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { ORDER_STATUS } from '../constants/order'
import { CARGO_TYPES } from '../constants/cargo'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'

class DeliveryOrderDetail extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _doNo: String,
      _status: String,
      _assignedDriverName: String,
      _assignedVehicleName: String,
      _path: String,
      _deliveryCargo: String
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
      title: i18next.t('title.delivery_order_detail'),
      actions: this._actions
    }
  }

  constructor() {
    super()
    this._path = ''
    this._deliveryCargo = null
  }

  render() {
    return html`
      <div class="co-form-container">
        <form name="deliveryOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.delivery_order')}</legend>
            <label>${i18next.t('label.issued_do_no')}</label>
            <input name="name" readonly />

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="deliveryDate" type="date" readonly />

            <label>${i18next.t('label.destination')}</label>
            <input name="to" readonly />

            <label>${i18next.t('label.ref_no')}</label>
            <input name="refNo" readonly />

            <label>${i18next.t('label.cargo_type')}</label>
            <select name="cargoType" disabled>
              <option value=""></option>
              ${Object.keys(CARGO_TYPES).map(key => {
                const deliveryCargo = CARGO_TYPES[key]
                return html`
                  <option value="${deliveryCargo.value}">${i18next.t(`label.${deliveryCargo.name}`)}</option>
                `
              })}
            </select>

            <label ?hidden="${this._deliveryCargo !== CARGO_TYPES.OTHERS.value}"
              >${i18next.t('label.if_others_please_specify')}</label
            >
            <input
              ?hidden="${this._deliveryCargo !== CARGO_TYPES.OTHERS.value}"
              ?required="${this._deliveryCargo == CARGO_TYPES.OTHERS.value}"
              name="otherCargo"
              readonly
            />

            <label>${i18next.t('label.load_weight')} <br />(${i18next.t('label.metric_tonne')})</label>
            <input name="loadWeight" type="number" min="0" readonly />

            <input name="urgency" type="checkbox" readonly />
            <label>${i18next.t('label.urgent_delivery')}</label>

            <label>${i18next.t('label.assigned_truck')}</label>
            <input name=${this._assignedVehicleName} value=${this._assignedVehicleName} readonly />

            <label>${i18next.t('label.assigned_driver')}</label>
            <input name=${this._assignedDriverName} value=${this._assignedDriverName} readonly />

            <label>${i18next.t('label.download_co')}</label>
            <a href="/attachment/${this._path}" download><mwc-icon>cloud_download</mwc-icon></a>
          </fieldset>
        </form>
      </div>
    `
  }

  get deliveryOrderForm() {
    return this.shadowRoot.querySelector('form[name=deliveryOrder]')
  }

  async firstUpdated() {
    this._loadTypes = await getCodeByName('LOAD_TYPES')
  }

  async pageUpdated(changes) {
    if (this.active) {
      this._doNo = changes.resourceId || this._doNo || ''
      await this._fetchDeliveryOrder()
      this._updateContext()
    }
  }

  async _fetchDeliveryOrder() {
    if (!this._doNo) return
    this._status = ''
    const response = await client.query({
      query: gql`
        query {
          deliveryOrder(${gqlBuilder.buildArgs({
            name: this._doNo
          })}) {
            id
            name
            deliveryDate
            refNo
            to
            loadWeight
            status
            urgency
            cargoType
            otherCargo
            attachments {
              id
              name
              refBy
              path
            }
            transportVehicle {
              id
              name
              description
            }
            transportDriver {
              id
              name
              description
            }
          }
        }
      `
    })

    if (!response.errors) {
      const deliveryOrder = response.data.deliveryOrder
      const driver = deliveryOrder.transportDriver || { name: '' }
      const vehicle = deliveryOrder.transportVehicle || { name: '' }

      this._path = deliveryOrder.attachments[0].path
      this._deliveryCargo = deliveryOrder.cargoType
      this._assignedDriverName = driver.name
      this._assignedVehicleName = vehicle.name
      this._status = deliveryOrder.status
      this._fillupDOForm(deliveryOrder)
    }
  }

  _getDeliveryOrder() {
    return this._serializeForm(this.deliveryOrderForm)
  }

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.PENDING.value) {
      this._actions = [
        {
          title: i18next.t('button.delete'),
          action: this._deleteDeliveryOrder.bind(this)
        },
        {
          title: i18next.t('button.confirm'),
          action: this._confirmDeliveryOrder.bind(this)
        }
      ]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _fillupDOForm(data) {
    this._fillupForm(this.deliveryOrderForm, data)
  }

  _fillupForm(form, data) {
    for (let key in data) {
      Array.from(form.querySelectorAll('input, textarea, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type !== 'file') {
          field.value = data[key]
        }
      })
    }
  }

  async _deleteDeliveryOrder() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.remove_order_permanently'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (result.value) {
        const response = await client.query({
          query: gql`
            mutation {
              deleteDeliveryOrder(${gqlBuilder.buildArgs({ name: this._doNo })})
            }
          `
        })

        if (!response.errors) {
          this._showToast({ message: i18next.t('text.order_has_been_removed') })
          navigate(`delivery_orders`)
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _confirmDeliveryOrder() {
    const result = await CustomAlert({
      title: i18next.t('title.are_you_sure'),
      text: i18next.t('text.confirm_delivery_order'),
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (!result.value) {
      return
    }

    try {
      const response = await client.query({
        query: gql`
            mutation {
              confirmDeliveryOrder(${gqlBuilder.buildArgs({
                name: this._doNo
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.delivery_order_confirmed') })
        navigate('delivery_orders')
      }
    } catch (e) {
      this._showToast(e)
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

window.customElements.define('delivery-order-detail', DeliveryOrderDetail)
