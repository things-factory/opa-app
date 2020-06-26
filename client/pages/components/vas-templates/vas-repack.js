import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { PACKING_UNITS, PACKING_UNIT_QTY, PACKING_UNIT_WEIGHT } from './constants'
import { VasTemplate } from './vas-template'
import { WORKSHEET_STATUS } from '../../inbound/constants/worksheet'

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

            ${this._getOperationGuideData('packingUnit') === PACKING_UNIT_QTY.value
              ? html` <label>${i18next.t('label.required_package_qty')}</label> `
              : html` <label>${i18next.t('label.required_package_weight')}</label> `}

            <input
              readonly
              type="number"
              name="required-package-qty"
              value="${this._getOperationGuideData('requiredPackageQty') || 0}"
            />
          </fieldset>
        </form>

        ${this.isExecuting
          ? html`
              <form
                id="input-form"
                class="single-column-form"
                @submit="${e => e.preventDefault()}"
                @keypress="${e => {
                  if (e.keyCode === 13) this.repack()
                }}"
              >
                <fieldset>
                  <label>${i18next.t('label.package_qty')}</label>
                  <input
                    name="package-qty"
                    type="number"
                    min="1"
                    max="${this._getOperationGuideData('requiredPackageQty')}"
                    value="1"
                  />

                  <label>${i18next.t('label.from_pallet')}</label>
                  <barcode-scanable-input name="from-pallet-id" custom-input></barcode-scanable-input>

                  <label>${i18next.t('label.to_pallet')}</label>
                  <barcode-scanable-input name="to-pallet-id" custom-input></barcode-scanable-input>

                  <label>${i18next.t('label.location')}</label>
                  <barcode-scanable-input name="location-name" custom-input></barcode-scanable-input>
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

  get packageQtyInput() {
    return this.shadowRoot.querySelector('input[name=package-qty]')
  }

  get toPalletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=to-pallet-id]').shadowRoot.querySelector('input')
  }

  get locationInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=location-name]').shadowRoot.querySelector('input')
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
      list: { fields: ['palletId', 'locationName', 'qty'] },
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
          name: 'qty',
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
    this.isExecuting = !this.record.completed
    if (this.isExecuting) {
      this.inputForm.reset()
      if (this.record.palletId) {
        this.fromPalletIdInput.value = this.record.palletId
        this.fromPalletIdInput.setAttribute('readonly', true)
        this.toPalletIdInput.focus()
      } else {
        this.fromPalletIdInput.value = ''
        this.fromPalletIdInput.focus()
      }
      this.toPalletIdInput.value = ''
      this.locationInput.value = ''
      this.palletData = { records: this._formatPalletData(this.record.operationGuide.data.repackedInvs) }
    }
  }

  _formatPalletData(repakcedInvs = []) {
    return repakcedInvs.reduce((result, repackedInv) => {
      if (result.find(item => item.palletId === repackedInv.palletId)) {
        result = result.map(item => {
          return {
            ...item,
            qty: item.repackedPkgQty + repackedInv.repackedPkgQty
          }
        })
      } else {
        result.push({
          ...repackedInv,
          qty: repackedInv.repackedPkgQty
        })
      }

      return result
    }, [])
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
    try {
      const packingUnit = this.packingUnitSelector.value
      const stdAmount = parseInt(this.stdAmountInput.value)
      if (packingUnit === PACKING_UNIT_QTY.value) {
        if (this.targetInfo.qty % stdAmount) throw new Error(i18next.t('text.qty_cannot_be_divided_completely'))
        this.requiredPackageQtyInput.value = this.targetInfo.qty / stdAmount
      } else {
        if (this.targetInfo.weight % stdAmount) throw new Error(i18next.t('text.weight_cannot_be_divided_completely'))
        this.requiredPackageQtyInput.value = this.targetInfo.weight / stdAmount
      }
    } catch (e) {
      this.requiredPackageQtyInput.value = ''
      this._showToast(e)
    }
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
              fromPalletId: this.fromPalletIdInput.value,
              toPalletId: this.toPalletIdInput.value,
              locationName: this.locationInput.value,
              packageQty: parseInt(this.packageQtyInput.value)
            })})
          }
        `
      })

      this.dispatchEvent(new CustomEvent('completed'))
    } catch (e) {
      this._showToast(e)
    }
  }

  async undoRepack(worksheetDetailName, toPalletId) {
    try {
      await client.query({
        query: gql`
          mutation {
            undoRepackaging(${gqlBuilder.buildArgs({
              worksheetDetailName,
              fromPalletId: this.fromPalletIdInput.value,
              toPalletId
            })})
          }
        `
      })
      this.dispatchEvent(new CustomEvent('completed'))
    } catch (e) {
      this._showToast(e)
    }
  }

  _checkRepackable() {
    if (!this.packageQtyInput.checkValidity()) {
      this.packageQtyInput.value = 1
      this.packageQtyInput.select()
      throw new Error(i18next.t('text.invalid_quantity_input'))
    }

    if (!this.fromPalletIdInput.value) {
      this.fromPalletIdInput.focus()
      throw new Error(i18next.t('text.from_pallet_id_is_emplty'))
    }

    if (!this.toPalletIdInput.value) {
      this.toPalletIdInput.focus()
      throw new Error(i18next.t('text.to_pallet_id_is_empty'))
    }

    if (!this.locationInput.value) {
      // location에 값이 없을 경우 기존에 추가된 팔렛에 현재 추가하려는 팔렛이 있는지 확인하고
      // 만약 있다면 기존 로케이션을 유지하는 것으로 간주하여 valid
      // 없다면 로케이션을 필수로 입력해야 하기 때문에 invalid
      if (
        this.palletData?.records &&
        this.palletData.records.find(record => record.palletId === this.toPalletIdInput.value)
      ) {
        const samePalletRecord = this.palletData.records.find(record => record.palletId === this.toPalletIdInput.value)
        this.locationInput.value = samePalletRecord.locationName
      } else {
        this.locationInput.select()
        throw new Error(i18next.t('text.location_code_is_empty'))
      }
    }
  }

  checkExecutionValidity() {
    try {
      if (this._getOperationGuideData('requiredPackageQty') > 0) {
        throw new Error(i18next.t('text.vas_is_not_completed_yet'))
      }
    } catch (e) {
      this._showToast(e)
    }
  }
}

window.customElements.define('vas-repack', VasRepack)
