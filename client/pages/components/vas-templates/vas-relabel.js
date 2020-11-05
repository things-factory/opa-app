import '@things-factory/barcode-ui'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_TYPES, ORDER_VAS_STATUS, WORKSHEET_STATUS } from '../../constants'
import '../image-viewer'
import { VasTemplate } from './vas-template'

class VasRelabel extends localize(i18next)(VasTemplate) {
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
          margin: 0px 20px;
          flex: 1;
        }
        .label-preview {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        image-viewer {
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
      orderType: String,
      config: Object,
      palletData: Object
    }
  }

  render() {
    return html`
      <div class="container">
        <form class="single-column-form" @submit="${e => e.preventDefault()}">
          <fieldset>
            <legend>${i18next.t('title.relabel')}</legend>
            ${(!this._isEditable && this.toBatchId) || this._isEditable
              ? html`
                  <label>${i18next.t('label.to_batch_id')}</label>
                  <input
                    name="batchId"
                    value="${this.toBatchId}"
                    @change="${e => (this._selectedBatchId = e.currentTarget.value)}"
                  />
                `
              : ''}
            ${(!this._isEditable && this.toProduct) || this._isEditable
              ? html`
                  <label>${i18next.t('label.to_product')}</label>
                  <input
                    readonly
                    name="product"
                    @click="${this._openProductPopup.bind(this)}"
                    value="${this.toProduct}"
                  />
                `
              : ''}

            <label ?hidden="${!this._isEditable}">${i18next.t('label.new_label')}</label>
            <file-uploader
              ?hidden="${!this._isEditable}"
              custom-input
              required
              name="newLabel"
              ._files="${this.newLabelFile}"
            ></file-uploader>
          </fieldset>
        </form>

        ${this.isExecuting
          ? html`
              <form
                id="input-form"
                class="single-column-form"
                @submit="${e => e.preventDefault()}"
                @keypress="${e => {
                  if (e.keyCode === 13) this.relabel()
                }}"
              >
                <fieldset>
                  <label>${i18next.t('label.from_pallet')}</label>
                  <barcode-scanable-input name="from-pallet-id" custom-input></barcode-scanable-input>

                  <label>${i18next.t('label.to_pallet')}</label>
                  <barcode-scanable-input name="to-pallet-id" custom-input></barcode-scanable-input>

                  ${this.orderType === ORDER_TYPES.VAS_ORDER.value
                    ? html`
                        <label>${i18next.t('label.location')}</label>
                        <barcode-scanable-input name="location-name" custom-input></barcode-scanable-input>
                      `
                    : ''}
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
        ${!this._isEditable && this._newLabelPath
          ? html`
              <div class="label-preview" ?hidden="${this._isEditable}">
                <image-viewer
                  name="${this._newLabelName}"
                  src="${this._newLabelPath}"
                  .downloadable="${this._isDownloadable}"
                ></image-viewer>
              </div>
            `
          : ''}
      </div>
    `
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get productInput() {
    return this.shadowRoot.querySelector('input[name=product]')
  }

  get newLabelInput() {
    return this.shadowRoot.querySelector('file-uploader[name=newLabel]')
  }

  get toProduct() {
    if (
      this.record &&
      this.record.operationGuide &&
      this.record.operationGuide.data &&
      this.record.operationGuide.data.toProduct
    ) {
      const toProduct = this.record.operationGuide.data.toProduct
      this._selectedProduct = toProduct
      return `${toProduct.name} ${toProduct.description ? `(${toProduct.description})` : ''}`
    } else {
      return ''
    }
  }

  get toBatchId() {
    if (
      this.record &&
      this.record.operationGuide &&
      this.record.operationGuide.data &&
      this.record.operationGuide.data.toBatchId
    ) {
      const toBatchId = this.record.operationGuide.data.toBatchId
      this._selectedBatchId = toBatchId
      return this._selectedBatchId
    } else {
      return ''
    }
  }

  get newLabelFile() {
    if (
      this.record &&
      this.record.operationGuide &&
      this.record.operationGuide.data &&
      this.record.operationGuide.data.newLabel &&
      this.record.operationGuide.data.newLabel.files &&
      this.record.operationGuide.data.newLabel.files.length
    ) {
      return this.record.operationGuide.data.newLabel.files
    }
  }

  get _isDownloadable() {
    return this.record.status !== WORKSHEET_STATUS.EXECUTING.value
  }

  get _newLabelName() {
    return (
      (this.record.operationGuide &&
        this.record.operationGuide &&
        this.record.operationGuide.data &&
        this.record.operationGuide.data.newLabel &&
        this.record.operationGuide.data.newLabel.name) ||
      ''
    )
  }

  get _newLabelPath() {
    return (
      (this.record.operationGuide &&
        this.record.operationGuide.data &&
        this.record.operationGuide.data.newLabel &&
        this.record.operationGuide.data.newLabel.path &&
        `${location.origin}/attachment/${this.record.operationGuide.data.newLabel.path}`) ||
      ''
    )
  }

  get toPalletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=to-pallet-id]').shadowRoot.querySelector('input')
  }

  get locationInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=location-name]').shadowRoot.querySelector('input')
  }

  get transactions() {
    return [this.createNewLabel.bind(this)]
  }

  get revertTransactions() {
    return [this.deleteNewLabel.bind(this)]
  }

  get data() {
    return {
      toProduct: this._selectedProduct,
      toBatchId: this._selectedBatchId,
      newLabel: {
        files: this.newLabelInput.files
      }
    }
  }

  constructor() {
    super()
    this.config = {}
    this.palletData = { records: [] }
  }

  async firstUpdated() {
    await this.updateComplete
    if (this.isExecuting) {
      this._initExecutingConfig()
    }
  }

  _initExecutingConfig() {
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
                text: i18next.t('text.undo_relabeling'),
                confirmButton: { text: i18next.t('button.confirm') },
                cancelButton: { text: i18next.t('button.cancel') }
              })

              if (!result.value) {
                return
              }

              this.undoRelabel(this.record.name, record.palletId)
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
      if (this.orderType === ORDER_TYPES.VAS_ORDER.value) {
        this.locationInput.value = ''
      }
      this.palletData = {
        records: this._formatPalletData(this.record.operationGuide.data.relabeledFrom, this.record.palletId)
      }
    }
  }

  _formatPalletData(relabeldFrom = [], palletId) {
    return relabeldFrom
      .filter(rf => rf.fromPalletId === palletId)
      .map(rf => {
        return {
          palletId: rf.toPalletId,
          locationName: rf.locationName,
          qty: rf.reducedQty
        }
      })
  }

  _openProductPopup() {
    if (!this._isEditable) return
    if (this.record.status === ORDER_VAS_STATUS.PENDING.value) return
    const queryName = 'products'
    const basicArgs = {
      filters: [{ name: 'id', operator: 'noteq', value: this.targetInfo.target.productId }]
    }
    const confirmCallback = selected => {
      this._selectedProduct = selected
      if (this._selectedProduct) {
        this.productInput.value = `${this._selectedProduct.name} ${
          this._selectedProduct.description ? `(${this._selectedProduct.description})` : ''
        }`
      } else {
        this.productInput.value = ''
      }
    }
    openPopup(
      html`
        <object-selector
          .queryName="${queryName}"
          .basicArgs="${basicArgs}"
          .value="${(this._selectedProduct && this._selectedProduct.id) || ''}"
          .confirmCallback="${confirmCallback}"
        ></object-selector>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.product')
      }
    )
  }

  async validateAdjust() {
    if (!this.targetInfo.qty) {
      throw new Error(i18next.t('text.invalid_item_qty'))
    }

    if (!this.targetInfo.weight) {
      throw new Error(i18next.t('text.invalid_item_weight'))
    }

    const isRelabelable = await this._checkValidInventory()
    if (!isRelabelable) throw new Error(i18next.t('text.inventory_should_be_excatly_same_or_totally_different'))
  }

  async _checkValidInventory() {
    const response = await client.query({
      query: gql`
        query {
          checkRelabelable(${gqlBuilder.buildArgs({
            batchId: this._selectedBatchId || this.targetInfo.target.batchId,
            productId: this._selectedProduct?.id || this.targetInfo.target.productId,
            packingType: this.targetInfo.packingType,
            unitWeight: this.targetInfo.weight / this.targetInfo.qty
          })})
        }
      `
    })

    if (!response.errors) {
      return response.data.checkRelabelable
    }
  }

  async createNewLabel(operationGuide) {
    try {
      if (!operationGuide.data.newLabel.files || !operationGuide.data.newLabel.files.length) return operationGuide
      const attachment = {
        file: operationGuide.data.newLabel.files[0],
        category: 'LABEL',
        refBy: `VAS-ORDER-RELABEL-${String(Date.now())}`
      }
      const response = await client.query({
        query: gql`
          mutation($attachment: NewAttachment!) {
            createAttachment(attachment: $attachment) {
              id
              name
              path
            }
          }
        `,
        variables: {
          attachment
        },
        context: {
          hasUpload: true
        }
      })

      if (response.errors) throw response.errors[0]

      return {
        ...operationGuide,
        data: {
          ...operationGuide.data,
          newLabel: response.data.createAttachment
        }
      }
    } catch (e) {
      throw e
    }
  }

  async deleteNewLabel(record) {
    try {
      const operationGuide = JSON.parse(record.operationGuide)
      const response = await client.query({
        query: gql`
          mutation {
            deleteAttachment(${gqlBuilder.buildArgs({
              id: operationGuide.data.newLabel.id
            })}) {
              name
            }
          }
        `
      })

      if (response.errors) throw response.errors[0]
    } catch (e) {
      throw e
    }
  }

  async relabel() {
    try {
      this._checkRelabelable()
      let args = {
        worksheetDetailName: this.record.name,
        fromPalletId: this.fromPalletIdInput.value,
        toPalletId: this.toPalletIdInput.value
      }
      if (this.orderType === ORDER_TYPES.VAS_ORDER.value) {
        args.locationName = this.locationInput.value
      }

      await client.query({
        query: gql`
          mutation {
            relabeling(${gqlBuilder.buildArgs(args)})
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

  async undoRelabel(worksheetDetailName, toPalletId) {
    try {
      await client.query({
        query: gql`
          mutation {
            undoRelabeling(${gqlBuilder.buildArgs({
              worksheetDetailName,
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

  _checkRelabelable() {
    const fromPalletId = this.fromPalletIdInput.value
    if (!fromPalletId) {
      this.fromPalletIdInput.focus()
      throw new Error(i18next.t('text.from_pallet_id_is_emplty'))
    }

    const toPalletId = this.toPalletIdInput.value
    if (!toPalletId) {
      this.toPalletIdInput.focus()
      throw new Error(i18next.t('text.to_pallet_id_is_empty'))
    }

    if (fromPalletId === toPalletId) {
      this.toPalletIdInput.focus()
      throw new Error(i18next.t('text.pallet_id_is_dulicated'))
    }

    if (this.orderType === ORDER_TYPES.VAS_ORDER.value) {
      if (!this.locationInput.value) {
        this.locationInput.select()
        throw new Error(i18next.t('text.location_code_is_empty'))
      }
    }
  }

  checkExecutionValidity() {
    if (!this.palletData.records?.length) throw new Error(i18next.t('text.there_is_no_relabeled_pallet'))
    const totalQty = this.palletData.records.reduce((qty, r) => (qty += r.qty), 0)
    if (totalQty !== this.record.qty) throw Error(i18next.t('text.invalid_item_qty'))
  }
}

window.customElements.define('vas-relabel', VasRelabel)
