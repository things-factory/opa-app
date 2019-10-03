import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../utils/custom-alert'
import { WORKSHEET_STATUS } from './constants/worksheet'

class WorksheetUnloading extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _statusOptions: Array,
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
    return { title: i18next.t('title.worksheet_unloading'), actions: this._actions }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.unloading')}</legend>
          <label>${i18next.t('label.arrival_notice')}</label>
          <input name="arrivalNotice" readonly />

          <label>${i18next.t('label.customer')}</label>
          <input name="bizplace" readonly />

          <label>${i18next.t('label.warehouse')}</label>
          <input name="warehouse" readonly />

          <label>${i18next.t('label.buffer_location')}</label>
          <input name="bufferLocation" readonly />

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
          name: 'totalWeight',
          header: i18next.t('field.total_weight'),
          record: { align: 'right' },
          width: 80
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
            bizplace {
              id
              name
              description
            }
            bufferLocation {
              id
              name
              description
              warehouse {
                id
                name
                description
              }
            }
            worksheetDetails {
              id
              name
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
              status
              issue
            }
          }
        }
      `
    })

    if (!response.errors) {
      const worksheet = response.data.worksheet
      const worksheetDetails = worksheet.worksheetDetails
      this._worksheetStatus = worksheet.status

      this._fillupForm({
        ...worksheet,
        arrivalNotice: worksheet.arrivalNotice.name,
        bizplace: worksheet.bizplace.name,
        bufferLocation: worksheet.bufferLocation.name,
        warehouse: worksheet.bufferLocation.warehouse.name
      })

      this.data = {
        records: worksheetDetails.map(worksheetDetail => {
          return { ...worksheetDetail.targetProduct, name: worksheetDetail.name, status: worksheetDetail.status }
        })
      }
    }
  }

  _updateContext() {
    this._actions = []
    if (this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value) {
      this._actions = [
        { title: i18next.t('button.activate'), type: 'transaction', action: this._activateWorksheet.bind(this) }
      ]
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

  async _activateWorksheet(cb) {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.activate_unloading_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        cb()
        return
      }

      const response = await client.query({
        query: gql`
            mutation {
              activateUnloading(${gqlBuilder.buildArgs({
                worksheetNo: this._worksheetNo,
                unloadingWorksheetDetails: this._getUnloadingWorksheetDetails()
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.worksheet_activated') })
        const result = await CustomAlert({
          title: i18next.t('title.unloading_worksheet'),
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
    } finally {
      cb()
    }
  }

  _getUnloadingWorksheetDetails() {
    return (this.grist.dirtyData.records || []).map(worksheetDetail => {
      return {
        name: worksheetDetail.name,
        description: worksheetDetail.description
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

window.customElements.define('worksheet-unloading', WorksheetUnloading)
