import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { ORDER_STATUS } from '../constants/order'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'

class CollectionOrderDetail extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _coNo: String,
      _status: String,
      _loadTypes: Array,
      _assignedDriverName: String,
      _assignedVehicleName: String,
      _path: String,
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
      title: i18next.t('title.collection_order_detail'),
      actions: this._actions
    }
  }

  constructor() {
    super()
    this._transportOptions = []
    this._loadTypes = []
    this._path = ''
    this._collectionCargo = null
  }

  render() {
    return html`
      <div class="co-form-container">
        <form name="collectionOrder" class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.collection_order')}</legend>
            <label>${i18next.t('label.issued_co_no')}</label>
            <input name="name" readonly />

            <label>${i18next.t('label.collection_date')}</label>
            <input name="collectionDate" type="date" readonly />

            <label>${i18next.t('label.destination')}</label>
            <input name="from" readonly />

            <label>${i18next.t('label.ref_no')}</label>
            <input name="refNo" readonly />

            <label>${i18next.t('label.cargo_type')}</label>
            <select name="cargoType" disabled>
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
              readonly
            />

            <label>${i18next.t('label.load_weight')} <br />(${i18next.t('label.metric_tonne')})</label>
            <input name="loadWeight" type="number" min="0" readonly />

            <input name="urgency" type="checkbox" readonly />
            <label>${i18next.t('label.urgent_delivery')}</label>

            <label>${i18next.t('label.download_file')}</label>
            <a href="/attachment/${this._path}" target="_blank">${i18next.t('download_co')}</a>

            <label>${i18next.t('label.assigned_truck')}</label>
            <input name=${this._assignedVehicleName} value=${this._assignedVehicleName} readonly />

            <label>${i18next.t('label.assigned_driver')}</label>
            <input name=${this._assignedDriverName} value=${this._assignedDriverName} readonly />
          </fieldset>
        </form>
      </div>
    `
  }

  get collectionOrderForm() {
    return this.shadowRoot.querySelector('form[name=collectionOrder]')
  }

  async firstUpdated() {
    this._loadTypes = await getCodeByName('LOAD_TYPES')
  }

  async pageUpdated(changes) {
    if (this.active) {
      this._coNo = changes.resourceId || this._coNo || ''
      await this._fetchCollectionOrder()
      this._updateContext()
    }
  }

  async _fetchCollectionOrder() {
    if (!this._coNo) return
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
            urgency
            otherCargoType
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
      const driver = collectionOrder.transportDriver || { name: '' }
      const vehicle = collectionOrder.transportVehicle || { name: '' }

      this._path = collectionOrder.attachments[0].path
      this._collectionCargo = collectionOrder.cargoType
      this._assignedDriverName = driver.name
      this._assignedVehicleName = vehicle.name
      this._status = collectionOrder.status
      this._fillupCOForm(collectionOrder)
    }
  }

  _getCollectionOrder() {
    return this._serializeForm(this.collectionOrderForm)
  }

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.PENDING.value) {
      this._actions = [
        {
          title: i18next.t('button.edit'),
          type: 'transaction',
          action: this._changeToEditable.bind(this)
        },
        {
          title: i18next.t('button.confirm'),
          type: 'transaction',
          action: this._confirmCollectionOrder.bind(this)
        }
      ]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _fillupCOForm(data) {
    this._fillupForm(this.collectionOrderForm, data)
  }

  _fillupForm(form, data) {
    for (let key in data) {
      Array.from(form.querySelectorAll('input, textarea, select, a')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  async _changeToEditable(cb) {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.change_to_editable'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (result.value) {
        const response = await client.query({
          query: gql`
            mutation {
              updateCollectionOrder(${gqlBuilder.buildArgs({
                name: this._coNo,
                patch: { status: ORDER_STATUS.EDITING.value }
              })}) {
                name 
              }
            }
          `
        })

        if (!response.errors) {
          navigate(`edit_collection_order/${this._coNo}`)
        }
      }
    } catch (e) {
      this._showToast(e)
    } finally {
      cb()
    }
  }

  async _confirmCollectionOrder(cb) {
    const result = await CustomAlert({
      title: i18next.t('title.are_you_sure'),
      text: i18next.t('text.confirm_collection_order'),
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') }
    })
    if (!result.value) {
      cb()
      return
    }

    try {
      const response = await client.query({
        query: gql`
            mutation {
              confirmCollectionOrder(${gqlBuilder.buildArgs({
                name: this._coNo
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.collection_order_confirmed') })
        navigate('collection_orders')
      }
    } catch (e) {
      this._showToast(e)
    } finally {
      cb()
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
