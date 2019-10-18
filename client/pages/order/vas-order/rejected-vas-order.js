import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../../components/popup-note'
import '../../components/vas-relabel'

class RejectedVasOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _vasNo: String,
      _rejectReason: String,
      config: Object,
      data: Object,
      _template: Object
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
        popup-note {
          flex: 1;
        }
        .container {
          display: flex;
          flex: 4;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex: 1;
          flex-direction: column;
          overflow-y: auto;
        }
        .guide-container {
          max-width: 30vw;
          display: flex;
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
      title: i18next.t('title.rejected_vas_order'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ]
    }
  }

  get rejectReasonField() {
    return this.shadowRoot.querySelector('textarea[name=rejectReason]')
  }

  render() {
    return html`
      <popup-note
        .title="${i18next.t('title.reject_reason')}"
        .value="${this._rejectReason}"
        .readonly="${true}"
      ></popup-note>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas_order')}</h2>

          <data-grist
            id="vas-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .data="${this.data}"
          ></data-grist>
        </div>

        <div class="guide-container">
          ${this._template}
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.data = { records: [] }
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async pageUpdated(changes) {
    if (this.active) {
      this._vasNo = changes.resourceId || this._vasNo || ''
      this._fetchVasOrder()
    }
  }
  pageInitialized() {
    this.config = {
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true },
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.vas && record.vas.operationGuideType === 'template') {
              this._template = document.createElement(record.vas.operationGuide)
              this._template.record = { ...record, operationGuide: JSON.parse(record.operationGuide) }
            } else {
              this._template = null
            }
          }
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.inventory_list'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 230
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          width: 350
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('_vasNo')) {
      this._fetchVasOrder()
    }
  }
  async _fetchVasOrder() {
    const response = await client.query({
      query: gql`
        query {
          vasOrder(${gqlBuilder.buildArgs({
            name: this._vasNo
          })}) {
            id
            name
            status
            remark
            orderVass {
              vas {
                name
                description
                operationGuide
                operationGuideType
              }
              inventory {
                batchId
                name
                product {
                  name
                }
                location {
                  name
                  description
                }
              }
              operationGuide
              status
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      const vasOrder = response.data.vasOrder
      this._rejectReason = vasOrder.remark
      this.data = {
        records: vasOrder.orderVass.map(orderVas => {
          return {
            ...orderVas,
            ...orderVas.inventory
          }
        })
      }
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

window.customElements.define('rejected-vas-order', RejectedVasOrder)
