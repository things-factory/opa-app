import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { TRIP_CLAIM } from './constants/claim'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store, flattenObject } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'

class TransportSummaryReport extends connect(store)(localize(i18next)(PageView)) {
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
      config: Object,
      data: Object,
      _claimDetailGristConfig: Object,
      _orders: Object,
      _selectedOrderNo: String,
      _claimDetailsData: Object
    }
  }

  constructor() {
    super()
    this._claimDetailsData = {}
  }

  get context() {
    return {
      title: 'Transport Summary Reports',
      actions: [
        {
          title: i18next.t('button.turn_to_PDF')
          //  action: this._createNewClaim.bind(this)
        }
      ]
    }
  }

  get _columns() {
    return this.config.columns
  }

  get _form() {
    return this.shadowRoot.querySelector('form')
  }

  get _dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async pageInitialized() {
    this._orders = { ...(await this.fetchOrderList()) }
    this._searchFields = [
      {
        label: i18next.t('field.driver_name'),
        name: 'driver_name',
        props: {
          searchOper: 'like'
        }
      },
      {
        type: 'select',
        name: 'bizplaces',
        record: {
          align: 'center',
          editable: true,
          options: {
            queryName: 'bizplaces'
            // basicArgs: {
            //   filters: [
            //     {
            //       name: 'name',
            //       value: 'o',
            //       operator: 'like',
            //       dataType: 'string'
            //     }
            //   ]
            // }
          }
        },
        width: 200
      },
      {
        type: 'select',
        name: 'orders',
        record: {
          align: 'center',
          editable: true,
          options: {
            queryName: 'orders'
            // basicArgs: {
            //   filters: [
            //     {
            //       name: 'name',
            //       value: 'o',
            //       operator: 'like',
            //       dataType: 'string'
            //     }
            //   ]
            // }
          }
        },
        width: 200
      },

      {
        label: i18next.t('field.start_date'),
        name: 'startDate',
        type: 'datetime-local',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.end_date'),
        name: 'endDate',
        type: 'datetime-local',
        props: { searchOper: 'like' }
      }
    ]
    this._claimDetailGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'select',
          name: 'name',
          header: i18next.t('field.claimType'),
          record: {
            editable: true,
            align: 'center',
            options: ['', ...Object.keys(TRIP_CLAIM).map(key => TRIP_CLAIM[key].value)]
          },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'center' },
          width: 400
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.receipt_reference_no'),
          record: { editable: true, align: 'center' },
          width: 500
        },
        {
          type: 'float',
          name: 'amount',
          header: i18next.t('field.amount'),
          record: { editable: true, align: 'center' },
          width: 150
        }
      ]
    }

    await this.updateComplete
    this._dataGrist.fetch()
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          id="claim-details-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this._claimDetailGristConfig}
          .data="${this._claimDetailsData}"
        ></data-grist>
      </div>

      <form class="multi-column-form">
        <fieldset>
          <!-- <label>${i18next.t('label.balance')}</label>
          <input name="balance" /> -->

          <label>${i18next.t('label.total_amount')}</label>
          <input name="totalPrice" />
        </fieldset>
      </form>
    `
  }

  updated(changes) {
    if (changes.has('_selectedOrderNo') && this._selectedOrderNo !== '') {
      Array.from(this._form.querySelectorAll('input')).map(field => {
        field.value = ''
      })
      if (this.___selectedOrderNo && this.___selectedOrderNo.trim() != '') this.fetchOrderDetail()
    }
  }

  async fetchOrderList() {
    return await client.query({
      query: gql`
        query {
          claimOrderList {
            name
            description
          }
        }
      `
    })
  }

  async fetchOrderDetail() {
    var filters = [
      {
        ////order no = order name in order tables
        name: 'orderNo',
        value: this._selectedOrderNo
      }
    ]

    var result = await client.query({
      query: gql`
        query {
          claimDetails (${gqlBuilder.buildArgs({
            filters
          })}){
            deliveryOrder{
              deliveryDateTime
              from
              to
              loadType
              transportDriver{
                id
                name
              }
              transportVehicle{
                id
                name
              }
              bizplace{
                name
              }
            }   
            collectionOrder{
              collectionDateTime
              from
              to
              loadType
              transportDriver{
                id
                name
              }
              transportVehicle{
                id
                name
              }
              bizplace{
                name
              }
            }         
          }
        }
      `
    })
    this._fillOrderDetails(result.data.claimOrderDetail)
  }

  async _createNewClaim() {
    try {
      var result = this._getClaimData()
      this._validateData(result)
      const response = await client.query({
        query: gql`
          mutation {
            createClaim(${gqlBuilder.buildArgs({
              claim: result
            })}) {
              id
              name
            }
          }
        `
      })
      if (!response.errors) {
        this._resetAll()
        this._showToast({ message: i18next.t('new_claim_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _fillOrderDetails(objData) {
    var obj = flattenObject(objData.deliveryOrder || objData.collectionOrder)
    Object.keys(obj).map(key => {
      Array.from(this._form.querySelectorAll('input')).forEach(field => {
        if (
          field.dataset.name === 'orderDate' &&
          field.type === 'datetime-local' &&
          (key === 'deliveryDateTime' || key === 'collectionDateTime')
        ) {
          const datetime = Number(obj[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.dataset.name === key) {
          field.value = obj[key]
        }
      })
    })
  }

  async _resetAll() {
    this._form.reset()
    this._selectedOrderNo = ''
    this._claimDetailsData = {}
    this._dataGrist.fetch()
    this._orders = { ...(await this.fetchOrderList()) }
  }

  _validateData(data) {
    let error = ''

    if (data.name === '') error = error + 'Please choose the order for claim.'
    if (data.claimDetails.length === 0) error = error + 'Please add at least one (1) claim to proceed.'

    if (error.trim() !== '') throw new Error(error)
  }

  _getClaimData() {
    let claim = {}
    Array.from(this._form.querySelectorAll('select')).forEach(field => {
      claim['description'] = field.options[field.selectedIndex].text
      claim['name'] = field.value
    })

    let claimDetails = {}
    claimDetails = this._dataGrist.dirtyRecords.map(claimDetail => {
      let patchField = {}
      const dirtyFields = claimDetail.__dirtyfields__
      for (let key in dirtyFields) {
        patchField[key] = dirtyFields[key].after
      }

      return { ...patchField }
    })

    return { ...claim, claimDetails }
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

window.customElements.define('transport-summary-report', TransportSummaryReport)
