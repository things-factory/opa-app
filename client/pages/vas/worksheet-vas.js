import '@things-factory/barcode-ui'
import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { CustomAlert } from '../../utils/custom-alert'
import '../components/vas-relabel'
import { WORKSHEET_STATUS } from '../inbound/constants/worksheet'
import { ORDER_TYPES } from '../order/constants/order'

class WorksheetVas extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _statusOptions: Array,
      _orderType: String,
      _worksheetNo: String,
      _worksheetStatus: String,
      _voNo: String,
      _ganNo: String,
      _roNo: String,
      _template: Object,
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
          overflow-x: auto;
        }
        barcode-tag {
          width: 100px;
          height: 100px;
          margin: 10px;
        }
        .container {
          display: flex;
          flex: 1;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .guide-container {
          display: flex;
          max-width: 30vw;
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
      title: i18next.t('title.worksheet_vas'),
      actions: this._actions,
      printable: {
        accept: ['preview'],
        content: this
      }
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.vas')}</legend>
          <label ?hidden="${this._orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}"
            >${i18next.t('label.arrival_notice')}</label
          >
          <input ?hidden="${this._orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}" name="arrivalNotice" readonly />

          <label ?hidden="${this._orderType !== ORDER_TYPES.RELEASE_OF_GOODS.value}"
            >${i18next.t('label.release_order')}</label
          >
          <input ?hidden="${this._orderType !== ORDER_TYPES.RELEASE_OF_GOODS.value}" name="releaseGood" readonly />

          <label ?hidden="${this._orderType !== ORDER_TYPES.VAS_ORDER.value}">${i18next.t('label.vas_order')}</label>
          <input ?hidden="${this._orderType !== ORDER_TYPES.VAS_ORDER.value}" name="vasOrder" readonly />

          <label>${i18next.t('label.customer')}</label>
          <input name="bizplace" readonly />

          <label>${i18next.t('label.status')}</label>
          <select name="status" disabled>
            ${this._statusOptions.map(
              status => html`
                <option value="${status.name}" ?selected="${this._worksheetStatus === status.name}"
                  >${i18next.t(`label.${status.description}`)}</option
                >
              `
            )}
          </select>

          <label>${i18next.t(`label.order_qr_code`)}</label>
          <span center custom-input ?hidden="${this._orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}">
            <barcode-tag bcid="qrcode" .value=${this._ganNo}></barcode-tag>
          </span>
          <span center custom-input ?hidden="${this._orderType !== ORDER_TYPES.RELEASE_OF_GOODS.value}">
            <barcode-tag bcid="qrcode" .value=${this._roNo}></barcode-tag>
          </span>
          <span center custom-input ?hidden="${this._orderType !== ORDER_TYPES.VAS_ORDER.value}">
            <barcode-tag bcid="qrcode" .value=${this._voNo}></barcode-tag>
          </span>
        </fieldset>
      </form>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

          <data-grist
            id="grist"
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
    this._statusOptions = []
    this._ganNo = ''
    this._roNo = ''
    this._voNo = ''
  }

  async pageUpdated(changes) {
    if (this.active && changes.resourceId) {
      this._worksheetNo = changes.resourceId
      await this.fetchWorksheet()
      this._updateContext()
      this._updateGristConfig()
    }
  }

  async pageInitialized() {
    this.preConfig = {
      rows: {
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
      list: { fields: ['batchId', 'vas', 'remark'] },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          width: 250
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          width: 250
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.comment'),
          width: 200
        }
      ]
    }

    this._statusOptions = await getCodeByName('WORKSHEET_STATUS')
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async fetchWorksheet() {
    if (!this._worksheetNo) return
    const response = await client.query({
      query: gql`
        query {
          worksheet(${gqlBuilder.buildArgs({
            name: this._worksheetNo
          })}) {
            id
            name
            status
            arrivalNotice {
              id
              name
              description
            }
            vasOrder {
              id
              name
              description
            }
            releaseGood {
              id
              name
              description
            }
            bizplace {
              id
              name
              description
            }
            worksheetDetails {
              id
              name
              description
              targetVas {
                operationGuide
                inventory {
                  name
                  description
                }
                vas {
                  id
                  name
                  description
                  operationGuideType
                  operationGuide
                }
                batchId
                name
                description
                remark
              }
              status
            }
          }
        }
      `
    })

    if (!response.errors) {
      const worksheet = response.data.worksheet
      const worksheetDetails = worksheet.worksheetDetails

      this._worksheetStatus = worksheet.status
      this._ganNo = (worksheet.arrivalNotice && worksheet.arrivalNotice.name) || ''
      this._voNo = (worksheet.vasOrder && worksheet.vasOrder.name) || ''
      this._roNo = (worksheet.releaseGood && worksheet.releaseGood.name) || ''

      this._orderType = worksheet.arrivalNotice
        ? ORDER_TYPES.ARRIVAL_NOTICE.value
        : worksheet.releaseGood
        ? ORDER_TYPES.RELEASE_OF_GOODS.value
        : worksheet.vasOrder
        ? ORDER_TYPES.VAS_ORDER.value
        : null

      if (!this._orderType) return

      this._fillupForm(worksheet)
      this.data = {
        records: worksheetDetails.map(worksheetDetail => {
          return {
            ...worksheetDetail.targetVas,
            name: worksheetDetail.name,
            status: worksheetDetail.status,
            description: worksheetDetail.description
          }
        })
      }
    }
  }

  _updateContext() {
    this._actions = []

    if (this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value) {
      this._actions = [{ title: i18next.t('button.activate'), action: this._activateWorksheet.bind(this) }]
    }

    this._actions = [...this._actions, { title: i18next.t('button.back'), action: () => history.back() }]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _updateGristConfig() {
    const statusColumnConfig = {
      type: 'string',
      name: 'status',
      header: i18next.t('field.status'),
      record: { align: 'center' },
      width: 100
    }

    this.preConfig.columns.map(column => {
      if (column.name === 'description') {
        column.record = { ...column.record, editable: this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value }
      }
    })

    if (this._worksheetStatus !== WORKSHEET_STATUS.DEACTIVATED.value) {
      this.preConfig.columns = [...this.preConfig.columns, statusColumnConfig]
    }

    this.config = this.preConfig
  }

  _fillupForm(data) {
    for (let key in data) {
      Array.from(this.form.querySelectorAll('input, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          if (data[key] instanceof Object) {
            const objectData = data[key]
            field.value = `${objectData.name} ${objectData.description ? `(${objectData.description})` : ''}`
          } else {
            field.value = data[key]
          }
        }
      })
    }
  }

  async _activateWorksheet() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.activate_vas_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      if (this.data.records.some(record => record.vas.operationGuideType)) {
        const result = await CustomAlert({
          type: 'warning',
          title: i18next.t('title.is_operation_finished'),
          text: i18next.t('text.there_is_additional_operation'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (!result.value) {
          return
        }
      }

      const response = await client.query({
        query: gql`
          mutation {
            activateVas(${gqlBuilder.buildArgs({
              worksheetNo: this._worksheetNo,
              vasWorksheetDetails: this._getVasWorksheetDetails()
            })}) {
              name
            }
          }
        `
      })
      if (!response.errors) {
        this._showToast({ message: i18next.t('text.worksheet_activated') })
        this._worksheetNo = ''
        await this.fetchWorksheet()
        navigate(`vas_worksheets`)
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getVasWorksheetDetails() {
    return this.grist.dirtyData.records.map(worksheetDetail => {
      return {
        name: worksheetDetail.name,
        description: worksheetDetail.description
      }
    })
  }

  stateChanged(state) {
    if (this.active) {
      this._worksheetNo = state && state.route && state.route.resourceId
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

window.customElements.define('worksheet-vas', WorksheetVas)
