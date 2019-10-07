import { getCodeByName } from '@things-factory/code-base'
import { CARGO_TYPES } from '../constants/cargo'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class RejectedCollectionOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _coNo: String,
      _status: String,
      _path: String,
      _cargoTypes: Array,
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
      title: i18next.t('title.collection_order_detail'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ]
    }
  }

  constructor() {
    super()
    this._path = ''
    this._deliveryCargo = null
    this._cargoTypes = []
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
              ${this._cargoTypes.map(
                cargoType => html`
                  <option value="${cargoType.name}">${i18next.t(`label.${cargoType.description}`)}</option>
                `
              )}
            </select>

            <label ?hidden="${this._collectionCargo !== CARGO_TYPES.OTHERS.value}"
              >${i18next.t('label.if_others_please_specify')}</label
            >
            <input
              ?hidden="${this._collectionCargo !== CARGO_TYPES.OTHERS.value}"
              ?required="${this._collectionCargo == CARGO_TYPES.OTHERS.value}"
              name="otherCargo"
              readonly
            />

            <label>${i18next.t('label.load_weight')} <br />(${i18next.t('label.metric_tonne')})</label>
            <input name="loadWeight" type="number" min="0" readonly />

            <input name="urgency" type="checkbox" readonly />
            <label>${i18next.t('label.urgent_delivery')}</label>

            <label>${i18next.t('label.rejection_remark')}</label>
            <textarea name="remark" readonly></textarea>

            <label>${i18next.t('label.download_co')}</label>
            <a href="/attachment/${this._path}" target="_blank"><mwc-icon>cloud_download</mwc-icon></a>
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

  async pageUpdated(changes) {
    if (this.active) {
      this._coNo = changes.resourceId || this._coNo || ''
      this._fetchCollectionOrder()
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
            otherCargo
            status
            remark
            attachments {
              id
              name
              refBy
              path
            }
          }
        }
      `
    })

    if (!response.errors) {
      const collectionOrder = response.data.collectionOrder
      this._path = collectionOrder.attachments[0].path
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
        } else if (field.name === key && field.type !== 'file') {
          field.value = data[key]
        }
      })
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

window.customElements.define('rejected-collection-order', RejectedCollectionOrder)
