import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { PALLET_TYPES, REUSABLE_PALLET } from '../../constants'
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
                >
                  ${PALLET_TYPE.display}
                </option>
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

          <label for="std-qty-input">${i18next.t('label.std_qty_in_single_pallet')}</label>
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
            value="${this._getOperationGuideData('requiredPalletQty', 0)}"
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
                if (e.keyCode === 13) this.repallet()
              }}"
            >
              <fieldset>
                <label>${i18next.t('label.from_pallet')}</label>
                <barcode-scanable-input name="from-pallet-id" custom-input></barcode-scanable-input>

                <label>${i18next.t('label.to_pallet')}</label>
                <barcode-scanable-input name="to-pallet-id" custom-input></barcode-scanable-input>

                <label>${i18next.t('label.location')}</label>
                <barcode-scanable-input name="location-name" custom-input></barcode-scanable-input>
              </fieldset>
            </form>
          `
        : ''}
      ${this.isExecuting || this.record?.completed
        ? html` <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config="${this.config}"
            .data="${this.palletData}"
          >
          </data-grist>`
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

  get toPalletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=to-pallet-id]').shadowRoot.querySelector('input')
  }

  get locationInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=location-name]').shadowRoot.querySelector('input')
  }

  get packageQtyInput() {
    return this.shadowRoot.querySelector('input[name=package-qty]')
  }

  constructor() {
    super()
    this.config = {}
    this.palletData = { records: [] }
  }

  async firstUpdated() {
    await this.updateComplete
    this.palletType = this._getOperationGuideData('palletType') || this.palletTypeSelector.value

    if (this.isExecuting || this.record?.completed) {
      this._initExecutingConfig(this.record.completed)
    }
  }

  _initExecutingConfig(isCompleted) {
    let gutters = [{ type: 'gutter', gutterName: 'sequence' }]
    if (!isCompleted) {
      this.locationInput.addEventListener('change', this._checkLocationValidity.bind(this))
      gutters.push({
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
      })
    }

    this.config = {
      rows: { appendable: false },
      pagination: { infinite: true },
      list: { fields: ['fromPalletId', 'palletId', 'locationName', 'qty', 'uomValue'] },
      columns: [
        ...gutters,
        {
          type: 'string',
          name: 'fromPalletId',
          header: i18next.t('field.from_pallet'),
          width: 180
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.repalletized_pallet'),
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
        },
        {
          type: 'integer',
          name: 'uomValue',
          header: i18next.t('field.uom_value'),
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
    }

    if (this.isExecuting || this.record.completed) {
      this.palletData = { records: this._formatPalletData(this.record.operationGuide.data.repalletizedInvs) }
    }
  }

  _formatPalletData(repalletizedInvs = []) {
    if (!this.record.palletId) return []

    return repalletizedInvs
      .map(ri => {
        return {
          ...ri,
          fromPalletId: this.record.palletId,
          ...ri.repalletizedFrom
            .filter(rf => rf.fromPalletId === this.record.palletId)
            .reduce(
              (amount, rf) => {
                amount.qty += rf.reducedQty
                amount.uomValue += rf.reducedUomValue
                return amount
              },
              { qty: 0, uomValue: 0 }
            )
        }
      })
      .filter(ri => ri.qty)
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

    if (stdQty <= 0) {
      this.stdQtyInput.value = 1
      this.stdQtyInput.focus()
      throw new Error(i18next.t('text.qty_should_be_positive'))
    }
    if (!stdQty) {
      this.stdQtyInput.value = 1
      this.stdQtyInput.focus()
      throw new Error(i18next.t('text.invalid_quantity_input'))
    }
    if (stdQty > this.targetInfo.qty) {
      this.stdQtyInput.value = this.targetInfo.qty
      this.stdQtyInput.focus()
      throw new Error(i18next.t('text.qty_exceed_limit'))
    }

    if (this.targetInfo.qty % stdQty) {
      this.stdQtyInput.value = 1
      this.stdQtyInput.focus()
      throw new Error(i18next.t('text.qty_cannot_be_divided_completely'))
    }
  }

  adjustPalletQty() {
    const stdQty = Number(this.stdQtyInput.value)
    let maxPalletQtyByStd = this.targetInfo.qty / stdQty

    if (maxPalletQtyByStd < 0) {
      this.stdQtyInput.value = ''
      maxPalletQtyByStd = ''
      this.stdQtyInput.focus()
      this._showToast({ message: i18next.t('text.qty_should_be_positive') })
    } else if (this.palletType === REUSABLE_PALLET.value) {
      const availablePalletQty = Number(this.availablePalletQtyInput.value)

      if (availablePalletQty < maxPalletQtyByStd) {
        this.stdQtyInput.value = ''
        maxPalletQtyByStd = ''
        this.stdQtyInput.focus()
        this._showToast({ message: i18next.t('text.reusable_pallet_is_not_enough') })
      }
    }

    this.requiredPalletQtyInput.value = maxPalletQtyByStd
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
                name: 'inventory',
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
      this._checkRepalletizable()
      await client.query({
        query: gql`
          mutation {
            repalletizing(${gqlBuilder.buildArgs({
              worksheetDetailName: this.record.name,
              fromPalletId: this.fromPalletIdInput.value,
              toPalletId: this.toPalletIdInput.value,
              locationName: this.locationInput.value
            })})
          }
        `
      })

      this.dispatchEvent(
        new CustomEvent('completed', {
          bubbles: true,
          composed: true
        })
      )
    } catch (e) {
      this._showToast(e)
    }
  }

  async undoRepallet(worksheetDetailName, toPalletId) {
    try {
      await client.query({
        query: gql`
          mutation {
            undoRepalletizing(${gqlBuilder.buildArgs({
              worksheetDetailName,
              fromPalletId: this.fromPalletIdInput.value,
              toPalletId
            })})
          }
        `
      })

      this.dispatchEvent(
        new CustomEvent('completed', {
          bubbles: true,
          composed: true
        })
      )
    } catch (e) {
      this._showToast(e)
    }
  }

  _checkRepalletizable() {
    if (!this.fromPalletIdInput.value) {
      this.fromPalletIdInput.select()
      throw new Error(i18next.t('text.from_pallet_id_is_emplty'))
    }

    if (!this.toPalletIdInput.value) {
      this.toPalletIdInput.select()
      throw new Error(i18next.t('text.to_pallet_id_is_empty'))
    }

    const stdQty = this._getOperationGuideData('stdQty')
    const toPalleId = this.toPalletIdInput.value
    const foundPallet = this._getOperationGuideData('repalletizedInvs', []).find(ri => ri.palletId === toPalleId)
    if (foundPallet?.repalletizedFrom?.length) {
      const totalQty = foundPallet.repalletizedFrom.reduce((totalQty, rf) => {
        totalQty += rf.reducedQty
        return totalQty
      }, 0)

      if (totalQty && totalQty >= stdQty) {
        this.toPalletIdInput.value = ''
        this.toPalletIdInput.focus()
        throw new Error(i18next.t('text.qty_exceed_limit'))
      }
    }

    const nonCompletedPalletQty = this._getOperationGuideData('repalletizedInvs', [])
      .filter(ri => ri.repalletizedFrom.reduce((qty, rf) => (qty += rf.reducedQty), 0) < stdQty)
      .map(ri => ri.palletId)
      .concat(toPalleId)
      .filter((palletId, idx, palletIds) => palletIds.indexOf(palletId) === idx).length

    if (nonCompletedPalletQty > this._getOperationGuideData('requiredPalletQty')) {
      this.toPalletIdInput.select()
      throw new Error(i18next.t('text.qty_exceed_limit'))
    }

    if (!this.locationInput.value) {
      // location에 값이 없을 경우 기존에 추가된 팔렛에 현재 추가하려는 팔렛이 있는지 확인하고
      // 만약 있다면 기존 로케이션을 유지하는 것으로 간주하여 valid
      // 없다면 로케이션을 필수로 입력해야 하기 때문에 invalid

      if (
        this.record.operationGuide.data?.repalletizedInvs &&
        this.record.operationGuide.data.repalletizedInvs.find(ri => ri.palletId === this.toPalletIdInput.value)
      ) {
        const samePallet = this.record.operationGuide.data.repalletizedInvs.find(
          ri => ri.palletId === this.toPalletIdInput.value
        )
        this.locationInput.value = samePallet.locationName
      } else {
        this.locationInput.select()
        throw new Error(i18next.t('text.location_code_is_empty'))
      }
    }
  }

  checkExecutionValidity() {
    if (this._getOperationGuideData('requiredPalletQty' > 0)) {
      throw new Error(i18next.t('text.repalletizing_is_not_completed'))
    }
  }
}

customElements.define('vas-repalletizing', VasRepalletizing)
