import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { CustomAlert } from '../../utils/custom-alert'
import { ORDER_TYPES } from '../order/constants/order'
import { WORKSHEET_STATUS } from './constants/worksheet'

class WorksheetVas extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _statusOptions: Array,
      _orderType: String,
      _worksheetNo: String,
      _worksheetStatus: String,
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
      title: i18next.t('title.worksheet_vas'),
      actions: this._actions
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

          <label ?hidden="${this._orderType !== ORDER_TYPES.SHIPPING.value}"
            >${i18next.t('label.shipping_order')}</label
          >
          <input ?hidden="${this._orderType !== ORDER_TYPES.SHIPPING.value}" name="shipping_order" readonly />

          <label>${i18next.t('label.customer')}</label>
          <input name="bizplace" readonly />

          <label>${i18next.t('label.status')}</label>
          <select name="status" disabled>
            ${this._statusOptions.map(
              status => html`
                <option value="${status.name}">${i18next.t(`label.${status.description}`)}</option>
              `
            )}
          </select>
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data="${this.data}"
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this._statusOptions = []
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
    this._statusOptions = await getCodeByName('WORKSHEET_STATUS')
    this.preConfig = {
      rows: { appendable: false },
      list: { fields: ['batchId', 'vas', 'remark'] },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.product'),
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
            shippingOrder {
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
                vas {
                  id
                  name
                  description
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
      this._orderType = worksheet.arrivalNotice
        ? ORDER_TYPES.ARRIVAL_NOTICE.value
        : worksheet.shippingOrder
        ? ORDER_TYPES.SHIPPING.value
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
        const result = await CustomAlert({
          title: i18next.t('title.vas_worksheet'),
          text: i18next.t('text.do_you_want_to_print'),
          confirmButton: { text: i18next.t('button.confirm') },
          cancelButton: { text: i18next.t('button.cancel') }
        })

        if (result.value) {
          console.warn('TODO: PRINT OUT WORKSHEET')
          console.warn('TODO: PRINT OUT WORKSHEET')
          console.warn('TODO: PRINT OUT WORKSHEET')
        }

        this._worksheetNo = ''
        navigate(`worksheets`)
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getVasWorksheetDetails() {
    return (this.grist.dirtyRecords || []).map(worksheetDetail => {
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
