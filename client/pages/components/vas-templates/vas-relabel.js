import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { WORKSHEET_STATUS } from '../../inbound/constants/worksheet'
import { ORDER_VAS_STATUS } from '../../order/constants/order'
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
      `
    ]
  }

  static get properties() {
    return {
      record: Object
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
              <form id="input-form" class="single-column-form">
                <fieldset>
                  <label>${i18next.t('label.from_pallet')}</label>
                  <barcode-scanable-input name="from-pallet-id" custom-input></barcode-scanable-input>
                </fieldset>
              </form>
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

  async init() {
    await this.updateComplete
    this.isExecuting = !this.record.completed
    if (this.isExecuting) {
      this.inputForm.reset()
      this.fromPalletIdInput.setAttribute('readonly', true)
      if (this.record.palletId) {
        this.fromPalletIdInput.value = this.record.palletId
      } else {
        await this._assignInventories()
      }
    }
  }

  _openProductPopup() {
    if (!this._isEditable) return
    if (this.record.status === ORDER_VAS_STATUS.PENDING.value) return
    const queryName = 'products'
    const basicArgs = {
      filters: [{ name: 'product_ref_id', operator: 'is_not_null' }]
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
    if (!this._selectedProduct && !this._selectedBatchId) {
      throw new Error(i18next.t('text.target_does_not_selected'))
    }

    if (this._selectedBatchId) {
      if (await this._checkBatchIdDuplication()) {
        throw new Error(i18next.t('text.batch_id_is_duplicated'))
      }
    }
  }

  async _checkBatchIdDuplication() {
    const response = await client.query({
      query: gql`
        query {
          inventories(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'batchId',
                operator: 'eq',
                value: this._selectedBatchId
              }
            ],
            pagination: {
              limit: 1
            }
          })}) {
            items {
              batchId
            }
          }
        }
      `
    })

    if (!response.errors) {
      if (response.data.inventories.items.length) {
        return true // there's duplicated batch id already
      } else {
        return false // there's no duplicated batch id
      }
    } else {
      return false
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

  /**
   * @description Assign target inventories
   * if it doesn't have assigned inventories, meaning the VAS comes with Arrival Notice or Release Goods
   */
  async _assignInventories() {
    await client.query({
      query: gql`
        mutation {
          assignRelabelInventories(${gqlBuilder.buildArgs({
            worksheetDetailName: this.record.name
          })})
        }
      `
    })

    this.dispatchEvent(new CustomEvent('completed'))
  }

  checkRelabelable() {
    if (!this.fromPalletIdInput.value) {
      this.fromPalletIdInput.select()
      throw new Error(i18next.t('text.from_pallet_id_is_emplty'))
    }
  }
}

window.customElements.define('vas-relabel', VasRelabel)
