import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, navigate, PageView, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'
import '../../components/popup-note'

class CompleteCollectionOrder extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _coNo: String,
      _status: String,
      _path: String,
      transportDetail: Object
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
          title: i18next.t('button.completed'),
          action: this._checkCollectionOrder.bind(this)
        },
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
    this.transportDetail = { records: [] }
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
            <input name="cargoType" placeholder="${i18next.t('label.bag_crates_carton_ibc_drums_pails')}" />

            <label>${i18next.t('label.load_weight')} <br />(${i18next.t('label.metric_tonne')})</label>
            <input name="loadWeight" type="number" min="0" readonly />

            <input name="urgency" type="checkbox" disabled />
            <label>${i18next.t('label.urgent_delivery')}</label>

            <input name="looseItem" type="checkbox" disabled />
            <label>${i18next.t('label.loose_item')}</label>

            <label>${i18next.t('label.download_co')}</label>
            <a href="/attachment/${this._path}" target="_blank"><mwc-icon>cloud_download</mwc-icon></a>
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.assigned_truck_and_driver')}</h2>

        <data-grist
          id="transport-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.transportOrderDetail}
          .data="${this.transportDetail}"
        ></data-grist>
      </div>
    `
  }

  get transportDetailGrist() {
    return this.shadowRoot.querySelector('data-grist#transport-grist')
  }

  get collectionOrderForm() {
    return this.shadowRoot.querySelector('form[name=collectionOrder]')
  }

  pageInitialized() {
    this.transportOrderDetail = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'transportDriver',
          header: i18next.t('field.driver'),
          record: {
            align: 'center'
          },
          width: 250
        },
        {
          type: 'object',
          name: 'transportVehicle',
          header: i18next.t('field.truck_no'),
          record: { align: 'center' },
          width: 200
        },
        {
          type: 'float',
          name: 'assignedLoad',
          header: i18next.t('field.assigned_load'),
          record: { align: 'center' },
          width: 100
        }
      ]
    }
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
            looseItem
            urgency
            status
            attachments {
              id
              name
              refBy
              path
            }
            transportOrderDetails {
              assignedLoad
              transportDriver {
                id
                name
                driverCode
              }
              transportVehicle {
                id
                name
                regNumber
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      const collectionOrder = response.data.collectionOrder
      const transportOrderDetails = collectionOrder.transportOrderDetails

      this._path = collectionOrder.attachments[0].path
      this._status = collectionOrder.status
      this._fillupCOForm(collectionOrder)
      this.transportDetail = { records: transportOrderDetails }
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

  async _checkCollectionOrder() {
    const popup = openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.remark')}"
          @submit="${async e => {
            try {
              const result = await CustomAlert({
                title: i18next.t('title.are_you_sure'),
                text: i18next.t('text.completed_collection_order'),
                confirmButton: { text: i18next.t('button.confirm') },
                cancelButton: { text: i18next.t('button.cancel') }
              })

              if (!result.value) {
                return
              }

              const response = await client.query({
                query: gql`
                mutation {
                  checkCollectedOrder(${gqlBuilder.buildArgs({
                    name: this._coNo,
                    patch: { remark: e.detail.value }
                  })}) {
                    name
                  }
                }
              `
              })

              if (!response.errors) {
                navigate('collection_order_requests')
                this._showToast({ message: i18next.t('text.collection_order_completed') })
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
        title: i18next.t('title.completed_collection_order')
      }
    )
    popup.onclosed
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

window.customElements.define('complete-collection-order', CompleteCollectionOrder)
