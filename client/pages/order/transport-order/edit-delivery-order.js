import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, navigate, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'

class EditDeliveryOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _doNo: String,
      _status: String,
      _loadTypes: Array
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
      title: i18next.t('title.edit_delivery_order'),
      actions: [
        {
          title: i18next.t('button.confirm'),
          action: this._editDeliveryOrder.bind(this)
        }
      ]
    }
  }

  constructor() {
    super()
    this._loadTypes = []
  }

  render() {
    return html`
      <div class="co-form-container">
        <form name="deliveryOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.delivery_order')}</legend>
            <label>${i18next.t('label.issued_do_no')}</label>
            <input name="name" required />

            <label>${i18next.t('label.delivery_date')}</label>
            <input name="deliveryDate" type="date" min="${this._getStdDate()}" required />

            <label>${i18next.t('label.destination')}</label>
            <input name="to" required />

            <label>${i18next.t('label.ref_no')}</label>
            <input name="refNo" />

            <label>${i18next.t('label.load_type')}</label>
            <select name="loadType" required>
              <option value=""></option>
              ${this._loadTypes.map(
                loadType => html`
                  <option value="${loadType.name}">${i18next.t(`label.${loadType.description}`)}</option>
                `
              )}
            </select>

            <!-- <label>${i18next.t('label.document')}</label>
            <input name="attachment" type="file" required /> -->
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

  pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._doNo = changes.resourceId
      this._fetchDeliveryOrder()
    }
  }

  async _fetchDeliveryOrder() {
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
            from
            to
            loadType
            status
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
      this._status = deliveryOrder.status
      this._fillupDOForm(deliveryOrder)
    }
  }

  _fillupDOForm(data) {
    this._fillupForm(this.deliveryOrderForm, data)
  }

  _fillupForm(form, data) {
    for (let key in data) {
      Array.from(form.querySelectorAll('input, textarea, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString().split('T')[0]
  }

  async _editDeliveryOrder() {
    try {
      this._validateForm()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.save_delivery_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      let args = {
        name: this._doNo,
        deliveryOrder: this._getDeliveryOrder()
      }

      const response = await client.query({
        query: gql`
            mutation {
              editDeliveryOrder(${gqlBuilder.buildArgs(args)}) {
                id
                name
              }
            }
          `
      })

      if (!response.errors) {
        navigate(`delivery_order_detail/${response.data.editDeliveryOrder.name}`)
        this._showToast({ message: i18next.t('delivery_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateForm() {
    // collection order and delivery order
    //    - condition: not imported and not own transport

    if (!this.deliveryOrderForm.checkValidity()) throw new Error('text.delivery_order_form_invalid')
  }

  _getDeliveryOrder() {
    return this._serializeForm(this.deliveryOrderForm)
  }

  _serializeForm(form) {
    let obj = {}
    Array.from(form.querySelectorAll('input, select')).forEach(field => {
      if (!field.hasAttribute('hidden') && field.value) {
        obj[field.name] = field.type === 'checkbox' ? field.checked : field.value
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

window.customElements.define('edit-delivery-order', EditDeliveryOrder)
