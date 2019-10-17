import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'
import '../../components/vas-relabel'
import { ORDER_STATUS } from '../constants/order'

class VasOrderDetail extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _vasNo: String,
      _template: Object,
      config: Object,
      data: Object,
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

  constructor() {
    super()
    this.data = { records: [] }
  }

  get context() {
    return {
      title: i18next.t('title.vas_order_detail'),
      actions: this._actions
    }
  }

  render() {
    return html`
      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas_no')}: ${this._vasNo}</h2>

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
    `
  }

  async pageUpdated(changes) {
    if (this.active) {
      this._vasNo = changes.resourceId || this._vasNo || ''
      await this.fetchVasOrder()
      this._updateContext()
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
          name: 'vas',
          header: i18next.t('field.vas'),
          record: {
            align: 'center',
            options: {
              queryName: 'vass',
              select: [{ name: 'operationGuide' }, { name: 'operationGuideType' }]
            }
          },
          width: 250
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.inventory_list'),
          record: { align: 'center' },
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
          width: 150
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
      this.fetchVasOrder()
    }
  }

  async fetchVasOrder() {
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
      this._status = vasOrder.status
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

  _updateContext() {
    this._actions = []
    if (this._status === ORDER_STATUS.PENDING.value) {
      this._actions = [
        {
          title: i18next.t('button.delete'),
          action: this._deleteVasOrder.bind(this)
        },
        {
          title: i18next.t('button.confirm'),
          action: this._confirmVasOrder.bind(this)
        }
      ]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  async _deleteVasOrder() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.you_wont_be_able_to_revert_this'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      await this._executeRevertTransactions()

      if (result.value) {
        const response = await client.query({
          query: gql`
            mutation {
              deleteVasOrder(${gqlBuilder.buildArgs({
                name: this._vasNo
              })}) 
            }
          `
        })

        if (!response.errors) {
          this._showToast({ message: i18next.t('text.vas_order_has_been_deleted') })
          navigate(`vas_orders`)
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _executeRevertTransactions() {
    try {
      for (let i = 0; i < this.data.records.length; i++) {
        const record = this.data.records[i]
        if (record.vas.operationGuideType && record.vas.operationGuideType === 'template') {
          const template = document.createElement(record.vas.operationGuide)

          for (let j = 0; j < template.revertTransactions.length; j++) {
            const trx = template.revertTransactions[j]
            await trx(record)
          }
        }
      }
    } catch (e) {
      throw e
    }
  }

  async _confirmVasOrder() {
    const result = await CustomAlert({
      title: i18next.t('title.are_you_sure'),
      text: i18next.t('text.confirm_vas_order'),
      confirmButton: { text: i18next.t('button.confirm') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (!result.value) {
      return
    }

    try {
      const response = await client.query({
        query: gql`
            mutation {
              confirmVasOrder(${gqlBuilder.buildArgs({
                name: this._vasNo
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.vas_order_confirmed') })
        navigate('vas_orders')
      }
    } catch (e) {
      this._showToast(e)
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
