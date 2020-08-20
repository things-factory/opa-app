import { i18next, localize } from '@things-factory/i18n-base'
import { css, html, LitElement } from 'lit-element'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { client, CustomAlert } from '@things-factory/shell'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import gql from 'graphql-tag'

class PopupUnloading extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      title: String,
      ganNo: String,
      reusablePallet: String,
      _productName: String,
      _selectedOrderProduct: Object,
      _selectedInventory: Object,
      unloadingGristConfig: Object,
      unloadingGristData: Object,
      _unloadedInventories: Array,
      unloadedGristConfig: Object,
      unloadedGristData: Object,
      reusablePalletData: Object
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
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
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
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          overflow: hidden;
          flex: 1;
        }
        .left-column {
          overflow: hidden;
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        .right-column {
          overflow: auto;
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        .button-container {
          padding: var(--button-container-padding);
          margin: var(--button-container-margin);
          text-align: var(--button-container-align);
          background-color: var(--button-container-background);
          height: var(--button-container-height);
        }
        .button-container button {
          background-color: var(--button-container-button-background-color);
          border-radius: var(--button-container-button-border-radius);
          height: var(--button-container-button-height);
          border: var(--button-container-button-border);
          margin: var(--button-container-button-margin);

          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container button:hover,
        .button-container button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get unloadingGrist() {
    return this.shadowRoot.querySelector('#unloading-grist')
  }

  get reusablePalletInput() {
    return this.shadowRoot.querySelector('input[name=reusablePalletID]')
  }

  get palletInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=palletId]').shadowRoot.querySelector('input')
  }

  get actualQtyInput() {
    return this.shadowRoot.querySelector('input[name=qty]')
  }

  firstUpdated() {
    this.unloadingGristConfig = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.batchId) {
              this._selectedOrderProduct = record
              this._selectedInventory = null
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
      list: { fields: ['batchId', 'palletQty', 'actualPalletQty', 'packQty', 'actualPackQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'validity',
          header: i18next.t('field.validity'),
          width: 40
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          width: 200
        },
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
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'integer',
          name: 'actualPalletQty',
          header: i18next.t('field.actual_pallet_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.total_pack_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'integer',
          name: 'actualPackQty',
          header: i18next.t('field.actual_pack_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'string',
          name: 'issue',
          header: i18next.t('field.issue'),
          width: 100
        }
      ]
    }

    this.unloadedGristConfig = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.palletId && this._selectedOrderProduct) {
              this._selectedInventory = record
              this.palletInput.value = record.palletId
              this.actualQtyInput.value = record.qty
            }
          }
        }
      },
      list: { fields: ['palletId', 'qty'] },
      pagination: {
        infinite: true
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet'),
          width: 150
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.actual_pack_qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'reusablePalletName',
          header: i18next.t('field.reusable_pallet'),
          width: 150
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('reusablePallet')) {
      this.reusablePalletInput.value = this.reusablePallet
    }
  }

  render() {
    return html`
      <form id="info-form" class="multi-column-form">
        <fieldset>
          <label>${i18next.t('label.reusable_pallet')}</label>
          <input name="reusablePalletID" type="text" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.unloading')}</h2>
          <data-grist
            id="unloading-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.unloadingGristConfig}
            .data=${this.unloadingGristData}
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.unloaded')}</h2>
          <data-grist
            id="unloaded-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.unloadedGristConfig}
            .data=${this.unloadedGristData}
          ></data-grist>
        </div>

        <div class="right-column">
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('title.product')}</legend>

              <label>${i18next.t('label.batch_no')}</label>
              <input name="batchId" readonly />

              <label>${i18next.t('label.description')}</label>
              <input name="description" readonly />

              <label>${i18next.t('label.packing_type')}</label>
              <input name="packingType" readonly />

              <label>${i18next.t('label.total_pallet_qty')}</label>
              <input name="palletQty" type="number" readonly />

              <label>${i18next.t('label.total_pack_qty')}</label>
              <input name="packQty" type="number" readonly />
            </fieldset>

            <fieldset>
              <legend>${i18next.t('title.input_section')}</legend>

              <label>${i18next.t('label.pallet_id')}</label>
              <barcode-scanable-input
                name="palletId"
                .value=${this._palletId}
                without-enter
                custom-input
                @keypress="${this._unload.bind(this)}"
              ></barcode-scanable-input>

              <label>${i18next.t('label.actual_qty')}</label>
              <input name="qty" type="number" min="1" @keypress="${this._unload.bind(this)}" required />
            </fieldset>
          </form>
        </div>
      </div>

      <div class="button-container">
        <button @click="${this._undoUnloading.bind(this)}">
          ${i18next.t('button.undo')}
        </button>
        <button
          @click="${() => {
            this.dispatchEvent(new CustomEvent('unloading-pallet', { detail: this.unloadingGristData }))
            this.dispatchEvent(new CustomEvent('unloaded-pallet', { detail: this.unloadedGristData }))
            history.back()
          }}"
        >
          ${i18next.t('button.confirm')}
        </button>
      </div>
    `
  }

  async _fetchProducts(arrivalNoticeNo) {
    const response = await client.query({
      query: gql`
        query {
          unloadingWorksheet(${gqlBuilder.buildArgs({
            arrivalNoticeNo
          })}) {
            worksheetInfo {
              bizplaceName
              containerNo
              refNo
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
              actualPalletQty
              packQty
              actualPackQty
              issue
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.unloadingGristData = {
        records: response.data.unloadingWorksheet.worksheetDetailInfos.map(worksheetDetailInfo => {
          return {
            ...worksheetDetailInfo,
            validity:
              worksheetDetailInfo.actualPackQty === worksheetDetailInfo.packQty &&
              worksheetDetailInfo.actualPalletQty === worksheetDetailInfo.palletQty
          }
        })
      }
    }
  }

  async _fetchInventories() {
    if (!this._selectedOrderProduct.name) return

    const response = await client.query({
      query: gql`
        query {
          unloadedInventories(${gqlBuilder.buildArgs({
            worksheetDetailName: this._selectedOrderProduct.name
          })}) {
            batchId
            palletId
            qty
            reusablePallet {
              id
              name
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._unloadedInventories = response.data.unloadedInventories
      this._selectedInventory = null
      this.unloadedGristData = {
        records: this._unloadedInventories
      }

      this.unloadedGristData = {
        records: this.unloadedGristData.records.map(unloading => {
          return {
            ...unloading,
            reusablePalletName: unloading.reusablePallet.name
          }
        })
      }

      this.unloadingGristData = {
        records: this.unloadingGristData.records.map(unloading => {
          if (unloading.batchId === this._unloadedInventories.batchId) {
            unloading.actualPalletQty = this._unloadedInventories.length
            unloading.actualTotalPackQty = this._unloadedInventories
              .map(inventory => inventory.qty)
              .reduce((a, b) => a + b, 0)
          }

          return unloading
        })
      }
    }
  }

  async _unload(e) {
    if (e.keyCode === 13) {
      try {
        this._validateUnloading()
        const response = await client.query({
          query: gql`
            mutation {
              unload(${gqlBuilder.buildArgs({
                worksheetDetailName: this._selectedOrderProduct.name,
                inventory: {
                  palletId: this.palletInput.value.trim(),
                  qty: parseInt(this.actualQtyInput.value),
                  reusablePallet: this.reusablePalletData
                }
              })})
            }
          `
        })

        if (!response.errors) {
          this.palletInput.value = ''
          this.actualQtyInput.value = ''

          await this._fetchProducts(this.ganNo)
          await this._fetchInventories()
          this._focusOnPalletInput()
        }
      } catch (e) {
        this._showToast({ message: e.message })
      }
    }
  }

  _validateUnloading() {
    // 1. validate for order selection
    if (!this._selectedOrderProduct) throw new Error(i18next.t('text.target_does_not_selected'))

    // 2. pallet id existing
    if (!this.palletInput.value) {
      this._focusOnPalletInput()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    // 4. qty value existing
    if (!parseInt(this.actualQtyInput.value)) {
      this._focusOnActualQtyInput()
      throw new Error(i18next.t('text.qty_is_empty'))
    }

    // 5. qty value has to be positive
    if (!(parseInt(this.actualQtyInput.value) > 0)) {
      setTimeout(() => this.actualQtyInput.select(), 100)
      throw new Error(i18next.t('text.qty_should_be_positive'))
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

  async _undoUnloading() {
    try {
      this._validateUndo()
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.undo_unloading'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
            mutation {
              undoUnloading(${gqlBuilder.buildArgs({
                worksheetDetailName: this._selectedOrderProduct.name,
                palletId: this._selectedInventory.palletId
              })})
            }
          `
      })

      if (!response.errors) {
        this._selectedInventory = null
        this.palletInput.value = ''
        this.actualQtyInput.value = ''
      }
      await this._fetchProducts(this.ganNo)
      await this._fetchInventories()
      this._focusOnPalletInput()
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateUndo() {
    if (!this._selectedInventory) throw new Error('text.target_does_not_selected')
  }

  _focusOnPalletInput() {
    setTimeout(() => this.palletInput.focus(), 100)
  }

  _focusOnActualQtyInput() {
    setTimeout(() => this.actualQtyInput.focus(), 100)
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

window.customElements.define('popup-unloading', PopupUnloading)
