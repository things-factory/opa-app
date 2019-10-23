import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { navigate, client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'

class CreateReceivalNote extends localize(i18next)(PageView) {
  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
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
      `
    ]
  }

  static get properties() {
    return {
      _ganNo: String,
      config: Object
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.create_receival_note')}</legend>

          <label>${i18next.t('label.customer')}</label>
          <select name="bizplace" @change="${this._validateForm.bind(this)}">
            <option value="">-- ${i18next.t('text.please_select_a_customer')} --</option>

            ${Object.keys(this._bizplaceList || {}).map(key => {
              let bizplace = this._bizplaceList[key]
              return html`
                <option value="${bizplace.id}">${bizplace.name}</option>
              `
            })}
          </select>

          <label>${i18next.t('label.order_no')}</label>
          <select name="arrivalNotice" @change="${this._validateForm.bind(this)}">
            <option value="">-- ${i18next.t('text.please_select_an_arrival_notice')} --</option>

            ${Object.keys(this._arrivalNoticeList || {}).map(key => {
              let gan = this._arrivalNoticeList[key]
              return html`
                <option value="${gan.id}">${gan.name}</option>
              `
            })}
          </select>
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

  get context() {
    return {
      title: i18next.t('title.create_receival_note'),
      actions: [
        {
          title: i18next.t('button.create'),
          action: this._generateGoodsReceivalNote.bind(this)
        }
      ]
    }
  }

  // get createButton() {
  //   return { title: i18next.t('button.create'), action: this._generategoodsReceivalNote.bind(this) }
  // }

  get adjustButton() {
    return {
      title: i18next.t('button.adjust'),
      action: () => {}
    }
  }

  constructor() {
    super()
    // this._actions = [this.createButton]
  }

  get _getBizplaceId() {
    return this.shadowRoot.querySelector('select[name="bizplace"]')
  }

  get _getArrivalNoticeId() {
    return this.shadowRoot.querySelector('select[name="arrivalNotice"]')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('#product-grist')
  }

  async pageInitialized() {
    this._bizplaceList = { ...(await this._fetchBizplaceList()) }
    this._arrivalNoticeList = { ...(await this._fetchArrivalNoticeList()) }

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
      {
        name: 'bizplace',
        operator: 'eq',
        value: this._getBizplaceId.value
      },
      {
        name: 'arrivalNotice',
        operator: 'eq',
        value: this._getArrivalNoticeId.value
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

  _validateForm() {
    if (
      this._getBizplaceId.value &&
      this._getBizplaceId.value !== '' &&
      this._getArrivalNoticeId.value &&
      this._getArrivalNoticeId.value !== ''
    ) {
      this.dataGrist.fetch()
    }
  }

  async _fetchBizplaceList() {
    const response = await client.query({
      query: gql`
        query {
          bizplaces (${gqlBuilder.buildArgs({ filters: [], pagination: { page: 1, limit: 9999 } })}){
            items{
              id
              name
              description
            }
          }
        }`
    })

    return response.data.bizplaces.items
  }

  async _fetchArrivalNoticeList() {
    const filters = [
      {
        name: 'status',
        operator: 'eq',
        value: 'READY_TO_PUTAWAY'
      }
      // {
      //   name: 'bizplace',
      //   operator: 'eq',
      //   value: this._getBizplaceId.value
      // }
    ]
    const response = await client.query({
      query: gql`
      query {
        arrivalNotices(${gqlBuilder.buildArgs({
          filters
        })}) {
          items {
            id
            name
            description
          }
        }
      }
    `
    })
    return response.data.arrivalNotices.items
  }

  async _fetchArrivalNotice() {
    const filters = [
      {
        name: 'id',
        operator: 'eq',
        value: this._getArrivalNoticeId.value
      }
    ]
    const response = await client.query({
      query: gql`
      query {
        arrivalNotices(${gqlBuilder.buildArgs({
          filters
        })}) {
          items {
            id
            name
            description
          }
        }
      }
    `
    })
    return response.data.arrivalNotices.items[0].name
  }

  async _generateGoodsReceivalNote() {
    const arrivalNoticeId = await this._fetchArrivalNotice()

    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_goods_receival_note'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      let args = {
        grn: { refNo: arrivalNoticeId, description: 'test' }
      }

      const response = await client.query({
        query: gql`
            mutation {
              generateGoodsReceivalNote(${gqlBuilder.buildArgs(args)}) {
                id
                name
              }
            }
          `
      })

      if (!response.errors) {
        navigate(`receival_note_detail/${response.data.generateGoodsReceivalNote.name}`)
        this._showToast({ message: i18next.t('receival_note_created') })
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

window.customElements.define('create-receival-note', CreateReceivalNote)
