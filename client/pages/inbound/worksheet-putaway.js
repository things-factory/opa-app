import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { WORKSHEET_STATUS } from './constants/worksheet'

class WorksheetPutaway extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
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
      title: i18next.t('title.worksheet_putaway')
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

    if (changedProps.has('_worksheetStatus') && this._worksheetStatus) {
      this.updateContext()
      this.updateGristConfig()
    }
  }

  pageInitialized() {
    this.preConfig = {
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
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
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
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'right' },
          width: 60
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.comment'),
          width: 300
        },
        {
          type: 'object',
          name: 'toLocation',
          align: 'center',
          record: {
            options: {
              queryName: 'locations',
              basicArgs: { filters: [] }
            }
          },
          header: i18next.t('field.to_location'),
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
            status
            arrivalNotice {
              name
              description
            }
            bizplace {
              name
              description
            }
            bufferLocation {
              name
              description
              warehouse {
                id
              }
            }
            worksheetDetails {
              name
              description
              toLocation {
                name
                description
              }
              targetInventory {
                batchId
                palletId
                product {
                  name
                  description
                }
                packingType
                location {
                  name
                  description
                }
                qty
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

      this._setWarehouseFilter(worksheet.bufferLocation.warehouse.id)
      this._fillupForm(worksheet)
      this.data = {
        records: worksheetDetails.map(worksheetDetail => {
          return {
            ...worksheetDetail.targetInventory,
            name: worksheetDetail.name,
            description: worksheetDetail.description,
            toLocation: worksheetDetail.toLocation,
            status: worksheetDetail.status
          }
        })
      }
    }
  }

  _setWarehouseFilter(warehouseId) {
    this.preConfig.columns.map(column => {
      if (column.name === 'toLocation') {
        column.record.options.basicArgs.filters = [
          { name: 'warehouse_id', value: warehouseId, operator: 'eq' },
          {
            name: 'type',
            value: 'BUFFER',
            operator: 'noteq'
          }
        ]
      }
      return column
    })
  }

  updateContext() {
    let actions

    if (this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value) {
      actions = [
        { title: i18next.t('button.back'), action: () => history.back() },
        { title: i18next.t('button.activate'), action: this._activateWorksheet.bind(this) }
      ]
    } else {
      actions = [{ title: i18next.t('button.back'), action: () => history.back() }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.worksheet_putaway'),
        actions
      }
    })
  }

  updateGristConfig() {
    const currentLocationColumn = {
      type: 'object',
      name: 'location',
      record: { align: 'center' },
      header: i18next.t('field.current_location'),
      width: 200
    }
    const statusColumnConfig = {
      type: 'string',
      name: 'status',
      header: i18next.t('field.status'),
      record: { align: 'center' },
      width: 100
    }

    this.preConfig.columns.map(column => {
      if (column.name === 'description' || column.name === 'toLocation') {
        column.record = { ...column.record, editable: this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value }
      }
    })

    if (this._worksheetStatus !== WORKSHEET_STATUS.DEACTIVATED.value) {
      this.preConfig.columns = [...this.preConfig.columns, currentLocationColumn, statusColumnConfig]
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
      this._validateLocations()
      const response = await client.query({
        query: gql`
          mutation {
            activatePutaway(${gqlBuilder.buildArgs({
              worksheetNo: this._worksheetNo,
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
    if (!this.grist.dirtyData.records.every(worksheetDetail => worksheetDetail.location)) {
      throw new Error('text.location_is_not_selected')
    }
  }

  _getPutawayWorksheetDetails() {
    return this.grist.dirtyData.records.map(worksheetDetail => {
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
