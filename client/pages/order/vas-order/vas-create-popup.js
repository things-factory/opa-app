import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import '@things-factory/import-ui'
import { isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import { css, html, LitElement } from 'lit-element'
import '../../components/vas-relabel'
import { BATCH_NO_TYPE, ETC_TYPE, PRODUCT_TYPE, TARGET_TYPES } from '../constants'

export class VasCreatePopup extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      MultiColumnFormStyles,
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .grist-container {
          overflow-y: hidden;
          display: flex;
          flex: 1;
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

  static get properties() {
    return {
      selectedTargetType: String,
      selectedTarget: String,
      selectedPackingType: String,
      vasGristConfig: Object,
      vasGristData: Object,
      targetBatchList: Array,
      targetProductList: Array,
      record: Object,
      _template: Object
    }
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('#vas-grist')
  }

  get targetForm() {
    return this.shadowRoot.querySelector('form')
  }

  get targetSelector() {
    return this.shadowRoot.querySelector('#target-selector')
  }

  get packingTypeSelector() {
    return this.shadowRoot.querySelector('#packing-type-selector')
  }

  get qtyInput() {
    return this.shadowRoot.querySelector('input#qty-input')
  }

  render() {
    return html`
      <form class="multi-column-form" @submit="${e => e.preventDefault()}">
        <fieldset>
          <legend>${i18next.t('title.target')}</legend>
          <label>${i18next.t('label.target_type')}</label>
          <select
            required
            @change="${e => {
              this.selectedTargetType = e.currentTarget.value
            }}"
          >
            ${TARGET_TYPES.map(
              type =>
                html`
                  <option value="${type.value}" ?selected="${this.record && this.record.targetType === type.value}"
                    >${type.display}</option
                  >
                `
            )}
          </select>

          ${this.selectedTargetType === BATCH_NO_TYPE
            ? html`
                <label>${i18next.t('label.target')}</label>
                <select
                  id="target-selector"
                  required
                  @change="${e => {
                    this.selectedTarget = this.targetBatchList.find(batch => batch.value === e.currentTarget.value)
                    this._checkQtyValidity.bind(this)
                  }}"
                >
                  <option></option>
                  ${this.targetBatchList.map(
                    batch =>
                      html`
                        <option value="${batch.value}" ?selected="${this.record && this.record.target === batch.value}"
                          >${batch.display}</option
                        >
                      `
                  )}
                </select>
              `
            : this.selectedTargetType === PRODUCT_TYPE
            ? html`
                <label>${i18next.t('label.target')}</label>
                <select
                  id="target-selector"
                  required
                  @change="${e => {
                    this.selectedTarget = this.targetProductList.find(prod => prod.value === e.currentTarget.value)
                    this._checkQtyValidity.bind(this)
                  }}"
                >
                  <option></option>
                  ${this.targetProductList.map(
                    product =>
                      html`
                        <option
                          value="${product.value}"
                          ?selected="${this.record && this.record.target === product.value}"
                          >${product.display}</option
                        >
                      `
                  )}
                </select>
              `
            : this.selectedTargetType === ETC_TYPE
            ? html`
                <label>${i18next.t('label.target')}</label>
                <input id="target-selector" required value="${(this.record && this.record.target) || ''}" />
              `
            : ''}
          ${this.selectedTarget && this.selectedTarget.packingTypes && this.selectedTarget.packingTypes.length
            ? html`
                <label>${i18next.t('label.packing_type')}</label>
                <select
                  id="packing-type-selector"
                  ?required="${this.selectedTargetType !== ETC_TYPE}"
                  @change="${e => {
                    this.selectedPackingType = e.currentTarget.value
                  }}"
                >
                  <option></option>
                  ${this.selectedTarget.packingTypes.map(
                    packingType =>
                      html`
                        <option
                          value="${packingType.type}"
                          ?selected="${this.record && this.record.packingType === packingType.type}"
                          >${packingType.type}</option
                        >
                      `
                  )}
                </select>
              `
            : ''}
          ${this.selectedTargetType !== ETC_TYPE
            ? html`
                <label>${i18next.t('label.qty')}</label>
                <input
                  id="qty-input"
                  type="number"
                  min="1"
                  ?required="${this.selectedTargetType !== ETC_TYPE}"
                  value="${(this.record && this.record.qty) || 1}"
                  @change="${this._checkQtyValidity.bind(this)}"
                />
              `
            : ''}
        </fieldset>
      </form>

      <div class="grist-container">
        <div class="grist">
          <h2>${i18next.t('title.vas')}</h2>
          <data-grist
            id="vas-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.vasGristConfig}
            .data="${this.vasGristData}"
            @field-change="${this._onFieldChange.bind(this)}"
          ></data-grist>
        </div>
      </div>

      <div class="guide-container">
        ${this._template}
      </div>

      <div class="button-container">
        ${this._template
          ? html`
              <button
                @click="${async e => {
                  const copied = Object.assign(this.vasGrist.dirtyData, {})
                  try {
                    this.vasGristData = {
                      ...this.vasGrist.dirtyData,
                      records: await Promise.all(
                        this.vasGrist.dirtyData.records.map(async (record, idx) => {
                          if (idx === this._selectedVasRecordIdx) {
                            record.operationGuide = await this._template.adjust()
                            record.ready = this._isReadyToCreate(record)
                          }
                          return record
                        })
                      )
                    }
                  } catch (e) {
                    this._showToast(e)
                    this.vasGristData = Object.assign(copied)
                  }
                }}"
              >
                ${i18next.t('button.adjust')}
              </button>
            `
          : ''}
        <button
          @click=${() => {
            history.back()
          }}
        >
          ${i18next.t('button.cancel')}
        </button>
        <button
          @click="${() => {
            try {
              this._checkValidity()
              this.dispatchEvent(
                new CustomEvent('completed', {
                  detail: {
                    ready: true,
                    targetType: this.selectedTargetType,
                    targetDisplay:
                      this.selectedTargetType === ETC_TYPE
                        ? this.targetSelector.value
                        : this.targetSelector.selectedOptions[0].innerText,
                    target: this.targetSelector.value,
                    packingType: (this.packingTypeSelector && this.packingTypeSelector.value) || null,
                    qty: (this.qtyInput && Number(this.qtyInput.value)) || null,
                    vasCount: this.vasGrist.dirtyData.records.length,
                    orderVass: this.vasGrist.dirtyData.records
                  }
                })
              )
              history.back()
            } catch (e) {
              this._showToast(e)
            }
          }}"
        >
          ${i18next.t('button.confirm')}
        </button>
      </div>
    `
  }

  constructor() {
    super()
    this.vasGristData = { records: [] }
    this.targetBatchList = [{ display: i18next.t('text.there_is_no_selectable_item'), value: '' }]
    this.targetProductList = [{ display: i18next.t('text.there_is_no_selectable_item'), value: '' }]
  }

  async firstUpdated() {
    this.vasGristConfig = {
      list: { fields: ['ready', 'vas', 'batchId', 'remark'] },
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true },
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.vas && record.vas.operationGuideType === 'template' && record.vas.operationGuide) {
              this._template = document.createElement(record.vas.operationGuide)
              this._template.record = record
              this._template.operationGuide = record.operationGuide
            } else {
              this._template = null
            }
            this._selectedVasRecord = record
            this._selectedVasRecordIdx = rowIndex
          }
        }
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.vasGristData = { ...this.vasGristData, records: data.records.filter((_, idx) => idx !== rowIndex) }
            }
          }
        },
        {
          type: 'boolean',
          name: 'ready',
          header: i18next.t('field.ready'),
          width: 40
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'vass',
              select: [
                { name: 'id', hidden: true },
                { name: 'name', width: 160 },
                { name: 'description', width: 200 },
                { name: 'operationGuide', hidden: true },
                { name: 'operationGuideType', hidden: true }
              ],
              list: { fields: ['name', 'description'] }
            }
          },
          width: 250
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true },
          width: 300
        }
      ]
    }

    if (this.record && this.record.orderVass && this.record.orderVass.length) {
      this.selectedTargetType = this.record.targetType
      this.selectedTarget =
        this.selectedTargetType === BATCH_NO_TYPE
          ? this.targetBatchList.find(batch => batch.value === this.record.target)
          : this.selectedTargetType === PRODUCT_TYPE
          ? this.targetProductList.find(product => product.value === this.record.target)
          : null
      this.vasGristData = { records: this.record.orderVass }
    }
  }

  _onFieldChange() {
    this.vasGristData = {
      ...this.vasGrist.dirtyData,
      records: this.vasGrist.dirtyData.records.map(record => {
        return {
          ...record,
          ready: this._isReadyToCreate(record)
        }
      })
    }
  }

  _isReadyToCreate(record) {
    if (record.vas && record.vas.operationGuideType) {
      return Boolean(record.operationGuide && record.remark)
    } else if (record.vas && !record.vas.operationGuideType) {
      return Boolean(record.vas && record.remark)
    } else {
      return false
    }
  }

  _checkValidity() {
    // Target form validity checking
    if (!this.targetForm.checkValidity()) throw new Error(i18next.t('text.invalid_form'))

    // Vas grist validity checking
    if (this.vasGrist.dirtyData.records.length == 0) throw new Error(i18next.t('text.there_is_no_vas'))
    if (this.vasGrist.dirtyData.records.some(record => !record.ready))
      throw new Error(i18next.t('text.invalid_vas_setting'))
  }

  _checkQtyValidity() {
    try {
      const qty = Number(this.qtyInput.value)
      let packQty
      if (qty <= 0) {
        this.qtyInput.value = 1
        throw new Error('text.qty_should_be_positive')
      }

      const selectedTarget = this.targetSelector.value
      const selectedPackingType = this.packingTypeSelector.value

      if (selectedPackingType) {
        packQty = this.selectedTarget.packingTypes.find(packingType => packingType.type === this.selectedPackingType)
          .packQty
      }

      if (packQty && qty > packQty) {
        this.qtyInput.value = packQty
        throw new Error(i18next.t('text.qty_exceed_limit'))
      }
    } catch (e) {
      this._showToast(e)
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

window.customElements.define('vas-create-popup', VasCreatePopup)
