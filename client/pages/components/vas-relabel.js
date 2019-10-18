import { SingleColumnFormStyles, MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import '../components/image-viewer'
import '../master/product-list'
import { ORDER_VAS_STATUS } from '../order/constants/order'
import { WORKSHEET_STATUS } from '../inbound/constants/worksheet'

class VasRelabel extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      SingleColumnFormStyles,
      MultiColumnFormStyles,
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
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }
        h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }

        image-viewer {
          flex: 1;
        }
        .new-label {
          display: flex;
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
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.relabel')}</h2>

        <form class="single-column-form" @submit="${e => e.preventDefault()}">
          <fieldset>
            <legend>${i18next.t('title.product')}</legend>
            <label>${i18next.t('label.from_product')}</label>
            <input readonly name="fromProduct" value="${this.fromProdut}" />

            <label>${i18next.t('label.to_product')}</label>
            <input readonly name="product" @click="${this._openProductPopup.bind(this)}" value="${this.toProduct}" />

            <label ?hidden="${!this._isEditable}">${i18next.t('label.new-label')}</label>
            <file-uploader
              ?hidden="${!this._isEditable}"
              custom-input
              required
              name="newLabel"
              ._files="${this.newLabelFile}"
            ></file-uploader>
          </fieldset>
        </form>

        ${this._isEditable
          ? ''
          : html`
              <div class="label-preview" ?hidden="${this._isEditable}">
                <image-viewer
                  name="${this._newLabelName}"
                  src="${this._newLabelPath}"
                  .downloadable="${this._isDownloadable}"
                ></image-viewer>
              </div>
            `}
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

  get fromProdut() {
    if (this.record && this.record.inventory && this.record.inventory.product) {
      const product = this.record.inventory.product
      this._selectedFromProduct = product
      return `${product.name} ${product.description ? `(${product.description})` : ''}`
    } else if (this.record && this.record.operationGuide.data.fromProduct) {
      const product = this.record.operationGuide.data.fromProduct
      return `${product.name} ${product.description ? `(${product.description})` : ''}`
    } else {
      return ''
    }
  }

  get toProduct() {
    if (this.record && this.record.operationGuide) {
      const product = this.record.operationGuide.data.toProduct
      this._selectedProduct = product
      return `${product.name} ${product.description ? `(${product.description})` : ''}`
    } else {
      return ''
    }
  }

  get newLabelFile() {
    if (this.record && this.record.operationGuide) {
      return this.record.operationGuide.data.newLabel.files
    }
  }

  get _isEditable() {
    return !this.record.status
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

  get revertTransactions() {
    return [this.deleteNewLabel.bind(this)]
  }

  _openProductPopup() {
    if (!this._isEditable) return
    if (this.record.status === ORDER_VAS_STATUS.PENDING.value) return
    const queryName = 'products'
    const basicArgs = {
      filters: [{ name: 'productRef', operator: 'noteq', value: '' }, { name: 'productRef', operator: 'is_not_null' }]
    }
    const confirmCallback = selected => {
      this._selectedProduct = selected
      this.productInput.value = `${this._selectedProduct.name} ${
        this._selectedProduct.description ? `(${this._selectedProduct.description})` : ''
      }`
    }
    openPopup(
      html`
        <object-selector
          .queryName="${queryName}"
          .basicArgs="${basicArgs}"
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

  adjust() {
    try {
      this._validateAdjust()
      return {
        data: {
          fromProduct: this._selectedFromProduct,
          toProduct: this._selectedProduct,
          newLabel: {
            files: this.newLabelInput.files
          }
        },
        transactions: [this.createNewLabel.bind(this)]
      }
    } catch (e) {
      throw e
    }
  }

  _validateAdjust() {
    if (!this._selectedProduct) throw new Error(i18next.t('text.to_product_is_empty'))
    if (!this.newLabelInput.files) throw new Error(i18next.t('text.new_label_does_not_selected'))
  }

  async createNewLabel(operationGuide) {
    try {
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
}

window.customElements.define('vas-relabel', VasRelabel)
