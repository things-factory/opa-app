import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { navigate, client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'
import { elementType } from 'prop-types'

class UploadReceivalNote extends localize(i18next)(PageView) {
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
          display: flex;
          margin-left: auto;
        }
        .button-container > mwc-button {
          padding: 10px;
        }
      `
    ]
  }

  static get properties() {
    return {
      grnId: String,
      _ganNo: String,
      config: Object,
      _arrivalNoticeList: Object
    }
  }

  constructor() {
    super()
    this._arrivalNoticeList = {}
    this._receivalNote = {}
  }

  get context() {
    return {
      title: i18next.t('title.create_receival_note'),
      actions: [
        {
          title: i18next.t('button.create'),
          action: this._saveGRNAttachment.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.upload_goods_receival_note')}</legend>
          <label>${i18next.t('label.upload_co')}</label>
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
    `
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async pageInitialized() {
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

  async fetchHandler() {
    let filters = []

    filters = [
      // {
      //   name: 'arrivalNotice',
      //   operator: 'eq',
      //   value: this._fetchReceivalNote.refNo
      // }
    ]

    if (bizplaceId && bizplaceId !== '' && arrivalNoticeId && arrivalNoticeId !== '') {
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
    } else {
      return {
        total: 0,
        records: []
      }
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('#product-grist')
  }

  get uploadGRNAttachment() {
    return this.shadowRoot.querySelector('#grnUpload')
  }

  async _fetchReceivalNote(grnNo) {
    const response = await client.query({
      query: gql`
        query {
          goodsReceivalNote(${gqlBuilder.buildArgs({
            name: grnNo
          })}) {
            id
            name
            description
            bizplace {
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
      this._receivalNote = response.data.goodsReceivalNote
    }
  }

  async _saveGRNAttachment() {
    const attachmentFile = this.uploadGRNAttachment.files[0]

    try {
      let attachment = { refBy: this.grnId, file: attachmentFile, category: 'ORDER' }

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

      if (!response.errors) {
        // navigate(`receival_note_detail/${response.data.generateGoodsReceivalNote.name}`)
        this._showToast({ message: i18next.t('text.receival_note_uploaded') })
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

window.customElements.define('upload-receival-note', UploadReceivalNote)
