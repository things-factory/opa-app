import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import '@things-factory/import-ui'
import { isMobileDevice } from '@things-factory/utils'
import { css, html, LitElement } from 'lit-element'
import '../../../components/vas-templates'
import { VAS_BATCH_AND_PRODUCT_TYPE, VAS_BATCH_NO_TYPE, VAS_ETC_TYPE, VAS_PRODUCT_TYPE } from '../../constants'
import './vas-create-batch-product-type-form'
import './vas-create-batch-type-form'
import './vas-create-etc-type-form'
import './vas-create-product-type-form'

export class VasCreatePopup extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      MultiColumnFormStyles,
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
      selectedPackingType: String,
      vasGristConfig: Object,
      vasGristData: Object,
      targetList: Array,
      vasList: Array,
      record: Object,
      _template: Object
    }
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('#vas-grist')
  }

  get targetTypeForm() {
    return this.shadowRoot.querySelector('form#target-type')
  }

  get batchTypeInput() {
    return this.shadowRoot.querySelector('input#batchId')
  }

  get productTypeInput() {
    return this.shadowRoot.querySelector('input#product')
  }

  get etcTypeInput() {
    return this.shadowRoot.querySelector('input#etc')
  }

  get targetForm() {
    return this.shadowRoot.querySelector('.vas-create-form')
  }

  get targetInfo() {
    if (this.targetForm && this.targetForm.checkValidity()) {
      return {
        targetType: this.selectedTargetType,
        targetDisplay: this.targetForm.targetDisplay,
        target: this.targetForm.target,
        packingType: this.targetForm.selectedPackingType,
        qty: (this.targetForm.qty && parseInt(this.targetForm.qty)) || '',
        weight: (this.targetForm.weight && parseFloat(this.targetForm.weight)) || ''
      }
    }
  }

  render() {
    return html`
      <form id="target-type" class="multi-column-form" @change="${this._onTypeFormchangeHandler}">
        <fieldset>
          <legend>${i18next.t('label.target_type')}</legend>

          <input
            id="batchId"
            type="checkbox"
            name="batchId"
            ?checked="${(this.record && this.record.targetType === VAS_BATCH_NO_TYPE) ||
            this.record.targetType === VAS_BATCH_AND_PRODUCT_TYPE}"
          />
          <label for="batchId">${i18next.t('label.batch_id')}</label>

          <input
            id="product"
            type="checkbox"
            name="product"
            ?checked="${(this.record && this.record.targetType === VAS_PRODUCT_TYPE) ||
            this.record.targetType === VAS_BATCH_AND_PRODUCT_TYPE}"
          />
          <label for="product">${i18next.t('label.product')}</label>

          <input
            id="etc"
            type="checkbox"
            name="etc"
            ?checked="${this.record && this.record.targetType === VAS_ETC_TYPE}"
          />
          <label for="etc">${i18next.t('label.etc')}</label>
        </fieldset>
      </form>

      ${this.selectedTargetType === VAS_BATCH_NO_TYPE
        ? html`
            <vas-create-batch-type-form
              class="vas-create-form"
              .targetList="${this.targetList}"
              .vasList="${this.vasList}"
              .record="${this.record}"
              @form-change="${this.resetVasTemplates}"
            ></vas-create-batch-type-form>
          `
        : this.selectedTargetType === VAS_PRODUCT_TYPE
        ? html`
            <vas-create-product-type-form
              class="vas-create-form"
              .targetList="${this.targetList}"
              .vasList="${this.vasList}"
              .record="${this.record}"
              @form-change="${this.resetVasTemplates}"
            ></vas-create-product-type-form>
          `
        : this.selectedTargetType === VAS_BATCH_AND_PRODUCT_TYPE
        ? html`
            <vas-create-batch-product-type-form
              class="vas-create-form"
              .targetList="${this.targetList}"
              .vasList="${this.vasList}"
              .record="${this.record}"
              @form-change="${this.resetVasTemplates}"
            ></vas-create-batch-product-type-form>
          `
        : this.selectedTargetType === VAS_ETC_TYPE
        ? html`
            <vas-create-etc-type-form
              class="vas-create-form"
              .record="${this.record}"
              @form-change="${this.resetVasTemplates}"
            ></vas-create-etc-type-form>
          `
        : ''}
      ${this.selectedTargetType
        ? html`
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
          `
        : ''}

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
        <button @click="${this.confirmHandler.bind(this)}">
          ${i18next.t('button.confirm')}
        </button>
      </div>
    `
  }

  constructor() {
    super()
    this.vasGristData = { records: [] }
  }

  updated(changedProps) {
    if (changedProps.has('selectedTargetType')) {
      this._template = null
      this.setVasQueryFilter()
    }
  }

  async firstUpdated() {
    this.vasGristConfig = {
      list: { fields: ['ready', 'vas', 'batchId', 'remark'] },
      pagination: { infinite: true },
      rows: {
        selectable: { multiple: true },
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (!this.targetInfo) {
              this._showToast({
                message: i18next.t('text.vas_target_does_not_specified')
              })

              return
            }

            if (record && record.vas && record.vas.operationGuideType === 'template' && record.vas.operationGuide) {
              this._template = document.createElement(record.vas.operationGuide)
              this._template.record = record
              this._template.targetInfo = this.targetInfo
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
              this.setVasQueryFilter()
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
      this.vasGristData = { records: this.record.orderVass }
    }
  }

  _onTypeFormchangeHandler(e) {
    const input = e.target
    if (input.name === 'etc') {
      const checked = input.checked
      this.targetTypeForm.reset()
      input.checked = checked
    } else {
      this.etcTypeInput.checked = false
    }

    const isBatchIdType = this.batchTypeInput.checked
    const isProductType = this.productTypeInput.checked
    const isEtcType = this.etcTypeInput.checked

    if (isBatchIdType && isProductType) {
      this.selectedTargetType = VAS_BATCH_AND_PRODUCT_TYPE
    } else if (isBatchIdType && !isProductType) {
      this.selectedTargetType = VAS_BATCH_NO_TYPE
    } else if (!isBatchIdType && isProductType) {
      this.selectedTargetType = VAS_PRODUCT_TYPE
    } else if (isEtcType) {
      this.selectedTargetType = VAS_ETC_TYPE
    } else {
      this.selectedTargetType = undefined
    }

    this.vasGristData = { records: [] }
  }

  _onFieldChange(e) {
    if (e.detail.column.name === 'vas') {
      this._template = null
      delete this.vasGrist.dirtyData.records[e.detail.row].operationGuide
    }

    this.vasGristData = {
      ...this.vasGrist.dirtyData,
      records: this.vasGrist.dirtyData.records.map(record => {
        return {
          ...record,
          ready: this._isReadyToCreate(record)
        }
      })
    }

    this.setVasQueryFilter()
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

  confirmHandler() {
    try {
      this._checkValidity()
      this.dispatchEvent(
        new CustomEvent('completed', {
          detail: {
            ...this.targetInfo,
            ready: true,
            vasCount: this.vasGrist.dirtyData.records.length,
            orderVass: this.vasGrist.dirtyData.records
          }
        })
      )
      history.back()
    } catch (e) {
      this._showToast(e)
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

  resetVasTemplates() {
    this._template = null

    this.vasGrist.data = {
      ...this.vasGrist.data,
      records: this.vasGrist.data.records.map(record => {
        if (record && record.operationGuide) {
          delete record.operationGuide
          record.ready = false
        }

        return record
      })
    }
  }

  async setVasQueryFilter() {
    if (!this.selectedTargetType) return
    await this.updateComplete

    let vasIds = []
    if (this.vasGristData && this.vasGristData.records && this.vasGristData.records.length) {
      vasIds = this.vasGristData.records.filter(record => record.vas && record.vas.id).map(record => record.vas.id)
    }

    switch (this.selectedTargetType) {
      case VAS_BATCH_AND_PRODUCT_TYPE:
        this.vasGristConfig = {
          ...this.vasGristConfig,
          columns: this.vasGristConfig.columns.map(column => {
            if (column.name === 'vas') {
              if (vasIds.length) {
                column.record.options.basicArgs = {
                  filters: [{ name: 'id', operator: 'notin', value: vasIds }]
                }
              } else {
                delete column.record.options.basicArgs
              }
              return column
            } else {
              return column
            }
          })
        }

        break
      default:
        this.vasGristConfig = {
          ...this.vasGristConfig,
          columns: this.vasGristConfig.columns.map(column => {
            if (column.name === 'vas') {
              if (vasIds.length) {
                column.record.options.basicArgs = {
                  filters: [
                    {
                      name: 'operationGuide',
                      operator: 'notin_with_null',
                      value: ['vas-repack', 'vas-repalletizing', 'vas-relabel']
                    },
                    { name: 'id', operator: 'notin', value: vasIds }
                  ]
                }
              } else {
                column.record.options.basicArgs = {
                  filters: [
                    {
                      name: 'operationGuide',
                      operator: 'notin_with_null',
                      value: ['vas-repack', 'vas-repalletizing', 'vas-relabel']
                    }
                  ]
                }
              }
              return column
            } else {
              return column
            }
          })
        }
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
