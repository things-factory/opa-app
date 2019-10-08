import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, navigate, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'
import { ORDER_TYPES } from '../constants/order'

class CreateTransportOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _orderNo: String,
      _status: String,
      _transportOptions: Array,
      _orderType: String,
      _deliveryCargo: String,
      _collectionCargo: String
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
      title: i18next.t('title.create_transport_order'),
      actions: [
        {
          title: i18next.t('button.create'),
          action: this._generateTransportOrder.bind(this)
        }
      ]
    }
  }

  constructor() {
    super()
    this._orderType = null
    this._collectionCargo = null
    this._deliveryCargo = null
    this._transportOptions = []
  }

  render() {
    return html`
      <form name="selectOrder" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.select_transport_order')}</legend>
          <label>${i18next.t('label.transport_type')}</label>
          <select name="transportOption" @change="${e => (this._orderType = e.currentTarget.value)}">
            <option value=""></option>
            ${this._transportOptions.map(
              transportOption => html`
                <option value="${transportOption.name}">${i18next.t(`label.${transportOption.name}`)}</option>
              `
            )}
          </select>
        </fieldset>
      </form>

      <div class="co-form-container" ?hidden="${this._orderType !== ORDER_TYPES.COLLECTION.value}">
        <form name="collectionOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.collection_order')}</legend>
            <label>${i18next.t('label.issued_co_no')}</label>
            <input name="name" ?required="${this._orderType == ORDER_TYPES.COLLECTION.value}" />

            <label>${i18next.t('label.collection_date')}</label>
            <input
              name="collectionDate"
              type="date"
              min="${this._getStdDate()}"
              ?required="${this._orderType == ORDER_TYPES.COLLECTION.value}"
            />

            <label>${i18next.t('label.collect_from')}</label>
            <input name="from" ?required="${this._orderType == ORDER_TYPES.COLLECTION.value}" />

            <label>${i18next.t('label.ref_no')}</label>
            <input name="refNo" />

            <label>${i18next.t('label.cargo_type')}</label>
            <input name="cargoType" placeholder="${i18next.t('bag_crates_carton_ibc_drums_pails')}" />

            <label>${i18next.t('label.load_weight')} <br />(${i18next.t('label.metric_tonne')})</label>
            <input name="loadWeight" type="number" min="0" />

            <input name="urgency" type="checkbox" />
            <label>${i18next.t('label.urgent_collection')}</label>

            <label>${i18next.t('label.upload_co')}</label>
            <file-uploader custom-input id="coUpload" name="attachments"></file-uploader>
          </fieldset>
        </form>
      </div>

      <div class="do-form-container" ?hidden="${this._orderType !== ORDER_TYPES.DELIVERY.value}">
        <form name="deliveryOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.delivery_order')}</legend>
            <label>${i18next.t('label.issued_do_no')}</label>
            <input name="name" ?required="${this._orderType == ORDER_TYPES.DELIVERY.value}" />

            <label>${i18next.t('label.delivery_date')}</label>
            <input
              name="deliveryDate"
              type="date"
              min="${this._getStdDate()}"
              ?required="${this._orderType == ORDER_TYPES.DELIVERY.value}"
            />

            <label>${i18next.t('label.deliver_to')}</label>
            <input name="to" ?required="${this._orderType == ORDER_TYPES.DELIVERY.value}" />

            <label>${i18next.t('label.ref_no')}</label>
            <input name="refNo" />

            <label>${i18next.t('label.cargo_type')}</label>
            <input name="cargoType" placeholder="${i18next.t('bag_crates_carton_ibc_drums_pails')}" />

            <label>${i18next.t('label.load_weight')} <br />(${i18next.t('label.metric_tonne')})</label>
            <input name="loadWeight" type="number" min="0" />

            <input name="urgency" type="checkbox" />
            <label>${i18next.t('label.urgent_delivery')}</label>

            <label>${i18next.t('label.upload_do')}</label>
            <file-uploader custom-input id="doUpload" name="attachments"></file-uploader>
          </fieldset>
        </form>
      </div>
    `
  }

  get collectionOrderForm() {
    return this.shadowRoot.querySelector('form[name=collectionOrder]')
  }

  get deliveryOrderForm() {
    return this.shadowRoot.querySelector('form[name=deliveryOrder]')
  }

  get uploadCOAttachment() {
    return this.shadowRoot.querySelector('#coUpload')
  }

  get uploadDOAttachment() {
    return this.shadowRoot.querySelector('#doUpload')
  }

  async firstUpdated() {
    this._transportOptions = await getCodeByName('TRANSPORT_TYPES')
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString().split('T')[0]
  }

  async _generateTransportOrder() {
    if (this._orderType == ORDER_TYPES.COLLECTION.value) {
      try {
        this._validateForm()

        const result = await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.create_collection_order'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) {
          return
        }

        let args = { collectionOrder: this._getCollectionOrder() }
        const attachments = this.uploadCOAttachment.files
        delete args.collectionOrder.attachments
        const response = await client.query({
          query: gql`
              mutation($attachments: [Upload]!) {
                generateCollectionOrder(${gqlBuilder.buildArgs(args)}, attachments: $attachments )  {
                  id
                  name
                }
              }
            `,
          variables: {
            attachments
          },
          context: {
            hasUpload: true
          }
        })

        if (!response.errors) {
          this._clearView()
          navigate(`collection_order_detail/${response.data.generateCollectionOrder.name}`)
          this._showToast({ message: i18next.t('collection_order_created') })
        }
      } catch (e) {
        this._showToast(e)
      }
    } else if (this._orderType == ORDER_TYPES.DELIVERY.value) {
      try {
        this._validateForm()

        const result = await CustomAlert({
          title: i18next.t('title.are_you_sure'),
          text: i18next.t('text.create_delivery_order'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) {
          return
        }

        let args = { deliveryOrder: this._getDeliveryOrder() }
        const attachments = this.uploadDOAttachment.files
        delete args.deliveryOrder.attachments
        const response = await client.query({
          query: gql`
              mutation($attachments: [Upload]!) {
                generateDeliveryOrder(${gqlBuilder.buildArgs(args)}, attachments: $attachments )  {
                  id
                  name
                }
              }
            `,
          variables: {
            attachments
          },
          context: {
            hasUpload: true
          }
        })

        if (!response.errors) {
          this._clearView()
          navigate(`delivery_order_detail/${response.data.generateDeliveryOrder.name}`)
          this._showToast({ message: i18next.t('delivery_order_created') })
        }
      } catch (e) {
        this._showToast(e)
      }
    }
  }

  _validateForm() {
    // collection order and delivery order
    //    - condition: not imported and not own transport
    if (this._orderType == ORDER_TYPES.COLLECTION.value) {
      if (!this.collectionOrderForm.checkValidity()) throw new Error('text.collection_order_form_invalid')
    } else if (this._orderType == ORDER_TYPES.DELIVERY.value) {
      if (!this.deliveryOrderForm.checkValidity()) throw new Error('text.delivery_order_form_invalid')
    }
  }

  _getCollectionOrder() {
    return this._serializeForm(this.collectionOrderForm)
  }

  _getDeliveryOrder() {
    return this._serializeForm(this.deliveryOrderForm)
  }

  _clearView() {
    this.deliveryOrderForm.reset()
    this.collectionOrderForm.reset()
  }

  _serializeForm(form) {
    let obj = {}
    Array.from(form.querySelectorAll('input, select')).forEach(field => {
      if (!field.hasAttribute('hidden') && field.value) {
        if (field.type === 'number' && field.name === 'loadWeight') {
          obj[field.name] = parseFloat(field.value)
        } else {
          obj[field.name] = field.type === 'checkbox' ? field.checked : field.value
        }
      }
    })

    return obj
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

window.customElements.define('create-transport-order', CreateTransportOrder)
