import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import {
  client,
  gqlBuilder,
  isMobileDevice,
  PageView,
  ScrollbarStyles,
  store,
  flattenObject
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import Swal from 'sweetalert2'

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
        initFocus="description"
        @submit=${e => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this._grist_config}
          .fetchHandler=${this.fetchHandler.bind(this)}
        ></data-grist>
      </div>
    `
  }

  static get properties() {
    return {
      _companyId: String,
      _searchFields: Array,
      _grist_config: Object,
      data: Object,
      importHandler: Object
    }
  }

  get context() {
    return {
      title: 'Claim Chit List'
    }
  }

  pageInitialized() {
    this._searchFields = [
      {
        label: i18next.t('label.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.name') }
      },
      {
        label: 'Order Name',
        name: 'deliveryOrder.name',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: 'From Date',
        name: 'deliveryOrder.From',
        type: 'date',
        props: {}
      }
    ]

    this._grist_config = {
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'deliveryOrder|transportDriver|name',
          header: 'Driver Name',
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 250
        },
        {
          type: 'string',
          name: 'deliveryOrder|transportVehicle|name',
          header: 'Vehicle Reg no',
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'deliveryOrder|from',
          header: 'From',
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'deliveryOrder|to',
          header: 'To',
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'deliveryOrder|loadType',
          header: 'Load Type',
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'datetime',
          name: 'createdAt',
          header: i18next.t('field.created_at'),
          record: { editable: false, align: 'left' },
          sortable: true,
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

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      let inputs = { transportDriver_name: 'ali' }
      let args = gqlBuilder.buildArgs({
        filters: [],
        pagination: { page, limit },
        sortings: sorters,
        //extras: { ...inputs }
        extras: [...this._conditionParser()]
      })
      const response = await client.query({
        query: gql`
          query {
            claims(${args}) {
              items {
                id
                name
                description
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
        let data = []
        response.data.claims.items.map(key => {
          data.push(flattenObject(key))
        })

        return {
          total: response.data.claims.total || 0,
          records: data
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

  // get _columns() {
  //   return this._grist_config.columns
  // }

  stateChanged(state) {
    if (JSON.parse(this.active)) {
      this._companyId = state && state.route && state.route.resourceId
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
