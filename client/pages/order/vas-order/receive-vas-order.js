import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../../popup-note'

class ReceiveVasOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _vasNo: String,
      vasGristConfig: Object,
      vasData: Object,
      _status: String
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
      title: i18next.t('title.receive_vas_order'),
      actions: [
        {
          title: i18next.t('button.reject'),
          action: this._rejectVasOrder.bind(this)
        },
        {
          title: i18next.t('button.receive'),
          action: this._receiveVasOrder.bind(this)
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.fetchVasOrder()
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
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
    this.vasData = {}
  }

  pageInitialized() {
    this.vasGristConfig = {
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
              this.vasData = {
                ...this.vasData,
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
          type: 'object',
          name: 'product',
          header: i18next.t('field.inventory_list'),
          record: { editable: true, align: 'center' },
          width: 250
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('_vasNo')) {
      this.fetchVasOrder()
    }
  }

  async fetchVasOrder() {
    const response = await client.query({
      query: gql`
        query {
          vasOrder(${gqlBuilder.buildArgs({
            name: this._vasNo
          })}) {
            id
            name
            status
            inventoryDetail {
              vas {
                name
              }
              inventoryName
              batchId
              product {
                name
                description
              }
              location {
                name
              }
            }
            orderVass {
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._status = response.data.vasOrder.status
      this._actionsHandler()

      const newData = response.data.vasOrder

      this.vasData = {
        ...this.vasData,
        records: [...newData, ...newData.inventoryDetail, ...newData.orderVass]
      }
    }
  }

  async _receiveVasOrder() {
    const response = await client.query({
      query: gql`
        mutation {
          generateVasOrderWorksheet(${gqlBuilder.buildArgs({
            vasNo: this._vasNo
          })}) {
              unloadingWorksheet {
                name
              }
            }
          }
        `
    })

    if (!response.errors) {
      navigate('worksheets')
      history.back()
      this._showToast({ message: i18next.t('text.vas_order_has_been_confirmed') })
    }
  }

  async _rejectVasOrder() {
    openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.remark')}"
          @submit="${async e => {
            try {
              if (!e.detail.remark) throw new Error(i18next.t('text.remark_is_empty'))
              const response = await client.query({
                query: gql`
                mutation {
                  rejectVasOrder(${gqlBuilder.buildArgs({
                    name: this._vasNo,
                    patch: { remark: e.detail.value }
                  })}) {
                    name
                  }
                }
              `
              })

              if (!response.errors) {
                navigate('vas_order_requests')
                this._showToast({ message: i18next.t('text.vas_order_rejected') })
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
        title: i18next.t('title.reject_vas_order')
      }
    )
  }

  _getTextAreaByName(name) {
    return this.shadowRoot.querySelector(`textarea[name=${name}]`)
  }

  stateChanged(state) {
    if (this.active) {
      this._vasNo = state && state.route && state.route.resourceId
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

window.customElements.define('receive-vas-order', ReceiveVasOrder)
