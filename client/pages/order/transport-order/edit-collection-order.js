import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, navigate, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'

class EditCollectionOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _coNo: String,
      _status: String,
      _loadTypes: Array,
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
      title: i18next.t('title.edit_collection_order'),
      actions: [
        {
          title: i18next.t('button.confirm'),
          action: this._editCollectionOrder.bind(this)
        }
      ]
    }
  }

  constructor() {
    super()
    this._loadTypes = []
    this._collectionCargo = null
  }

  render() {
    return html`
      <div class="co-form-container">
        <form name="collectionOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.collection_order')}</legend>
            <label>${i18next.t('label.issued_co_no')}</label>
            <input name="name" required />

            <label>${i18next.t('label.collection_date')}</label>
            <input name="collectionDate" type="date" min="${this._getStdDate()}" required />

            <label>${i18next.t('label.destination')}</label>
            <input name="from" required />

            <label>${i18next.t('label.ref_no')}</label>
            <input name="refNo" />

            <label>${i18next.t('label.cargo_type')}</label>
            <select name="cargoType" @change="${e => (this._collectionCargo = e.currentTarget.value)}" required>
              <option value=""></option>
              ${Object.keys(CARGO_TYPES).map(key => {
                const collectionCargo = CARGO_TYPES[key]
                return html`
                  <option value="${collectionCargo.value}">${i18next.t(`label.${collectionCargo.name}`)}</option>
                `
              })}
            </select>

            <label ?hidden="${this._collectionCargo !== CARGO_TYPES.OTHERS.value}"
              >${i18next.t('label.if_others_please_specify')}</label
            >
            <input
              ?hidden="${this._collectionCargo !== CARGO_TYPES.OTHERS.value}"
              ?required="${this._collectionCargo == CARGO_TYPES.OTHERS.value}"
              name="otherCargoType"
              type="text"
            />

            <label>${i18next.t('label.load_weight')} <br />(${i18next.t('label.metric_tonne')})</label>
            <input name="loadWeight" type="number" min="0" required />

            <input name="urgency" type="checkbox" required />
            <label>${i18next.t('label.urgent_collection')}</label>

            <label>${i18next.t('label.upload_co')}</label>
            <input name="attachments" type="file" required />
          </fieldset>
        </form>
      </div>
    `
  }

  get collectionOrderForm() {
    return this.shadowRoot.querySelector('form[name=collectionOrder]')
  }

  async firstUpdated() {
    this._cargoTypes = await getCodeByName('CARGO_TYPES')
  }

  pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._coNo = changes.resourceId
      this._fetchCollectionOrder()
    }
  }

  async _fetchCollectionOrder() {
    this._status = ''
    const response = await client.query({
      query: gql`
        query {
          collectionOrder(${gqlBuilder.buildArgs({
            name: this._coNo
          })}) {
            id
            name
            collectionDate
            refNo
            from
            loadWeight
            cargoType
            otherCargoType
            urgency
            status
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
      const collectionOrder = response.data.collectionOrder
      this._collectionCargo = collectionOrder.cargoType
      this._status = collectionOrder.status
      this._fillupCOForm(collectionOrder)
    }
  }

  _fillupCOForm(data) {
    this._fillupForm(this.collectionOrderForm, data)
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

  async _editCollectionOrder() {
    try {
      this._validateForm()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.save_collection_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      let args = {
        name: this._coNo,
        collectionOrder: this._getCollectionOrder()
      }
      const attachments = this.uploadAttachment.files
      delete args.collectionOrder.attachments

      const response = await client.query({
        query: gql`
            mutation ($attachments: [Upload]!) {
              editCollectionOrder(${gqlBuilder.buildArgs(args)}) {
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
        navigate(`collection_order_detail/${response.data.editCollectionOrder.name}`)
        this._showToast({ message: i18next.t('collection_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateForm() {
    // collection order and delivery order
    //    - condition: not imported and not own transport

    if (!this.collectionOrderForm.checkValidity()) throw new Error('text.collection_order_form_invalid')
  }

  _getCollectionOrder() {
    return this._serializeForm(this.collectionOrderForm)
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

window.customElements.define('edit-collection-order', EditCollectionOrder)
