import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { WORKSHEET_STATUS, WORKSHEET_TYPE } from './constatns/worksheet'

class WorksheetUnloading extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _worksheetNo: String,
      productGristConfig: Object,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object
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
      title: i18next.t('title.worksheet_unloading'),
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
          <legend>${i18next.t('title.unloading')}: ${this._worksheetNo}</legend>
          <label>${i18next.t('label.type')}</label>
          <select name="type" disabled>
            ${Object.keys(WORKSHEET_TYPE).map(
              key => html`
                <option value="${WORKSHEET_TYPE[key].value}">${i18next.t(`label.${WORKSHEET_TYPE[key].name}`)}</option>
              `
            )}
          </select>

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

          <label>${i18next.t('label.warehouse')}</label>
          <input name="warehouse" readonly />

          <label>${i18next.t('label.buffer_location')}</label>
          <input name="bufferLocation" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

        <data-grist
          id="product-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.productGristConfig}
          .data="${this.productData}"
        ></data-grist>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
        ></data-grist>
      </div>
    `
  }

  updated(changedProps) {
    if (changedProps.has('_worksheetNo')) {
      this.fetchWorksheet()
    }
  }

  firstUpdated() {
    this.productGristConfig = {
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          width: 150,
          record: { editable: false }
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          width: 300
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true },
          width: 300
        }
      ]
    }

    this.vasGristConfig = {
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          width: 150,
          record: { editable: false }
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          width: 300
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true },
          width: 300
        }
      ]
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
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
            type
            status
            startedAt
            endedAt
            worksheetDetails {
              id
              name
              type
              toLocation {
                warehouse {
                  name
                  description
                }
                name
                description
              }
              targetProduct {
                name
                description
                batchId
                product {
                  name
                  description
                }
              }
              targetVas {
                name
                description
                batchId
                vas {
                  name
                  description
                }
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      const worksheet = {
        ...response.data.worksheet,
        warehouse: `${response.data.worksheet.worksheetDetails[0].toLocation.warehouse.name} ${
          response.data.worksheet.worksheetDetails[0].toLocation.warehouse.description
            ? `(${response.data.worksheet.worksheetDetails[0].toLocation.warehouse.description})`
            : ''
        }`,
        bufferLocation: `${response.data.worksheet.worksheetDetails[0].toLocation.name} ${
          response.data.worksheet.worksheetDetails[0].toLocation.description
            ? `(${response.data.worksheet.worksheetDetails[0].toLocation.description})`
            : ''
        }`
      }

      this.productData = {
        ...this.productData,
        records: response.data.worksheet.worksheetDetails
          .filter(detail => detail.targetProduct)
          .map(detail => {
            return {
              ...detail,
              batchId: detail.targetProduct.batchId,
              product: detail.targetProduct.product
            }
          })
      }

      this.vasData = {
        ...this.vasData,
        records: response.data.worksheet.worksheetDetails
          .filter(detail => detail.targetVas)
          .map(detail => {
            return {
              ...detail,
              batchId: detail.targetVas.batchId,
              vas: detail.targetVas.vas
            }
          })
      }
      this._fillupForm(worksheet)
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
            activateUnloading(${gqlBuilder.buildArgs({
              name: this._worksheetNo,
              productWorksheetDetails: this._getProductWorksheetDetails(),
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

  _getProductWorksheetDetails() {
    return (this.productGrist.dirtyRecords || []).map(targetProduct => {
      return {
        name: targetProduct.name,
        remark: targetProduct.remark
      }
    })
  }

  _getVasWorksheetDetails() {
    return (this.vasGrist.dirtyRecords || []).map(targetVas => {
      return {
        name: targetVas.name,
        remark: targetVas.remark
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

window.customElements.define('worksheet-unloading', WorksheetUnloading)
