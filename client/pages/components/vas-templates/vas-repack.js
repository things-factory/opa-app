import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../image-viewer'
import { PACKING_UNITS, PACKING_UNIT_QTY, PACKING_UNIT_WEIGHT } from './constants'
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
      `
    ]
  }

  static get properties() {
    return {
      record: Object,
      targetInfo: Object,
      packingTypes: Array
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

            <label>${i18next.t('label.packing_amount')}</label>
            <input
              required
              type="number"
              name="packing-amount"
              min="1"
              value="${this._getOperationGuideData('packingAmount') || ''}"
              ?disabled="${!this._isEditable}"
            />
          </fieldset>
        </form>
      </div>
    `
  }

  constructor() {
    super()
    this.packingTypes = []
  }

  async firstUpdated() {
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

  get packingAmountInput() {
    return this.shadowRoot.querySelector('input[name=packing-amount]')
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
      packingAmount: Number(this.packingAmountInput.value) || ''
    }
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

    const packingAmount = Number(this.packingAmountInput.value)
    if (packingAmount <= 0) throw new Error(i18next.t('text.packing_amount_should_be_positive'))

    const packingUnit = this.packingUnitSelector.value

    if (packingUnit === PACKING_UNIT_QTY.value) {
      if (this.targetInfo.qty && stdAmount * packingAmount > this.targetInfo.qty)
        throw new Error(i18next.t('text.qty_exceed_limit'))
    } else if (packingUnit === PACKING_UNIT_WEIGHT.value) {
      if (this.targetInfo.weight && stdAmount * packingAmount > this.targetInfo.weight) {
        throw new Error(i18next.t('text.weight_exceed_limit'))
      }
    }
  }
}

window.customElements.define('vas-repack', VasRepack)
