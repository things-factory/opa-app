import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS, PACKING_TYPES, ORDER_TYPES } from '../constants/order'

class VasOrderDetail extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      /**
       * @description
       * flag for whether use transportation from warehouse or not.
       * true =>
       */
      _ganNo: String,
      _ownTransport: Boolean,
      productGristConfig: Object,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
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
      title: i18next.t('title.vas_order_detail'),
      actions: [
        {
          title: i18next.t('button.create'),
          action: this._generateVasOrder.bind(this)
        }
      ]
    }
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          .fetchHandler="${this.fetchHandler.bind(this)}"
          ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this.data = {}
    this.config = {}
  }

  pageInitialized() {
    this.config = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.data = {
                ...this.data,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
            }
          }
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { editable: true, align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { editable: true, align: 'center', options: ['', i18next.t('label.all')] },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'center' },
          width: 350
        }
      ]
    }
  }
  
  async fetchHandler({ page, limit, sorters = [] }) {
    let filters = []
    if(this._ganNo) {
      filters.push({
        name: 'name',
        operator: 'eq',
        value: this._ganNo
      })
    }

    const response = await client.query({
      query: gql`
        query {
          orderVass(${gqlBuilder.buildArgs({
            filters: filters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items{
              id
              name
              bizplace {
                id
              }
              vas {
                id
                name
                description
              }
              status
              description
              batchId
              remark
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
        total: response.data.orderVass.total || 0,
        records: response.data.orderVass.items || []
      }
    }
  }

  updated(changedProps) {
    if (changedProps.has('_ganNo') && this._ganNo) {
      this.fetchGAN()
      this._updateBatchList()
    } else if (changedProps.has('_ganNo') && !this._ganNo) {
      this._clearPage()
      this._updateBatchList()
    }

    this._contextHandler()
  }

  _actionsHandler() {
    let actions = []

    if (this._status === ORDER_STATUS.PENDING.value) {
      actions = [
        {
          title: i18next.t('button.edit'),
          action: async () => {
            try {
              await this._updateArrivalNotice({ status: ORDER_STATUS.EDITING.value })
              this._showToast({ message: i18next.t('text.gan_now_editable') })
            } catch (e) {
              this._showToast(e)
            }
          }
        },
        {
          title: i18next.t('button.confirm'),
          action: async () => {
            const result = await Swal.fire({
              title: i18next.t('text.confirm_vas_order'),
              text: i18next.t('text.you_wont_be_able_to_revert_this'),
              type: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#22a6a7',
              cancelButtonColor: '#cfcfcf',
              confirmButtonText: i18next.t('buffon.confirm')
            })

            if (result.value) this._confirmArrivalNotice()
          }
        }
      ]
    } else if (this._status === ORDER_STATUS.EDITING.value) {
      navigate(`create_vas_order/${this._ganNo}`)
    }

    actions = [...actions, { title: i18next.t('button.back'), action: () => navigate('arrival_notices') }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        ...this.context,
        actions
      }
    })
  }

  stateChanged(state) {
    if (this.active) {
      this._ganNo = state && state.route && state.route.resourceId
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

window.customElements.define('vas-order-detail', VasOrderDetail)
