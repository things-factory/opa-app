import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { reportPath2html } from '@things-factory/document-template-base'
import { gqlBuilder } from '@things-factory/utils'
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
      css`
        :host {
          display: flex;
          flex-direction: column;
          padding: 20px;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.goods_delivery_note_details'),
      actions: this._actions,
      printable: {
        accept: ['preview'],
        content: this
      }
    }
  }

  render() {
    return html`
      <div id="container"></div>
    `
  }

  async pageUpdated(changes) {
    if (this.active) {
      if (changes.resourceId) {
        this._doNo = changes.resourceId
        await this._fetchDeliveryOrder(this._doNo)
        this._updateContext()
      }
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
              partnerBizplace
              domainBizplace
              domainBrn
              domainAddress
              releaseGoodNo
              reportPath 
              logoPath 
              to
              ownCollection
              palletQty
              doStatus
              driverName
              deliveryDate
              truckNo
              updaterName
            }
            loadedInventoryInfo {
              palletId
              batchId
              product {
                id
                name
                description
              }
              packingType
              releaseQty
              releaseWeight
              status
              productDescription
            }
            contactPointInfo {
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
      const doDetails = deliveryOrderData.deliveryOrderInfo

      const html = await reportPath2html({
        reportFilePath: doDetails.reportPath,
        data: {
          logo_url: doDetails.logoPath,
          customer_biz: doDetails.partnerBizplace,
          company_domain: doDetails.domainBizplace,
          company_brn: doDetails.domainBrn,
          company_address: doDetails.domainAddress,
          destination: doDetails.to || '',
          order_no: doDetails.releaseGoodNo,
          delivery_date: doDetails.deliveryDate || '',
          truck_no: (doDetails && doDetails.truckNo) || '',
          driver_name: doDetails.driverName || '',
          pallet_qty: doDetails.palletQty || 0,
          worker_name: doDetails.updaterName,
          product_list: deliveryOrderData.loadedInventoryInfo.map((list, idx) => {
            return {
              list_no: idx,
              product_name: list.product.name,
              product_type: list.packingType,
              product_description: list.productDescription,
              product_batch: list.batchId,
              product_qty: list.releaseQty,
              product_weight: list.releaseWeight
            }
          })
        }
      })

      this.shadowRoot.querySelector('#container').innerHtml = html

      this._status = deliveryOrderData.deliveryOrderInfo.doStatus
      this._ownCollection = deliveryOrderData.deliveryOrderInfo.ownCollection
      this._customerContactPoints = deliveryOrderData.contactPointInfo
    }
  }

  async _executeDeliveryOrder() {
    try {
      this._validateInput()
      this._proceedFlag = false

      if (!this._recipient) {
        await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.dispatch_delivery_order_without_delivery_address'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') },
          callback: async result => {
            if (result.dismiss) return
            else if (result.value) this._proceedFlag = true
          }
        })
      } else {
        await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.dispatch_delivery_order'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') },
          callback: async result => {
            if (result.dismiss) return
            else if (result.value) this._proceedFlag = true
          }
        })
      }

      if (this._proceedFlag === true) {
        var args = {
          orderInfo: {
            name: this._doNo,
            to: this._recipient,
            deliveryDate: this._date,
            driverName: this._driverName || null
          }
        }

        const response = await client.query({
          query: gql`
            mutation {
              dispatchDeliveryOrder(${gqlBuilder.buildArgs(args)}) {
                name
              }
            }
          `
        })

        if (!response.errors) {
          this._status = ORDER_STATUS.DELIVERING
          this._updateContext()
          this._showToast({ message: i18next.t('text.dispatch_successful') })
        }
      }
    } catch (e) {
      this._showToast(e)
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

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

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
