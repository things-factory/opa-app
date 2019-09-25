import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class UnloadProduct extends localize(i18next)(PageView) {
  static get properties() {
    return {
      arrivalNoticeNo: String,
      _productName: String,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }

        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex: 1;
        }
        .left-column {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .rifhg-column {
          overflow: hidden;
          display: flex;
          flex-direction: column;
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
      title: i18next.t('title.unloading'),
      actions: [
        {
          title: i18next.t('button.complete'),
          action: this._completeHandler.bind(this)
        }
      ]
    }
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.arrival_notice_no')}</label>
          <input
            name="arrivalNoticeNo"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                if (e.currentTarget.value) this._getProducts(e.currentTarget.value)
              }
            }}"
          />
        </fieldset>

        <fieldset>
          <legend>${`${i18next.t('title.arrival_notice')}: ${this.arrivalNoticeNo}`}</legend>

          <label>${i18next.t('label.bizplace')}</label>
          <input name="bizplaceName" readonly />

          <label>${i18next.t('label.container_no')}</label>
          <input name="containerNo" readonly />

          <label>${i18next.t('label.buffer_location')}</label>
          <input name="bufferLocation" readonly />

          <label>${i18next.t('label.startedAt')}</label>
          <input name="startedAt" type="datetime-local" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.unloading')}</h2>
          <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .data=${this.data}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('title.product_batch')}: ${this._productName}</legend>

              <label>${i18next.t('label.batch_id')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.description')}</label>
              <input name="description" readonly />

              <label>${i18next.t('label.packing_type')}</label>
              <input name="packingType" readonly />

              <label>${i18next.t('label.pallet_qty')}</label>
              <input name="palletQty" type="number" readonly />

              <label>${i18next.t('label.pack_qty')}</label>
              <input name="packQty" type="number" readonly />
            </fieldset>

            <fieldset>
              <legend>${i18next.t('title.input_section')}</legend>

              <label>${i18next.t('label.actual_pallet_qty')}</label>
              <input name="actualPalletQty" type="number" min="1" @change="${this._fillUpGrist.bind(this)}" required />

              <label>${i18next.t('label.actual_qty')}</label>
              <input name="actualQty" type="number" min="1" @change="${this._fillUpGrist.bind(this)}" required />

              <label>${i18next.t('label.remark')}</label>
              <textarea name="remark" @change="${this._fillUpGrist.bind(this)}"></textarea>
            </fieldset>
          </form>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.arrivalNoticeNo = ''
    this._productName = ''
    this.data = { records: [] }
  }

  pageInitialized() {
    this.config = {
      rows: {
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record) {
              this._selectedWorksheetDetailName = record.name
              this._productName = `${record.product.name} ${
                record.product.description ? `(${record.product.description})` : ''
              }`
              this._fillUpInputForm(record)
            }
          }
        }
      },
      pagination: {
        infinite: true
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          width: 200
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
          name: 'actualPalletQty',
          header: i18next.t('field.actual_pallet_qty'),
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
          record: { align: 'right' },
          width: 60
        }
      ]
    }
  }

  async pageUpdated() {
    if (this.active) {
      await this.updateComplete
      this._focusOnBarcodField()
    }
  }

  _focusOnBarcodField() {
    this.shadowRoot.querySelector('input[name=arrivalNoticeNo]').focus()
  }

  async _getProducts(arrivalNoticeNo) {
    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          unloadingWorksheet(${gqlBuilder.buildArgs({
            arrivalNoticeNo
          })}) {
            worksheetInfo {
              bizplaceName
              containerNo
              bufferLocation
              startedAt
            }
            worksheetDetailInfos {
              batchId
              product {
                id
                name
                description
              }
              name
              targetName
              description
              packingType
              palletQty
              packQty
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.arrivalNoticeNo = arrivalNoticeNo
      this._fillUpForm(response.data.unloadingWorksheet.worksheetInfo)

      this.data = {
        ...this.data,
        records: response.data.unloadingWorksheet.worksheetDetailInfos
      }
    }
  }

  _clearView() {
    this.data = { records: [] }
    this.infoForm.reset()
    this.inputForm.reset()
  }

  _fillUpForm(data) {
    for (let key in data) {
      Array.from(this.infoForm.querySelectorAll('input')).forEach(field => {
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

  _fillUpInputForm(data) {
    this.inputForm.reset()
    for (let key in data) {
      Array.from(this.inputForm.querySelectorAll('input, textarea')).forEach(field => {
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

  _fillUpGrist(e) {
    if (e.currentTarget.value) {
      this.data = {
        ...this.data,
        records: this.data.records.map(record => {
          if (record.name === this._selectedWorksheetDetailName) {
            record[e.currentTarget.name] =
              e.currentTarget.type === 'number' ? parseInt(e.currentTarget.value) : e.currentTarget.value
          }

          return record
        })
      }
    }
  }

  _completeHandler() {
    try {
      this.validate()
      this._completeUnloading()
    } catch (e) {
      this._showToast({
        message: e.message
      })
    }
  }

  validate() {
    const tasks = this.grist.data.records
    // 1. actualPalletQty has to be typed.
    if (!tasks.every(task => task.actualPalletQty)) throw new Error(i18next.t('text.actual_pallet_qty_is_empty'))
    // 2. actualQty has to be typed.
    if (!tasks.every(task => task.actualQty)) throw new Error(i18next.t('text.actual_qty_is_empty'))
    // 3. actualPalletQty has to be positive
    if (!tasks.every(task => task.actualPalletQty > 0))
      throw new Error(i18next.t('text.actual_pallet_qty_has_to_be_positive'))
    // 4. actualQty has to be positive
    if (!tasks.every(task => task.actualQty > 0)) throw new Error(i18next.t('text.actual_qty_has_to_be_positive'))
    // 5. actualPalletQty is matched with palletQty?
    // 5. 1) If No is there remark for that?
    if (!tasks.filter(task => task.actualPalletQty !== task.palletQty).every(task => task.remark))
      throw new Error(i18next.t('text.remark_is_empty'))
    // 6. actualQty is matched with packQty?
    // 6. 1) If No is there remark for that?
    if (!tasks.filter(task => task.actualQty !== task.packQty).every(task => task.remark))
      throw new Error(i18next.t('text.remark_is_empty'))
  }

  async _completeUnloading() {
    const response = await client.query({
      query: gql`
        mutation {
          completeUnloading(${gqlBuilder.buildArgs({
            arrivalNoticeNo: this.arrivalNoticeNo,
            unloadingWorksheetDetails: this._getUnloadingWorksheetDetails()
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

  _getUnloadingWorksheetDetails() {
    return this.grist.dirtyData.records.map(task => {
      return {
        name: task.name,
        remark: task.remark ? task.remark : null,
        targetProduct: {
          name: task.targetName,
          actualPalletQty: task.actualPalletQty,
          actualQty: task.actualQty
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

window.customElements.define('unload-product', UnloadProduct)
