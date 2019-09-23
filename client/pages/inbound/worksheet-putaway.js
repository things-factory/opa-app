import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { WORKSHEET_STATUS } from './constants/worksheet'
import { LOCATION_TYPE } from '../order/constants/location'

class WorksheetPutaway extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
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
      title: i18next.t('title.worksheet_putaway'),
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
          <label>${i18next.t('label.arrival_notice')}</label>
          <input name="arrivalNotice" readonly />

          <label>${i18next.t('label.bizplace')}</label>
          <input name="bizplace" readonly />

          <label>${i18next.t('label.buffer_location')}</label>
          <input name="bufferLocation" readonly />

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
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

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
          name: 'product',
          header: i18next.t('field.product'),
          width: 250
        },
        {
          type: 'string',
          name: 'description',
          record: { editable: true },
          header: i18next.t('field.description'),
          width: 200
        },
        {
          type: 'object',
          name: 'toLocation',
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'locations',
              basicArgs: [
                {
                  name: 'warehouse_id',
                  operator: 'eq',
                  value: this.warehouseId
                },
                {
                  name: 'type',
                  operator: 'noteq',
                  value: LOCATION_TYPE.BUFFER
                }
              ]
            }
          },
          header: i18next.t('field.to_location'),
          width: 300
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { align: 'right' },
          width: 60
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { align: 'right' },
          width: 60
        },
        {
          type: 'integer',
          name: 'actualQty',
          header: i18next.t('field.actual_qty'),
          record: { aligh: 'right' },
          width: 60
        },
        {
          type: 'integer',
          name: 'totalWeight',
          header: i18next.t('field.total_weight'),
          record: { align: 'right' },
          width: 80
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

  get toLocationField() {
    return this.shadowRoot.querySelector('input[name=toLocation]')
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
            bizplace {
              id
              name
              description
            }
            worksheetDetails {
              id
              name
              fromLocation {
                warehouse {
                  id
                  name
                  description
                }
                name
                description
              }
              targetProduct {
                product {
                  id
                  name
                  description
                }
                batchId
                name
                description
                packingType
                packQty
                totalWeight
                palletQty
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      const location = response.data.worksheet.worksheetDetails[0].fromLocation
      this.warehouseId = location.warehouse.id
      this.warehouseName = location.warehouse.name
      const worksheet = {
        ...response.data.worksheet,
        arrivalNotice: response.data.worksheet.arrivalNotice.name,
        bizplace: response.data.worksheet.bizplace.name,
        bufferLocation: location.name
      }
      this._fillupForm(worksheet)
      this.data = {
        ...this.data,
        records: response.data.worksheet.worksheetDetails.map(worksheetDetail => {
          return { ...worksheetDetail.targetProduct, name: worksheetDetail.name }
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
      this._validateLocations()
      const response = await client.query({
        query: gql`
          mutation {
            activatePutaway(${gqlBuilder.buildArgs({
              name: this._worksheetNo,
              putawayWorksheetDetails: this._getPutawayWorksheetDetails()
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

  _validateLocations() {
    if (!this.grist.dirtyRecords.every(worksheetDetail => worksheetDetail.toLocation)) {
      throw new Error('text.location_is_not_selected')
    }
  }

  _getPutawayWorksheetDetails() {
    return (this.grist.dirtyRecords || []).map(worksheetDetail => {
      return {
        name: worksheetDetail.name,
        description: worksheetDetail.description,
        toLocation: worksheetDetail.toLocation
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

window.customElements.define('worksheet-putaway', WorksheetPutaway)
