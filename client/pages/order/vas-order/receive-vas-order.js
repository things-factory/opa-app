import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'
import { openPopup } from '@things-factory/layout-base'
import '../../popup-note'

class ReceiveVasOrder extends localize(i18next)(PageView) {
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
        },
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ]
    }
  }

  pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._vasNo = changes.resourceId
      this._fetchVasOrder()
    }
  }

  render() {
    return html`
      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas_no')}: ${this._vasNo}</h2>

        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this.vasData = { records: [] }
  }

  pageInitialized() {
    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { align: 'center', options: { queryName: 'vass' } },
          width: 350
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.inventory_list'),
          record: { align: 'center' },
          width: 300
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
          record: { align: 'center' },
          width: 350
        }
      ]
    }
  }

  async _fetchVasOrder() {
    if (!this._vasNo) return
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
                id
                name
                description
              }
              batchId
              name
              product {
                id
                name
                description
              }
              location {
                id
                name
                description
              }
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      const vasOrder = response.data.vasOrder
      const orderVass = vasOrder.inventoryDetail

      this._status = vasOrder.status
      this.vasData = { records: orderVass }
    }
  }

  async _receiveVasOrder() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.receive_vas_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            generateVasOrderWorksheet(${gqlBuilder.buildArgs({
              vasNo: this._vasNo
            })}) {
              vasWorksheet {
                name
              }
            }
          }
        `
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.vas_order_has_been_confirmed') })
        navigate('vas_worksheets')
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _rejectVasOrder() {
    const popup = openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.remark')}"
          @submit="${async e => {
            try {
              if (!e.detail.value) throw new Error(i18next.t('text.remark_is_empty'))
              const result = await CustomAlert({
                title: i18next.t('title.are_you_sure'),
                text: i18next.t('text.reject_vas_order'),
                confirmButton: { text: i18next.t('button.confirm') },
                cancelButton: { text: i18next.t('button.cancel') }
              })

              if (!result.value) {
                return
              }

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
                navigate('vas_requests')
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

window.customElements.define('receive-vas-order', ReceiveVasOrder)
