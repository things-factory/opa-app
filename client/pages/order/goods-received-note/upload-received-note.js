import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class UploadReceivedNote extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
          background-color: white;
        }
        .container {
          flex: 1;
          display: flex;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .guide-container {
          max-width: 30vw;
          display: flex;
          flex-direction: column;
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
        .grist h2 {
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }
        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }

        h2 + data-grist {
          padding-top: var(--grist-title-with-grid-padding);
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
      grnId: String,
      grnName: String,
      config: Object,
      callback: Object,
      _arrivalNotice: Object
    }
  }

  constructor() {
    super()
    this._arrivalNotice = {}
    this._loadedFlag = {}
  }

  get context() {
    return {
      title: i18next.t('title.create_goods_received_note')
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.upload_goods_received_note')}</legend>
          <file-uploader custom-input id="grnUpload" name="attachments"></file-uploader>
        </fieldset>
      </form>

      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product_info')}</h2>
          <data-grist
            id="product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .fetchHandler="${this.fetchHandler.bind(this)}"
          ></data-grist>
        </div>
      </div>

      <div class="button-container">
        <button @click=${this._saveGRNAttachment}>${i18next.t('button.submit')}</button>
      </div>
    `
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async firstUpdated() {
    if (this.grnName) {
      this._loadedFlag = true
      await this._fetchArrivalNotice(this.grnName)
    } else {
      this._loadedFlag = false
    }

    this.config = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true }, appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 350
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 80
        }
      ]
    }
  }

  async _fetchArrivalNotice(grnName) {
    const response = await client.query({
      query: gql`
      query {
        goodsReceivalNote(${gqlBuilder.buildArgs({
          name: grnName
        })}) {
          id
          name
          description
          refNo
          arrivalNotice {
            id
            name
            description
          }
          updatedAt
          updater {
            id
            name
            description
          }
        }
      }
    `
    })

    if (!response.errors) {
      this._arrivalNotice = response.data.goodsReceivalNote.arrivalNotice
    }
  }

  async fetchHandler() {
    if (this._loadedFlag) {
      const filters = [
        {
          name: 'arrivalNotice',
          operator: 'eq',
          value: this._arrivalNotice.id
        }
      ]

      const response = await client.query({
        query: gql`
        query {
          orderProducts(${gqlBuilder.buildArgs({
            filters
          })}) {
            items {
              id
              name
              batchId
              description
              packingType
              packQty
              remark
              product {
                id
                name
              }
            }
            total
          }
        }
      `
      })
      return {
        total: response.data.orderProducts.total || 0,
        records: response.data.orderProducts.items || []
      }
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('#product-grist')
  }

  get uploadGRNAttachment() {
    return this.shadowRoot.querySelector('#grnUpload')
  }

  async _saveGRNAttachment() {
    const file = this.uploadGRNAttachment.files
    const name = this.grnName
    try {
      this.dataGrist.showSpinner()

      if (this.grnName) {
        const response = await client.query({
          query: gql`
            mutation($file: Upload!) {
              submitGoodsReceivalNote(${gqlBuilder.buildArgs({ name })}, file: $file ) {
                id
                status
              }
            }
          `,
          variables: {
            file
          },
          context: {
            hasUpload: true
          }
        })

        if (!response.errors) {
          if (this.callback && typeof this.callback === 'function') this.callback()
          history.back()
          this._showToast({ message: i18next.t('text.goods_received_note_uploaded') })
        }
      }
    } catch (e) {
      this._showToast(e)
    } finally {
      this.dataGrist.hideSpinner()
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

window.customElements.define('upload-received-note', UploadReceivedNote)
