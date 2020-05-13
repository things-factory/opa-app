import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../image-viewer'
import { PACKING_UNITS, PACKING_UNIT_QTY, PACKING_UNIT_WEIGHT } from './constants'
import './vas-repack-pallet-add-popup'
import { VasTemplate } from './vas-template'

class VasRepack extends localize(i18next)(VasTemplate) {
  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        .container {
          display: flex;
          flex-direction: column;
          flex: 1;
          margin: 0px 20px;
        }
        data-grist {
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      record: Object,
      targetInfo: Object,
      packingTypes: Array,
      isExecuting: Boolean,
      config: Object,
      palletData: Object
    }
  }

  render() {
    return html`
      <div class="container">
        <form id="repack-info-form" class="single-column-form" @submit="${e => e.preventDefault()}">
          <fieldset>
            <legend>${i18next.t('title.repack')}</legend>

            <label>${i18next.t('label.packing_unit')}</label>
            <select id="packing-unit-selector" required ?disabled="${!this._isEditable}">
              ${PACKING_UNITS.map(
                unit =>
                  html`<option
                    value="${unit.value}"
                    ?selected="${this._getOperationGuideData('packingUnit') === unit.value}"
                    >${unit.display}</option
                  >`
              )}
            </select>

            <label>${i18next.t('label.to_packing_type')}</label>
            ${this._isEditable
              ? html`
                  <select id="to-packing-type-selector" required>
                    ${this.packingTypes
                      .filter(packingType => packingType.name != this.targetInfo.packingType)
                      .map(
                        packingType => html`
                          <option
                            value="${packingType.name}"
                            ?selected="${this._getOperationGuideData('toPackingType') === packingType.name}"
                            >${packingType.description}</option
                          >
                        `
                      )}
                  </select>
                `
              : html`
                  <input
                    readonly
                    value="${(() => {
                      const packingType = this.packingTypes.find(
                        packingType => packingType.name === this._getOperationGuideData('toPackingType')
                      )
                      return packingType ? packingType.description : ''
                    })()}"
                  />
                `}

            <label>${i18next.t('label.std_amount')}</label>
            <input
              required
              type="number"
              name="std-amount"
              value="${this._getOperationGuideData('stdAmount') || ''}"
              ?disabled="${!this._isEditable}"
            />

            <label>${i18next.t('label.required_package_qty')}</label>
            <input
              required
              type="number"
              name="package-qty"
              min="1"
              value="${this._getOperationGuideData('packageQty') || ''}"
              ?disabled="${!this._isEditable}"
            />

            ${this.isExecuting
              ? html`
                  <label>${i18next.t('label.maximum_pakage_qty')}</label>
                  <input type="number" value="${this.maximumPackageQty}" disabled />
                `
              : ''}
          </fieldset>
        </form>

        ${this.isExecuting
          ? html`
              <data-grist
                .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
                .config="${this.config}"
                .data="${this.palletData}"
              >
              </data-grist>
            `
          : ''}
      </div>
    `
  }

  constructor() {
    super()
    this.packingTypes = []
    this.config = {}
    this.palletData = { records: [] }
  }

  async firstUpdated() {
    await this._fetchPackingTypes()

    this.config = {
      rows: { appendable: false },
      pagination: { infinite: true },
      list: { fields: ['palletId', 'packageQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.palletData = {
                ...this.palletData,
                records: data.records.filter((_, idx) => idx !== rowIndex)
              }
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
          name: 'packageQty',
          header: i18next.t('field.package_qty'),
          width: 60
        }
      ]
    }
  }

  async _fetchPackingTypes() {
    const response = await client.query({
      query: gql`
        query {
          commonCode(${gqlBuilder.buildArgs({
            name: 'PACKING_TYPES'
          })}) {
            details {
              name
              description
              rank
            }
          }
        }
      `
    })

    if (response && !response.errors) {
      this.packingTypes = response.data.commonCode.details
    }
  }

  get contextButtons() {
    return [
      {
        title: i18next.t('label.add_pallet'),
        action: this.openAddPalletPopup.bind(this)
      }
    ]
  }

  get form() {
    return this.shadowRoot.querySelector('form#repack-info-form')
  }

  get packingUnitSelector() {
    return this.shadowRoot.querySelector('select#packing-unit-selector')
  }
  get toPackingTypeSelector() {
    return this.shadowRoot.querySelector('select#to-packing-type-selector')
  }

  get stdAmountInput() {
    return this.shadowRoot.querySelector('input[name=std-amount]')
  }

  get packageQtyInput() {
    return this.shadowRoot.querySelector('input[name=package-qty]')
  }

  get palletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=pallet-id]').shadowRoot.querySelector('input')
  }

  get transactions() {
    return []
  }

  get revertTransactions() {
    return []
  }

  get data() {
    return {
      packingUnit: this.packingUnitSelector.value,
      toPackingType: this.toPackingTypeSelector.value,
      stdAmount: Number(this.stdAmountInput.value) || '',
      packageQty: Number(this.packageQtyInput.value) || ''
    }
  }

  get maximumPackageQty() {
    const packingUnit = this.record.operationGuide.data.packingUnit
    const stdAmount = this.record.operationGuide.data.stdAmount

    if (packingUnit === PACKING_UNIT_QTY.value) {
      return this.record.qty / stdAmount
    } else if (packingUnit === PACKING_UNIT_WEIGHT.value) {
      return this.record.weight / stdAmount
    }
  }

  get completeParams() {
    return this.palletData.records
  }

  checkCompleteValidity() {
    if (!this.palletData || !this.palletData.records || !this.palletData.records.length)
      throw new Error(i18next.t('text.there_is_no_pallet_records'))
  }

  _getOperationGuideData(key) {
    if (this.record.operationGuide && this.record.operationGuide.data && this.record.operationGuide.data[key]) {
      return this.record.operationGuide.data[key]
    }
  }

  validateAdjust() {
    if (!this.form.checkValidity()) throw new Error(i18next.t('text.invalid_form'))
    const stdAmount = Number(this.stdAmountInput.value)
    if (stdAmount <= 0) throw new Error(i18next.t('text.std_amount_should_be_positive'))

    const packageQty = Number(this.packageQtyInput.value)
    if (packageQty <= 0) throw new Error(i18next.t('text.package_qty_should_be_positive'))

    const packingUnit = this.packingUnitSelector.value

    if (packingUnit === PACKING_UNIT_QTY.value) {
      if (this.targetInfo.qty && stdAmount * packageQty > this.targetInfo.qty)
        throw new Error(i18next.t('text.qty_exceed_limit'))
    } else if (packingUnit === PACKING_UNIT_WEIGHT.value) {
      if (this.targetInfo.weight && stdAmount * packageQty > this.targetInfo.weight) {
        throw new Error(i18next.t('text.weight_exceed_limit'))
      }
    }
  }

  openAddPalletPopup() {
    openPopup(
      html`<vas-repack-pallet-add-popup
        @add-pallet="${e => {
          this._addPallet(e.detail.palletId, e.detail.locationName, e.detail.packageQty)
        }}"
      ></vas-repack-pallet-add-popup>`,
      {
        backdrop: true,
        size: 'small',
        title: i18next.t('title.repack')
      }
    )
  }

  _addPallet(palletId, locationName, packageQty) {
    try {
      this._checkValidity(packageQty)
      this.palletData = {
        ...this.palletData,
        records: [...this.palletData.records, { palletId, locationName, packageQty }]
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _checkValidity(packageQty) {
    const packingUnit = this.record.operationGuide.data.packingUnit
    const stdAmount = this.record.operationGuide.data.stdAmount
    const totalPackageQty =
      this.palletData.records.reduce((totalPackageQty, record) => (totalPackageQty += record.packageQty), 0) +
      packageQty
    const totalAmount = stdAmount * totalPackageQty

    if (packingUnit === PACKING_UNIT_QTY.value) {
      if (this.record.qty < totalAmount) throw new Error(i18next.t('text.qty_exceed_limit'))
    } else if (packingUnit === PACKING_UNIT_WEIGHT.value) {
      if (this.record.weight < totalAmount) throw new Error(i18next.t('text.weight_exceed_limit'))
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

window.customElements.define('vas-repack', VasRepack)
