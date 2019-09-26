import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_TYPES } from '../order/constants/order'
import Swal from 'sweetalert2'

class ExecuteVas extends localize(i18next)(PageView) {
  static get properties() {
    return {
      orderNo: String,
      orderType: String,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }

        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        data-grist {
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
      title: i18next.t('title.vas'),
      actions: [
        {
          title: i18next.t('button.complete'),
          action: this._completeHandler.bind(this)
        }
      ]
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.order_no')}</label>
          <input
            name="orderNo"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this._getVass()
              }
            }}"
          />

          <label>${i18next.t('label.order_type')}</label>
          <select
            name="orderType"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this._getVass()
              }
            }}"
          >
            <option></option>
            ${Object.keys(ORDER_TYPES).map(
              key => html`
                <option value="${ORDER_TYPES[key].value}">${i18next.t(`label.${ORDER_TYPES[key].name}`)}</option>
              `
            )}
          </select>
        </fieldset>

        <fieldset>
          <legend ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}">
            ${`${i18next.t('title.arrival_notice')}: ${this.orderNo}`}
          </legend>

          <label ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}">${i18next.t('label.bizplace')}</label>
          <input ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}" name="bizplaceName" readonly />

          <label ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}"
            >${i18next.t('label.container_no')}</label
          >
          <input ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}" name="containerNo" readonly />

          <label ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}"
            >${i18next.t('label.buffer_location')}</label
          >
          <input ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}" name="bufferLocation" readonly />

          <label ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}"
            >${i18next.t('label.startedAt')}</label
          >
          <input
            ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}"
            name="startedAt"
            type="datetime-local"
            readonly
          />
        </fieldset>

        <fieldset>
          <div ?hidden="${this._orderType !== ORDER_TYPES.SHIPPING.value}">
            <legend>${`${i18next.t('title.shipping_order')}: ${this.shipping_order}`}</legend>
          </div>
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          @record-change="${e => {
            e.detail.after.validity = e.detail.after.actualQty === e.detail.after.packQty
          }}"
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this.data = { records: [] }
  }

  pageInitialized() {
    this.config = {
      pagination: {
        infinite: true
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'validity',
          header: i18next.t('field.validity'),
          records: { editable: false },
          width: 60
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { align: 'center' },
          width: 180
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          width: 200
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { align: 'center' },
          width: 300
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { align: 'center' },
          width: 300
        },

        {
          type: 'string',
          name: 'issue',
          header: i18next.t('field.issue'),
          record: { editable: true },
          width: 300
        },
        {
          type: 'boolean',
          name: 'complete',
          header: i18next.t('field.complete'),
          record: { editable: true, align: 'center' },
          width: 60
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this._focusOnBarcodField()
    }
  }

  _focusOnBarcodField() {
    this.shadowRoot.querySelector('input[name=orderNo]').focus()
  }

  async _getVass() {
    const orderNo = this.shadowRoot.querySelector('input[name=orderNo]').value
    const orderType = this.shadowRoot.querySelector('select[name=orderType]').value
    if (!orderNo) {
      Swal.fire({ type: 'warn', title: i18next.t('text.order_type_is_empty'), timer: 1500 })
      return
    }

    if (!orderType) {
      Swal.fire({ type: 'warn', title: i18next.t('text.order_type_is_empty'), timer: 1500 })
      return
    }

    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          vasWorksheet(${gqlBuilder.buildArgs({
            orderNo,
            orderType
          })}) {
            worksheetInfo {
              bizplaceName
              containerNo
              bufferLocation
              startedAt
            }
            worksheetDetailInfos {
              batchId
              name
              targetName
              vas {
                id
                name
                description
              }
              description
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.orderNo = orderNo
      this.orderType = orderType
      this._fillUpForm(response.data.vasWorksheet.worksheetInfo)

      this.data = {
        ...this.data,
        records: response.data.vasWorksheet.worksheetDetailInfos
      }
    }
  }

  _clearView() {
    this.data = { records: [] }
    this.form.reset()
  }

  _fillUpForm(data) {
    for (let key in data) {
      Array.from(this.form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }

  _completeHandler() {
    try {
      this.validate()
      this._completeVas()
    } catch (e) {
      this._showToast({ message: e.message })
    }
  }

  validate() {
    const tasks = this.grist.dirtyData.records
    // 1. every task has to be completed. if it's not completed there should be issue
    if (!tasks.every(task => (task.complete && !task.issue) || (!task.complete && task.issue))) {
      throw new Error(i18next.t('text.theres_is_uncompleted_task'))
    }
  }

  async _completeVas() {
    const response = await client.query({
      query: gql`
        mutation {
          completeVas(${gqlBuilder.buildArgs({
            orderNo: this.orderNo,
            orderType: this.orderType,
            vasWorksheetDetails: this._getVasWorksheetDetails()
          })}) {
            name
          }
        }
      `
    })
    if (!response.errors) {
      this._clearView()
    }
  }

  _getVasWorksheetDetails() {
    return this.grist.dirtyData.records.map(task => {
      return {
        name: task.name,
        issue: task.issue || null,
        targetVas: {
          name: task.targetName
        }
      }
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

window.customElements.define('execute-vas', ExecuteVas)
