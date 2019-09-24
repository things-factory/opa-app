import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class UnloadProduct extends localize(i18next)(PageView) {
  static get properties() {
    return {
      arrivalNoticeNo: String,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          background-color: var(--main-section-background-color);
        }

        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          grid-column: span 12;
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
          margin: 0;
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

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <form class="single-column-form">
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

      <div class="grist single-column-form">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.unloading')}</h2>
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

  firstUpdated() {
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
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          width: 200
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
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { align: 'right' },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { align: 'right' },
          width: 80
        },
        {
          type: 'integer',
          name: 'actualQty',
          header: i18next.t('field.actual_qty'),
          record: { editable: true, align: 'right' },
          width: 80
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 300
        }
      ]
    }

    this._focusOnBarcodField()
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
      this._completeUnloading()
    } catch (e) {
      this._showToast({
        message: e.message
      })
    }
  }

  validate() {
    const tasks = this.grist.dirtyData.records
    // 1. actualQty has to be typed.
    if (!tasks.every(task => task.actualQty)) throw new Error(i18next.t('text.actual_qty_is_empty'))
    // 2. actualQty has to be positive
    if (!tasks.every(task => task.actualQty > 0)) throw new Error(i18next.t('text.actual_qty_has_to_be_positive'))
    // 2. actualQty is mached with packQty?
    // 2. 1) If No is there remark for that?
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
