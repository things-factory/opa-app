import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { getPathInfo, gqlBuilder } from '@things-factory/utils'
import { ScrollbarStyles } from '@things-factory/styles'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../../components/popup-note'
import { ORDER_STATUS } from '../constants/order'
import './delivery-note-popup'

class PrintDeliveryOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _doNo: String,
      _driverName: String,
      _ownCollection: Boolean,
      _truckNo: String,
      _status: String,
      _date: Date,
      _recipient: String,
      _proceedFlag: Boolean,
      _customerContactPoints: Array
    }
  }

  constructor() {
    super()
    this._date = ''
    this._status = ''
  }

  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        #container {
          flex: 1;
          padding: 0;
          margin: 0;
          border: 0;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.goods_delivery_note_details'),
      actions: this._actions
    }
  }

  render() {
    return html`
      <iframe id="container"></iframe>
    `
  }

  async pageUpdated(changes) {
    if (this.active) {
      if (changes.resourceId) {
        this._doNo = changes.resourceId
      }

      if (this._doNo) {
        await this._fetchDeliveryOrder(this._doNo)
      }

      this._updateContext()
    }
  }

  async _fetchDeliveryOrder(name) {
    const response = await client.query({
      query: gql`
        query {
          deliveryOrderByWorksheet(${gqlBuilder.buildArgs({
            name
          })}) {
            deliveryOrderInfo {
              doStatus
              ownCollection
              truckNo
            }
            contactPointInfo {
              id
              contactName
              address
              phone
              fax
              email
            }
          }
        }
      `
    })

    if (!response.errors) {
      const deliveryOrderData = response.data.deliveryOrderByWorksheet

      var { domain } = getPathInfo(location.pathname) // find out better way later.
      this.shadowRoot.querySelector('#container').src = `/view_document_do/${domain}/${this._doNo}`

      this._status = deliveryOrderData.deliveryOrderInfo.doStatus
      this._ownCollection = deliveryOrderData.deliveryOrderInfo.ownCollection
      this._customerContactPoints = deliveryOrderData.contactPointInfo
      this._truckNo = deliveryOrderData.deliveryOrderInfo.truckNo
    }
  }

  async _checkDeliveredOrder() {
    const popup = openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.remark')}"
          @submit="${async e => {
            try {
              const result = await CustomAlert({
                title: i18next.t('title.are_you_sure'),
                text: i18next.t('text.completed_delivery_order'),
                confirmButton: { text: i18next.t('button.confirm') },
                cancelButton: { text: i18next.t('button.cancel') }
              })

              if (!result.value) {
                return
              }

              const response = await client.query({
                query: gql`
                mutation {
                  checkDeliveredOrder(${gqlBuilder.buildArgs({
                    name: this._doNo,
                    patch: { remark: e.detail.value }
                  })}) {
                    name
                  }
                }
              `
              })

              if (!response.errors) {
                navigate('delivery_orders')
                this._showToast({ message: i18next.t('text.delivery_order_completed') })
              }
            } catch (e) {
              this._showToast(e)
            }
          }}"
        ></popup-note>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.completed_delivery_order')
      }
    )
    popup.onclosed
  }

  _editDeliveryNote() {
    openPopup(
      html`
        <delivery-note-popup
          .contactPoints="${this._customerContactPoints}"
          .ownCollection="${this._ownCollection}"
          .truckNo="${this._truckNo}"
          .doNo="${this._doNo}"
          @delivery-dispatched="${() => {
            this.pageReset()
          }}"
        ></delivery-note-popup>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.edit_delivery_note')
      }
    )
  }

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.READY_TO_DISPATCH.value) {
      this._actions = [
        {
          title: i18next.t('button.edit'),
          action: this._editDeliveryNote.bind(this)
        }
      ]
    } else if (this._status === ORDER_STATUS.DELIVERING.value) {
      this._actions = [
        {
          title: i18next.t('button.complete'),
          action: this._checkDeliveredOrder.bind(this)
        }
      ]
    }

    this._actions = [
      ...this._actions,
      {
        title: i18next.t('button.print'),
        action: () => {
          this.renderRoot.querySelector('iframe').contentWindow.print()
        }
      },
      { title: i18next.t('button.back'), action: () => navigate(`delivery_orders`) }
    ]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
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

window.customElements.define('print-delivery-note', PrintDeliveryOrder)
