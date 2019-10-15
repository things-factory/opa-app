import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import '../master/product-list'

class VasRelabel extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
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
        <form class="multi-column-form" @submit="${e => e.preventDefault()}">
          <fieldset>
            <legend>${i18next.t('title.product')}</legend>
            <label>${i18next.t('label.from_product')}</label>
            <input readonly name="fromProduct" value="${this.fromProdut}" />

            <label>${i18next.t('label.to_product')}</label>
            <input readonly name="product" @click="${this._openProductPopup.bind(this)}" value="${this.toProduct}" />
          </fieldset>

          <fieldset>
            <legend>${i18next.t('title.upload_label')}</legend>
            <file-uploader custom-input required name="newLabel"></file-uploader>
          </fieldset>
        </form>
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

  updated(changedProps) {
    if (changedProps.has('record')) {
      if (this.record && this.record.operationGuide) {
        this.newLabelInput._files = this.record.operationGuide.data.newLabel.files
      }
    }
  }

  _openProductPopup() {
    const queryName = 'products'
    const basicArgs = {
      filters: [
        { name: 'productRef', operator: 'noteq', value: '' },
        { name: 'productRef', operator: 'is_not_null' },
        { name: 'id', operator: 'noteq', value: this.record.inventory.product.id }
      ]
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
          toProduct: this._selectedProduct,
          newLabel: {
            files: this.newLabelInput.files
          }
        },
        transactions: [this.createNewLabel.bind(this)]
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateAdjust() {
    if (!this._selectedProduct) throw new Error(i18next.t('text.product_is_empty'))
    if (!this.newLabelInput.files) throw new Error(i18next.t('text.new_label_doesn_not_selected'))
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

      return {
        ...operationGuide,
        data: {
          ...operationGuide.data,
          newLabel: { id: response.data.createAttachment.id }
        }
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

window.customElements.define('vas-relabel', VasRelabel)
