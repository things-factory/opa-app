import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { PALLET_TYPES, REUSABLE_PALLET } from './constants'
import './vas-pallet-add-popup'
import { VasTemplate } from './vas-template'

class VasRepalletizing extends localize(i18next)(VasTemplate) {
  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      record: Object,
      targetInfo: Object,
      palletType: String,
      isExecuting: Boolean,
      config: Object,
      palletData: Object
    }
  }

  render() {
    return html`
      <form class="single-column-form" @submit="${e => e.preventDefault()}">
        <fieldset>
          <legend>${i18next.t('label.repalletizing')}</legend>
          <label for="pallet-type-selector">${i18next.t('label.pallet_type')}</label>
          <select
            id="pallet-type-selector"
            name="palletType"
            ?disabled="${!this._isEditable}"
            @change="${this._onPalletTypeChange}"
          >
            ${PALLET_TYPES.map(
              PALLET_TYPE => html`
                <option
                  value="${PALLET_TYPE.value}"
                  ?selected="${this._getOperationGuideData('palletType') === PALLET_TYPE.value}"
                  >${PALLET_TYPE.display}</option
                >
              `
            )}
          </select>

          ${this.palletType === REUSABLE_PALLET.value
            ? html`
                <label for="available-pallet-qty-input">${i18next.t('label.availabel_pallet_qty')}</label>
                <input
                  id="available-pallet-qty-input"
                  name="availablePalletQty"
                  readonly
                  value="${this._getOperationGuideData('availablePalletQty') || ''}"
                />
              `
            : ''}

          <label for="std-qty-input">${i18next.t('label.std_qty')}</label>
          <input
            id="std-qty-input"
            name="stdQty"
            type="number"
            min="1"
            ?readonly="${!this._isEditable}"
            @change="${this._onStdQtyChange}"
            value="${this._getOperationGuideData('stdQty') || ''}"
          />

          <label for="pallet-qty">${i18next.t('label.required_pallet_qty')}</label>
          <input
            id="pallet-qty"
            name="requiredPalletQty"
            type="number"
            min="1"
            readonly
            value="${this._getOperationGuideData('requiredPalletQty') || ''}"
          />
        </fieldset>
      </form>

      ${this.isExecuting
        ? html`
            <form class="single-column-form">
              <fieldset>
                <label>${i18next.t('label.total_qty')}</label>
                ${this.record.inventory.qty === 0 && this.record.relatedOrderInv.releaseQty
                  ? html` <input readonly value="${this.record.relatedOrderInv.releaseQty}" /> `
                  : html` <input readonly value="${this.record.inventory.qty}" /> `}
              </fieldset>
            </form>

            <form
              id="input-form"
              class="single-column-form"
              @submit="${e => e.preventDefault()}"
              @keypress="${e => {
                if (e.keyCode === 13) this.repallet()
              }}"
            >
              <fieldset>
                <label>${i18next.t('label.pallet')}</label>
                <barcode-scanable-input name="pallet-id" custom-input></barcode-scanable-input>

                <label>${i18next.t('label.location')}</label>
                <barcode-scanable-input name="location-name" custom-input></barcode-scanable-input>

                <label>${i18next.t('label.package_qty')}</label>
                <input name="package-qty" type="number" min="1" required />
              </fieldset>
            </form>

            <data-grist .mode=${isMobileDevice() ? 'LIST' : 'GRID'} .config="${this.config}" .data="${this.palletData}">
            </data-grist>
          `
        : ''}
    `
  }

  get palletTypeSelector() {
    return this.shadowRoot.querySelector('select[name=palletType]')
  }

  get availablePalletQtyInput() {
    return this.shadowRoot.querySelector('input[name=availablePalletQty]')
  }

  get stdQtyInput() {
    return this.shadowRoot.querySelector('input[name=stdQty]')
  }

  get requiredPalletQtyInput() {
    return this.shadowRoot.querySelector('input[name=requiredPalletQty]')
  }

  get palletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=pallet-id]').shadowRoot.querySelector('input')
  }

  get locationInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=location-name]').shadowRoot.querySelector('input')
  }

  get packageQtyInput() {
    return this.shadowRoot.querySelector('input[name=package-qty]')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  constructor() {
    super()
    this.config = {}
    this.palletData = { records: [] }
  }

  async firstUpdated() {
    await this.updateComplete
    this.palletType = this._getOperationGuideData('palletType') || this.palletTypeSelector.value

    if (this.isExecuting) {
      this._initExecutingConfig()
    }
  }

  _initExecutingConfig() {
    this.locationInput.addEventListener('change', this._checkLocationValidity.bind(this))
    this.config = {
      rows: { appendable: false },
      pagination: { infinite: true },
      list: { fields: ['palletId', 'location', 'qty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: async (columns, data, column, record, rowIndex) => {
              const result = await CustomAlert({
                title: i18next.t('title.are_you_sure'),
                text: i18next.t('text.undo_repalletizing'),
                confirmButton: { text: i18next.t('button.confirm') },
                cancelButton: { text: i18next.t('button.cancel') }
              })

              if (!result.value) {
                return
              }

              this.undoRepallet(this.record.name, record.palletId)
            }
          }
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet'),
          width: 180
        },
        {
          type: 'string',
          name: 'locationName',
          header: i18next.t('field.location'),
          width: 180
        },
        {
          type: 'integer',
          name: 'addedQty',
          header: i18next.t('field.qty'),
          width: 60
        }
      ]
    }
  }

  get data() {
    let data = {
      palletType: this.palletTypeSelector.value,
      stdQty: Number(this.stdQtyInput.value),
      requiredPalletQty: Number(this.requiredPalletQtyInput.value)
    }

    if (this.availablePalletQtyInput) {
      data.availablePalletQty = Number(this.availablePalletQtyInput.value)
    }

    return data
  }

  get contextButtons() {
    return []
  }

  get transactions() {
    return []
  }

  get revertTransactions() {
    return []
  }

  async init() {
    await this.updateComplete
    if (this.isExecuting) {
      this.inputForm.reset()
      this.palletIdInput.value = ''
      this.locationInput.value = ''
      this.palletIdInput.focus()

      this.palletData = {
        records: this.record.operationGuide.data.repalletizedInvs
      }
    }
  }

  validateAdjust() {
    this.checkStdQtyValidity()
    if (!Number(this.requiredPalletQtyInput.value)) {
      this.stdQtyInput.focus()
      throw new Error(i18next.t('text.qty_should_be_positive'))
    }
  }

  async _onPalletTypeChange(e) {
    this.stdQtyInput.value = ''
    this.requiredPalletQtyInput.value = ''

    this.palletType = e.currentTarget.value
    if (this.palletType === REUSABLE_PALLET.value) {
      await this.updateComplete
      this.availablePalletQtyInput.value = await this.fetchAvailablePalletQty()
    }
  }

  _onStdQtyChange() {
    try {
      this.checkStdQtyValidity()
    } catch (e) {
      this._showToast(e)
    } finally {
      this.adjustPalletQty()
    }
  }

  checkStdQtyValidity() {
    let stdQty = Number(this.stdQtyInput.value)
    let errorMsg

    if (stdQty <= 0) {
      errorMsg = i18next.t('text.qty_should_be_positive')
      stdQty = 1
    } else if (!stdQty) {
      errorMsg = i18next.t('text.invalid_quantity_input')
      stdQty = 1
    } else if (stdQty > this.targetInfo.qty) {
      errorMsg = i18next.t('text.qty_exceed_limit')
      stdQty = this.targetInfo.qty
    }

    if (errorMsg) {
      this.stdQtyInput.value = stdQty
      this.stdQtyInput.focus()
      throw new Error(errorMsg)
    }
  }

  adjustPalletQty() {
    const stdQty = Number(this.stdQtyInput.value)
    const maxPalletQtyByStd = Math.ceil(this.targetInfo.qty / stdQty)

    if (this.palletType === REUSABLE_PALLET.value) {
      const availablePalletQty = Number(this.availablePalletQtyInput.value)
      this.requiredPalletQtyInput.value =
        maxPalletQtyByStd >= availablePalletQty ? availablePalletQty : maxPalletQtyByStd
    } else {
      this.requiredPalletQtyInput.value = maxPalletQtyByStd
    }

    if (!Number(this.requiredPalletQtyInput.value)) {
      this.stdQtyInput.value = ''
      this.requiredPalletQtyInput.value = ''
      this.stdQtyInput.focus()
      this._showToast({ message: i18next.t('text.qty_should_be_positive') })
    }
  }

  async _checkLocationValidity() {
    try {
      const locationName = this.locationInput.value
      if (!locationName) return

      const response = await client.query({
        query: gql`
          query {
            locationByName(${gqlBuilder.buildArgs({
              name: locationName
            })}) {
              id
            }
          }
        `
      })

      if (!response.errors) {
        if (!response.data.locationByName) throw new Error(i18next.t('text.there_is_no_location'))
      }
    } catch (e) {
      this.locationInput.value = ''
      this.locationInput.focus()
      this._showToast(e)
    }
  }

  async fetchAvailablePalletQty() {
    const response = await client.query({
      query: gql`
        query {
          pallets(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'holder',
                operator: 'is_null'
              }
            ]
          })}) {
            total
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.pallets.total
    }
  }

  async repallet() {
    try {
      this._checkPalletAddable()
      await client.query({
        query: gql`
          mutation {
            repalletizing(${gqlBuilder.buildArgs({
              worksheetDetailName: this.record.name,
              palletId: this.palletIdInput.value,
              locationName: this.locationInput.value,
              packageQty: parseInt(this.packageQtyInput.value)
            })})
          }
        `
      })

      this.dispatchEvent(new CustomEvent('completed'))
      this.init()
    } catch (e) {
      this._showToast(e)
    }
  }

  async undoRepallet(worksheetDetailName, palletId) {
    try {
      await client.query({
        query: gql`
          mutation {
            undoRepalletizing(${gqlBuilder.buildArgs({
              worksheetDetailName,
              palletId
            })})
          }
        `
      })

      this.dispatchEvent(new CustomEvent('completed'))
      this.init()
    } catch (e) {
      this._showToast(e)
    }
  }

  _checkPalletAddable() {
    if (!this.palletIdInput.value) {
      this.palletIdInput.select()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    if (!this.locationInput.value) {
      this.locationInput.select()
      throw new Error(i18next.t('text.location_code_is_empty'))
    }

    if (!Number(this.packageQtyInput.value) || Number(this.packageQtyInput.value) <= 0) {
      this.packageQtyInput.select()
      throw new Error(i18next.t('text.package_qty_should_be_positive'))
    }

    const invQty = this.record.qty || this.record.relatedOrderInv.releaseQty
    if (Number(this.packageQtyInput.value) > invQty - this.getTotalRepalletedQty()) {
      this.packageQtyInput.select()
      throw new Error(i18next.t('text.package_qty_is_exceed_inventory_qty'))
    }
  }

  getTotalRepalletedQty() {
    return (this.record.operationGuide.data.repalletizedInvs || []).reduce(
      (totalQty, inv) => totalQty + inv.addedQty,
      0
    )
  }
}

customElements.define('vas-repalletizing', VasRepalletizing)
