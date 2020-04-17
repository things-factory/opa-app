import '@things-factory/barcode-ui'
import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../components/popup-note'
import './adjust-pallet-qty'
import { WORKSHEET_STATUS } from './constants/worksheet'
import './pallet-label-popup'
import './putaway-worksheet-generate-popup'

class WorksheetUnloading extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _statusOptions: Array,
      _worksheetNo: String,
      _worksheetStatus: String,
      _ganNo: String,
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
        .form-container {
          display: flex;
        }
        .form-container > form {
          flex: 1;
        }
        barcode-tag {
          width: 100px;
          height: 100px;
          margin: 10px;
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
      actions: this._actions,
      printable: {
        accept: ['preview'],
        content: this
      }
    }
  }

  render() {
    return html`
      <div class="form-container">
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.unloading')}</legend>
            <label>${i18next.t('label.arrival_notice')}</label>
            <input name="arrivalNotice" readonly />

            <label>${i18next.t('label.customer')}</label>
            <input name="bizplace" readonly />

            <label>${i18next.t('label.warehouse')}</label>
            <input name="warehouse" readonly />

            <label>${i18next.t('label.staging_area')}</label>
            <input name="bufferLocation" readonly />

            <label>${i18next.t('label.ref_no')}</label>
            <input name="refNo" readonly />

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
          </fieldset>
        </form>

        <barcode-tag bcid="qrcode" .value=${this._ganNo}></barcode-tag>
      </div>

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
    this._ganNo = ''
  }

  async pageUpdated(changes) {
    if (this.active && (changes.resourceId || this._worksheetNo)) {
      if (changes.resourceId) {
        this._worksheetNo = changes.resourceId
      }
      await this.fetchWorksheet()
      this._updateContext()
      this._updateGristConfig()
    }
  }

  async pageInitialized() {
    this._statusOptions = await getCodeByName('WORKSHEET_STATUS')
    this.preConfig = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (column.name === 'palletQty' && !record.isPalletized) {
              this._showPalletQtyAdjustPopup(record)
            } else if (column.name === 'issue' && record.issue) {
              this._showIssueNotePopup(record)
            }
          }
        }
      },
      list: { fields: ['batchId', 'product', 'palletQty', 'status'] },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          width: 350
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
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'totalWeight',
          header: i18next.t('field.total_weight'),
          record: { align: 'left' },
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
              refNo
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
              description
              targetProduct {
                product {
                  id
                  name
                  type
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
      this._gan = worksheet && worksheet.arrivalNotice
      this._ganNo = (this._gan && this._gan.name) || ''
      this._bizplace = worksheet.bizplace.name

      this._fillupForm({
        ...worksheet,
        arrivalNotice: worksheet.arrivalNotice.name,
        bizplace: worksheet.bizplace.name,
        bufferLocation: worksheet.bufferLocation.name,
        warehouse: worksheet.bufferLocation.warehouse.name,
        refNo: worksheet.arrivalNotice.refNo
      })

      this.data = {
        records: worksheetDetails.map(worksheetDetail => {
          return {
            ...worksheetDetail.targetProduct,
            id: worksheetDetail.id,
            name: worksheetDetail.name,
            status: worksheetDetail.status,
            description: worksheetDetail.description,
            issue: worksheetDetail.issue,
            isPalletized:
              worksheetDetail.targetProduct &&
              worksheetDetail.targetProduct.palletQty &&
              Number(worksheetDetail.targetProduct.palletQty) > 0
                ? true
                : false
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
    if (this._worksheetStatus === WORKSHEET_STATUS.EXECUTING.value) {
      this._actions = [
        { title: i18next.t('button.pallet_label_print'), action: this._openPalletLabelPrintPopup.bind(this) }
      ]

      if (
        this.data &&
        this.data.records &&
        this.data.records.some(wsd => wsd.status === WORKSHEET_STATUS.PARTIALLY_UNLOADED.value)
      ) {
        this._actions = [
          ...this._actions,
          { title: i18next.t('button.create_putaway_worksheet'), action: this._showPutawayWorksheetPopup.bind(this) }
        ]
      }
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

    const issueColumnConfig = {
      type: 'string',
      name: 'issue',
      header: i18next.t('field.issue'),
      width: 200
    }

    this.preConfig.columns.map(column => {
      if (column.name === 'description') {
        column.record = { ...column.record, editable: this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value }
      }
    })

    if (
      !this.preConfig.columns.some(e => e.name === 'status') &&
      this._worksheetStatus !== WORKSHEET_STATUS.DEACTIVATED.value
    ) {
      this.preConfig.columns = [...this.preConfig.columns, statusColumnConfig, issueColumnConfig]
    } else if (
      this.preConfig.columns.some(e => e.name === 'status') &&
      this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value
    ) {
      this.preConfig.columns.splice(this.preConfig.columns.map(e => e.name).indexOf('status'))
      this.preConfig.columns.splice(this.preConfig.columns.map(e => e.name).indexOf('issue'))
    }

    this.config = { ...this.preConfig }
    this.data = { ...this.data }
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

  _showPalletQtyAdjustPopup(record) {
    openPopup(
      html`
        <adjust-pallet-qty
          .record="${record}"
          @pallet-adjusted="${e => {
            this.data = {
              ...this.data,
              records: this.data.records.map(item => {
                if (item.name === record.name) {
                  item.palletQty = e.detail.palletQty
                  item.palletizingDescription = e.detail.palletizingDescription
                }

                return item
              })
            }
          }}"
        ></adjust-pallet-qty>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.adjust_pallet_qty')
      }
    )
  }

  _showIssueNotePopup(record) {
    openPopup(html` <popup-note title="${record.batchId}" value="${record.issue}" .readonly="${true}"></popup-note> `, {
      backdrop: true,
      size: 'medium',
      title: i18next.t('title.issue_note')
    })
  }

  async _activateWorksheet() {
    try {
      this._checkPalletQty()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.activate_unloading_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

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

        await this.fetchWorksheet()
        this._updateContext()
        this._updateGristConfig()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _checkPalletQty() {
    if (!this.grist.dirtyData.records.every(record => record.palletQty && Number(record.palletQty) > 0))
      throw new Error(i18next.t('text.there_is_no_pallet_qty'))
  }

  _getUnloadingWorksheetDetails() {
    return (this.grist.dirtyData.records || []).map(worksheetDetail => {
      let _tempObj = {
        name: worksheetDetail.name,
        batchId: worksheetDetail.batchId,
        description: worksheetDetail.description
      }

      if (!worksheetDetail.isPalletized) {
        _tempObj.palletQty = worksheetDetail.palletQty
        _tempObj.palletizingDescription = worksheetDetail.palletizingDescription
      }

      return _tempObj
    })
  }

  _openPalletLabelPrintPopup() {
    const _pallets = {
      records: this.data.records.map(record => {
        return {
          id: record.id,
          palletId: record.palletId,
          batchId: record.batchId,
          product: record.product,
          palletQty: record.palletQty,
          printQty: record.palletQty,
          packingType: record.packingType,
          bizplace: this._bizplace
        }
      })
    }
    openPopup(html` <pallet-label-popup .pallets="${_pallets}"></pallet-label-popup> `, {
      backdrop: true,
      size: 'large',
      title: i18next.t('title.pallet_label')
    })
  }

  _showPutawayWorksheetPopup() {
    this._ganNo
    openPopup(
      html`
        <putaway-worksheet-generate-popup
          .arrivalNotice="${this._gan}"
          @completed="${async () => {
            await this.fetchWorksheet()
            this._updateContext()
          }}"
        ></putaway-worksheet-generate-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.generate_putaway_worksheet')
      }
    )
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
