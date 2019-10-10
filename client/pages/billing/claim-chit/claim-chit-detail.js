import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { TRIP_CLAIM } from '../constants/claim'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store, flattenObject } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { BILLING_MODE } from '../constants/claim'

class ClaimChitDetail extends connect(store)(localize(i18next)(PageView)) {
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

  static get properties() {
    return {
      _claimId: String,
      _gristData: Object,
      _claimDetailGristConfig: Object
    }
  }

  constructor() {
    super()
  }

  get context() {
    return {
      title: i18next.t('claim_chit_detail'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ]
    }
  }

  get _columns() {
    return this._claimDetailGristConfig.columns
  }

  get _form() {
    return this.shadowRoot.querySelector('form')
  }

  get _dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async pageInitialized() {
    this._orderType = { name: '' }
    this._claimDetailGristConfig = {
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: false },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: false, align: 'center' },
          width: 600
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.receipt_reference_no'),
          record: { editable: false, align: 'center' },
          width: 500
        },
        {
          type: 'float',
          name: 'amount',
          header: i18next.t('field.amount'),
          record: { editable: false, align: 'center' },
          width: 180
        }
      ]
    }

    await this.updateComplete
    this._dataGrist.fetch()
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.claim_chit_detail')}</legend>

          <label>${i18next.t('label.order_no')}</label>
          <input readonly name="name" value="" data-name="name" />

          <label>${i18next.t('label.billing_mode')}</label>
          <input readonly name="billingMode" value="" data-name="billingMode" />

          <label>${i18next.t('label.date')}</label>
          <input readonly name="orderDate" value="" type="date" data-name="orderDate" />

          <label>${i18next.t('label.lorry_no')}</label>
          <input readonly name="lorryNo" value="" data-name="transportVehicleName" />

          <label>${i18next.t('label.driver_code')}</label>
          <input readonly name="driveCode" value="" data-name="transportDriverName" />

          <label>${i18next.t('label.from')}</label>
          <input readonly name="from" value="" data-name="from" />

          <label>${i18next.t('label.to')}</label>
          <input readonly name="to" value="" data-name="to" />
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.claim_chit_details')}</h2>

        <data-grist
          id="claim-details-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this._claimDetailGristConfig}
          .data="${this._gristData}"
        ></data-grist>
      </div>
    `
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this._claimId = changes.params.id || this._claimId || ''
      await this._fetchClaimChit()
    }
  }

  updated(changes) {}

  async _fetchClaimChit() {
    if (!this._claimId) return

    const response = await client.query({
      query: gql`
        query {
          claim(${gqlBuilder.buildArgs({
            id: this._claimId
          })}) {
            id
            name
            description
            billingMode
            transportDriverName
            transportVehicleName
            from
            to
            orderDate
            claimDetails {
              id
              name
              description
              refNo
              amount
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._gristData = {
        total: response.data.claim.claimDetails.length || 0,
        records: response.data.claim.claimDetails || {}
      }
      this._fillOrderDetails(response.data.claim)
    }
  }

  _fillOrderDetails(objData) {
    Object.keys(objData).map(key => {
      Array.from(this._form.querySelectorAll('input')).forEach(field => {
        if (field.dataset.name === key) field.value = objData[key]
      })
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

window.customElements.define('claim-chit-detail', ClaimChitDetail)
