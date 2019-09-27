import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { WORKSHEET_STATUS } from './constants/worksheet'
import { ORDER_TYPES } from '../order/constants/order'

class WorksheetVas extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _orderType: String,
      _worksheetNo: String,
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
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        },
        {
          title: i18next.t('button.activate'),
          action: this._activateWorksheet.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.vas')}: ${this._worksheetNo}</legend>
          <label ?hidden="${this._orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}"
            >${i18next.t('label.arrival_notice')}</label
          >
          <input ?hidden="${this._orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}" name="arrivalNotice" readonly />

          <label ?hidden="${this._orderType !== ORDER_TYPES.SHIPPING.value}"
            >${i18next.t('label.shipping_order')}</label
          >
          <input ?hidden="${this._orderType !== ORDER_TYPES.SHIPPING.value}" name="shipping_order" readonly />

          <label>${i18next.t('label.bizplace')}</label>
          <input name="bizplace" readonly />

          <label>${i18next.t('label.status')}</label>
          <select name="status" disabled>
            ${Object.keys(WORKSHEET_STATUS).map(
              key => html`
                <option value="${WORKSHEET_STATUS[key].value}"
                  >${i18next.t(`label.${WORKSHEET_STATUS[key].name}`)}</option
                >
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

  updated(changedProps) {
    if (changedProps.has('_worksheetNo')) {
      this.fetchWorksheet()
    }
  }

  pageInitialized() {
    this.config = {
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
          record: { editable: true },
          header: i18next.t('field.description'),
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
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._orderType = response.data.worksheet.arrivalNotice
        ? ORDER_TYPES.ARRIVAL_NOTICE.value
        : response.data.worksheet.shippingOrder
        ? ORDER_TYPES.SHIPPING.value
        : null

      if (!this._orderType) return

      const location = response.data.worksheet.worksheetDetails[0].toLocation
      const worksheet = {
        ...response.data.worksheet,
        arrivalNotice: response.data.worksheet.arrivalNotice.name,
        bizplace: response.data.worksheet.bizplace.name
      }
      this._fillupForm(worksheet)
      this.data = {
        ...this.data,
        records: response.data.worksheet.worksheetDetails.map(worksheetDetail => {
          return { ...worksheetDetail.targetVas, name: worksheetDetail.name }
        })
      }
    }
  }

  _fillupForm(arrivalNotice) {
    for (let key in arrivalNotice) {
      Array.from(this.form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = arrivalNotice[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(arrivalNotice[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = arrivalNotice[key]
        }
      })
    }
  }

  async _activateWorksheet() {
    try {
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
        alert('Do you want to print out the worksheet?')
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
