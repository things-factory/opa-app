import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { navigate, client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../../utils/custom-alert'
import { elementType } from 'prop-types'

class CreateDeliveryNote extends localize(i18next)(PageView) {
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
      config: Object,
      productData: Object,
      productGristConfig: Object,
      _arrivalNoticeList: Object
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.goods_delivery_note')}</legend>

          <label>${i18next.t('label.deliver_to')}</label>
          <select name="bizplace" @change="${e => this._onValueChange(e.target.value)}">
            <option value=""></option>

            ${Object.keys(this._bizplaceList || {}).map(key => {
              let bizplace = this._bizplaceList[key]
              return html`
                <option value="${bizplace.id}">${bizplace.name}</option>
              `
            })}
          </select>

          <label>${i18next.t('label.delivery_date')}</label>
          <input name="deliveryDate" type="date" min="${this._getStdDate()}" required />
        </fieldset>
      </form>
      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>
          <data-grist
            id="product-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.productGristConfig}
            .data="${this.productData}"
            @record-change="${this._onProductChangeHandler.bind(this)}"
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

  get adjustButton() {
    return {
      title: i18next.t('button.adjust'),
      action: () => {}
    }
  }

  constructor() {
    super()
    this._arrivalNoticeList = {}
    this.productData = { records: [] }
  }

  get _getBizplaceId() {
    return this.shadowRoot.querySelector('select[name="bizplace"]')
  }

  get _getArrivalNoticeId() {
    return this.shadowRoot.querySelector('select[name="arrivalNotice"]')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  async pageInitialized() {
    this._bizplaceList = { ...(await this._fetchBizplaceList()) }

    this.productGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      // list: { fields: ['batch_no', 'product', 'packingType', 'totalWeight'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const newData = data.records.filter((_, idx) => idx !== rowIndex)
              this.productData = { ...this.productData, records: newData }
              this.productGrist.dirtyData.records = newData
            }
          }
        },
        {
          type: 'string',
          name: 'product',
          header: i18next.t('field.sku'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 350
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            editable: true,
            align: 'center',
            codeName: 'PACKING_TYPES'
          },
          width: 150
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.loose_qty'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 80
        }
      ]
    }
  }

  async fetchHandler() {
    let filters = []
    const bizplaceId = this._getBizplaceId.value
    const arrivalNoticeId = this._getArrivalNoticeId.value

    filters = [
      {
        name: 'bizplace',
        operator: 'eq',
        value: bizplaceId
      },
      {
        name: 'arrivalNotice',
        operator: 'eq',
        value: arrivalNoticeId
      }
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

  _validateForm() {
    const bizplaceId = this._getBizplaceId.value
  }

  async _fetchBizplaceList() {
    const name = ''
    const response = await client.query({
      query: gql`
        query {
          customerBizplaces (${gqlBuilder.buildArgs({
            name: name
          })}){
            id
            name
            description
          }
        }`
    })

    return response.data.customerBizplaces
  }

  _onProductChangeHandler(event) {
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name
  }

  async _onValueChange(bizplace) {
    if (!bizplace == '') {
    }
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

  _validateProducts() {
    // no records
    if (!this.productGrist.dirtyData.records || !this.productGrist.dirtyData.records.length)
      throw new Error(i18next.t('text.no_products'))

    // required field (batchId, packingType, weight, unit, packQty, palletQty)
    // if (
    //   this.productGrist.dirtyData.records.filter(
    //     record => !record.batchId || !record.packingType || !record.weight || !record.unit || !record.packQty
    //   ).length
    // )
    //   throw new Error(i18next.t('text.empty_value_in_list'))
  }

  async _generateGoodsReceivalNote() {
    try {
      this._validateProducts()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_goods_delivery_note'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      let args = {
        gdn: { customer: this._getBizplaceId.value }
      }

      const response = await client.query({
        query: gql`
            mutation {
              generateGoodsDeliveryNote(${gqlBuilder.buildArgs(args)}) {
                id
                name
              }
            }
          `
      })

      if (!response.errors) {
        navigate(`receival_note_detail/${response.data.generateGoodsReceivalNote.name}`)
        this._showToast({ message: i18next.t('text.receival_note_created') })
      } else if (response.errors[0].extensions.exception.code === '23505') {
        throw new Error(i18next.t('text.this_receival_note_already_existed'))
      }
    } catch (e) {
      // this._showToast(e)
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

window.customElements.define('create-delivery-note', CreateDeliveryNote)
