import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../image-viewer'
import { PACKING_UNITS, PACKING_UNIT_QTY, PACKING_UNIT_WEIGHT } from './constants'
import './vas-pallet-add-popup'
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
            <select
              id="packing-unit-selector"
              required
              ?disabled="${!this._isEditable}"
              @change="${this._onPackingUnitChange}"
            >
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
              @change="${this._onStdAmountChange}"
              value="${this._getOperationGuideData('stdAmount') || ''}"
              ?disabled="${!this._isEditable}"
            />

            <label>${i18next.t('label.required_package_qty')}</label>
            <input
              readonly
              type="number"
              name="required-package-qty"
              min="1"
              value="${this._getOperationGuideData('requiredPackageQty') || ''}"
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
                  if (e.keyCode === 13) this.repack()
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

  get contextButtons() {
    return []
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

  get requiredPackageQtyInput() {
    return this.shadowRoot.querySelector('input[name=required-package-qty]')
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
      requiredPackageQty: Number(this.requiredPackageQtyInput.value) || ''
    }
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

  async firstUpdated() {
    await this.updateComplete
    if (this.isExecuting) {
      this._initExecutingConfig()
    }

    await this._fetchPackingTypes()
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
                text: i18next.t('text.undo_repackaging'),
                confirmButton: { text: i18next.t('button.confirm') },
                cancelButton: { text: i18next.t('button.cancel') }
              })

              if (!result.value) {
                return
              }

              this.undoRepack(this.record.name, record.palletId)
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
          name: 'repackedPkgQty',
          header: i18next.t('field.qty'),
          width: 60
        }
      ]
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

  async init() {
    await this.updateComplete
    if (this.isExecuting) {
      this.inputForm.reset()
      this.palletIdInput.value = ''
      this.locationInput.value = ''
      this.palletIdInput.focus()

      this.palletData = {
        records: this.record.operationGuide.data.repackedInvs
      }
    }
  }

  _onPackingUnitChange() {
    const stdAmount = parseInt(this.stdAmountInput.value)
    if (stdAmount) {
      this._calcPackageQty()
    }
  }

  _onStdAmountChange() {
    this._calcPackageQty()
  }

  _calcPackageQty() {
    const packingUnit = this.packingUnitSelector.value
    const stdAmount = parseInt(this.stdAmountInput.value)
    if (packingUnit === PACKING_UNIT_QTY.value) {
      this.requiredPackageQtyInput.value = this.targetInfo.qty / stdAmount
    } else {
      this.requiredPackageQtyInput.value = this.targetInfo.weight / stdAmount
    }
  }

  checkCompleteValidity() {
    if (!this.palletData || !this.palletData.records || !this.palletData.records.length)
      throw new Error(i18next.t('text.there_is_no_pallet_records'))
  }

  validateAdjust() {
    if (!this.form.checkValidity()) throw new Error(i18next.t('text.invalid_form'))
    const stdAmount = Number(this.stdAmountInput.value)
    if (stdAmount <= 0) throw new Error(i18next.t('text.std_amount_should_be_positive'))

    const packageQty = Number(this.requiredPackageQtyInput.value)
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

  async repack() {
    try {
      this._checkRepackable()
      await client.query({
        query: gql`
          mutation {
            repackaging(${gqlBuilder.buildArgs({
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

  async undoRepack(worksheetDetailName, palletId) {
    try {
      await client.query({
        query: gql`
          mutation {
            undoRepackaging(${gqlBuilder.buildArgs({
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

  _checkRepackable() {
    if (!this.palletIdInput.value) {
      this.palletIdInput.select()
      throw new Error(i18next.t('text.pallet_id_is_empty'))
    }

    if (!this.locationInput.value) {
      this.locationInput.select()
      throw new Error(i18next.t('text.location_code_is_empty'))
    }

    const packageQty = Number(this.packageQtyInput.value)

    if (!packageQty || packageQty <= 0) {
      this.packageQtyInput.select()
      throw new Error(i18next.t('text.package_qty_should_be_positive'))
    }

    const requiredPackageQty = this._getOperationGuideData('requiredPackageQty')
    if (packageQty > requiredPackageQty) throw new Error(i18next.t('text.package_qty_is_exceed_required_package_qty'))
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
