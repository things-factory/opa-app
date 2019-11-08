import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import {
  client,
  gqlBuilder,
  isMobileDevice,
  PageView,
  ScrollbarStyles,
  store,
  navigate,
  flattenObject
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

class ClaimChitList extends connect(store)(localize(i18next)(PageView)) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        search-form {
          overflow: visible;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="name"
        @submit=${e => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this._gristConfig}
          .fetchHandler=${this.fetchHandler.bind(this)}
        ></data-grist>
      </div>
    `
  }

  static get properties() {
    return {
      _companyId: String,
      _searchFields: Array,
      _gristConfig: Object,
      _email: String,
      data: Object,
      importHandler: Object
    }
  }

  get context() {
    return {
      title: i18next.t('claim_chit_list')
    }
  }

  async pageInitialized() {
    const _driverList = await this.fetchDriverList()
    const _vehicleList = await this.fetchVehicleList()
    this._searchFields = [
      {
        label: i18next.t('label.claim'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like', placeholder: i18next.t('label.claim') }
      },
      {
        label: i18next.t('field.driver'),
        name: 'transportDriver',
        type: 'select',
        options: [
          { value: '', name: 'ALL' },
          ..._driverList.map(driverList => {
            return {
              name: driverList.name,
              value: driverList.id
            }
          })
        ],
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('label.truck_no'),
        name: 'transportVehicle',
        type: 'select',
        options: [
          { value: '', name: 'ALL' },
          ..._vehicleList.map(vehicleList => {
            return {
              name: vehicleList.name,
              value: vehicleList.id
            }
          })
        ],
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'select',
        options: [
          { value: '', name: 'ALL' },
          { value: 'PENDING', name: 'PENDING' },
          { value: 'APPROVE', name: 'APPROVE' },
          { value: 'REJECT', name: 'REJECT' }
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this._gristConfig = {
      rows: {
        selectable: {
          multiple: true
        },
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.id) navigate(`claim_chit_detail/${record.id}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.claim'),
          record: { editable: false, align: 'center' },
          width: 200
        },
        {
          type: 'string',
          name: 'transportDriver|name',
          header: i18next.t('field.driver_name'),
          record: { editable: false, align: 'left' },
          width: 200
        },
        {
          type: 'string',
          name: 'transportVehicle|name',
          header: i18next.t('field.truck_no'),
          record: { editable: false, align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'bizplace|name',
          header: i18next.t('field.customer'),
          record: { editable: false, align: 'center' },
          width: 300
        },
        {
          type: 'string',
          name: 'from',
          header: i18next.t('field.from'),
          record: { editable: false, align: 'left' },
          width: 150
        },
        {
          type: 'string',
          name: 'to',
          header: i18next.t('field.to'),
          record: { editable: false, align: 'left' },
          width: 150
        },
        {
          type: 'string',
          name: 'billingMode',
          header: i18next.t('field.billing_mode'),
          record: { editable: false, align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'charges',
          header: i18next.t('field.charges'),
          record: { editable: false, align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'totalAmt',
          header: i18next.t('field.total'),
          record: { editable: false, align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { editable: false, align: 'center' },
          width: 200
        },
        {
          type: 'datetime',
          name: 'createdAt',
          header: i18next.t('field.created_at'),
          record: { editable: false, align: 'center' },
          width: 175
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }
  async fetchDriverList() {
    let result = await client.query({
      query: gql`
        query {
          transportDrivers (${gqlBuilder.buildArgs({ filters: [], pagination: { page: 1, limit: 9999 } })}){
            items{
              id
              name
            }
          }
        }`
    })
    return result.data.transportDrivers.items
  }

  async fetchVehicleList() {
    let result = await client.query({
      query: gql`
        query {
          transportVehicles (${gqlBuilder.buildArgs({ filters: [], pagination: { page: 1, limit: 9999 } })}){
            items{
              id
              name
            }
          }
        }`
    })
    return result.data.transportVehicles.items
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'createdAt', desc: true }] }) {
    try {
      let args = gqlBuilder.buildArgs({
        filters: [...this.searchForm.queryFilters],
        pagination: { page, limit },
        sortings: sorters
      })
      const response = await client.query({
        query: gql`
          query {
            claims(${args}) {
              items {
                id
                name
                description
                billingMode
                transportDriver{
                  id
                  name
                }
                transportVehicle{
                  id
                  name
                }
                claimDetails{
                  name
                  amount
                }
                from
                to
                bizplace{
                  name
                }
                charges
                status
                createdAt
                updatedAt
                updater {
                  id
                  name
                  description
                }
              }
              total
            }
          }
        `
      })

      if (!response.errors) {
        return {
          total: response.data.claims.total || 0,
          records:
            response.data.claims.items.map(item => {
              return flattenObject({
                ...item,
                charges: item.charges.toFixed(2),
                totalAmt: item.claimDetails
                  .map(claimDet => {
                    return parseFloat(claimDet.amount)
                  })
                  .reduce((a, b) => a + b, 0)
                  .toFixed(2)
              })
            }) || {}
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _conditionParser() {
    return this.searchForm
      .getFields()
      .filter(field => (field.type !== 'checkbox' && field.value && field.value !== '') || field.type === 'checkbox')
      .map(field => {
        return {
          name: field.name,
          value:
            field.type === 'text'
              ? field.value
              : field.type === 'checkbox'
              ? field.checked
              : field.type === 'number'
              ? parseFloat(field.value)
              : field.value,
          operator: field.getAttribute('searchOper')
        }
      })
  }

  stateChanged(state) {
    if (JSON.parse(this.active)) {
      this._companyId = state && state.route && state.route.resourceId
      this._email = state.auth && state.auth.user && state.auth.user.email
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

window.customElements.define('claim-chit-list', ClaimChitList)
