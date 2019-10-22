import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { CustomAlert } from '../../../utils/custom-alert'
import { ORDER_PRODUCT_STATUS, ORDER_TYPES } from '../constants/order'
import './inventory-product-selector'

class CreateReleaseOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _ownTransport: Boolean,
      _exportOption: Boolean,
      _email: String,
      _selectedInventories: Array,
      inventoryGristConfig: Object,
      vasGristConfig: Object,
      inventoryData: Object,
      vasData: Object,
      _releaseOrderNo: String
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
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

  get context() {
    return {
      title: i18next.t('title.create_release_order'),
      actions: [
        {
          title: i18next.t('button.submit'),
          action: this._generateReleaseOrder.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
        <form name="releaseOrder" class="multi-column-form" autocomplete="off">
          <fieldset>
            <legend>${i18next.t('title.release_order')}</legend>
            <label>${i18next.t('label.release_date')}</label>
            <input name="releaseDate" type="date" min="${this._getStdDate()}" />

            <label ?hidden="${!this._ownTransport}">${i18next.t('label.co_no')}</label>
            <input name="collectionOrderNo" ?hidden="${!this._ownTransport}"/>

            <label ?hidden="${!this._ownTransport}">${i18next.t('label.truck_no')}</label>
            <input name="truckNo" ?hidden="${!this._ownTransport}"/>

            <input
            id="exportOption"
            type="checkbox"
            name="exportOption"
            ?checked="${this._exportOption}"
            @change="${e => {
              this._exportOption = e.currentTarget.checked
              if (this._exportOption) {
                this._ownTransportInput.checked = true
                this._ownTransport = true
              }
            }}"
            />
            <label for="exportOption">${i18next.t('label.export')}</label>

            <input
            id="ownTransport"
            type="checkbox"
            name="ownTransport"
            ?checked="${this._ownTransport}"
            @change="${e => (this._ownTransport = e.currentTarget.checked)}"
            ?hidden="${this._exportOption}"
            />
            <label for="ownTransport" ?hidden="${this._exportOption}">${i18next.t('label.own_transport')}</label>
          </fieldset>
        </form>
      </div>

      <div class="so-form-container" ?hidden="${!this._exportOption || (this._exportOption && !this._ownTransport)}">
        <form name="shippingOrder" class="multi-column-form" autocomplete="off">
          <fieldset>
            <legend>${i18next.t('title.export_order')}</legend>
            <label>${i18next.t('label.container_no')}</label>
            <input name="containerNo" ?required="${this._exportOption}"/>

            <label>${i18next.t('label.container_arrival_date')}</label>
            <input 
              name="containerArrivalDate" 
              type="date"  
              @change="${e => {
                this._conLeavingDateInput.setAttribute('min', e.currentTarget.value)
              }}" 
              min="${this._getStdDate()}" 
              ?required="${this._exportOption}"
            />

            <label>${i18next.t('label.container_leaving_date')}</label>
            <input name="containerLeavingDate" type="date" min="${this._getStdDate()}" ?required="${
      this._exportOption
    }"/>

            <label>${i18next.t('label.ship_name')}</label>
            <input name="shipName" ?required="${this._exportOption}"/>

          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_product_list')}</h2>

        <data-grist
          id="inventory-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.inventoryGristConfig}
          .data=${this.inventoryData}
          @record-change="${this._onProductChangeHandler.bind(this)}"
          @field-change="${this._onFieldChange.bind(this)}"
        ></data-grist>
      </div>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>

        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this._exportOption = false
    this._ownTransport = true
    this._selectedInventories = []
    this.inventoryData = { records: [] }
    this.vasData = { records: [] }
  }

  get releaseOrderForm() {
    return this.shadowRoot.querySelector('form[name=releaseOrder]')
  }

  get _conLeavingDateInput() {
    return this.shadowRoot.querySelector('input[name=containerLeavingDate]')
  }

  get shippingOrderForm() {
    return this.shadowRoot.querySelector('form[name=shippingOrder]')
  }

  get _ownTransportInput() {
    return this.shadowRoot.querySelector('input[name=ownTransport]')
  }

  get inventoryGrist() {
    return this.shadowRoot.querySelector('data-grist#inventory-grist')
  }

  get vasGrist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  async pageInitialized() {
    const _userBizplaces = await this._fetchUserBizplaces()

    this.inventoryGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      list: { fields: ['inventory', 'product', 'location', 'releaseQty'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const newData = data.records.filter((_, idx) => idx !== rowIndex)
              this.inventoryData = { ...this.inventoryData, records: newData }
              this.inventoryGrist.dirtyData.records = newData
              this._updateInventoryList()
            }
          }
        },
        {
          type: 'object',
          name: 'inventory',
          header: i18next.t('field.inventory_list'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'inventories',
              basicArgs: {
                filters: [
                  {
                    name: 'bizplace',
                    value: `${_userBizplaces[0].id || ''}`,
                    operator: 'eq'
                  }
                ]
              },
              nameField: 'batchId',
              descriptionField: 'palletId',
              select: [
                { name: 'id', hidden: true },
                { name: 'name', hidden: true },
                { name: 'palletId', header: i18next.t('field.pallet_id'), record: { align: 'center' } },
                { name: 'batchId', header: i18next.t('field.batch_no'), record: { align: 'center' } },
                { name: 'packingType', header: i18next.t('field.packing_type'), record: { align: 'center' } },
                {
                  name: 'location',
                  type: 'object',
                  subFields: ['name', 'description'],
                  record: { align: 'center' }
                },
                {
                  name: 'bizplace',
                  type: 'object',
                  record: { align: 'center' }
                },
                {
                  name: 'product',
                  type: 'object',
                  subfields: ['name', 'description']
                },
                { name: 'qty', type: 'float', record: { align: 'center' } }
              ],
              list: { fields: ['palletId', 'product', 'batchId', 'location'] }
            }
          },
          width: 250
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 150
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'code',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: {
            align: 'center',
            codeName: 'PACKING_TYPES'
          },
          width: 150
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.available_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { editable: true, align: 'center', options: { min: 0 } },
          width: 100
        }
      ]
    }

    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      list: { fields: ['vas', 'inventory', 'product', 'remark'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const newData = data.records.filter((_, idx) => idx !== rowIndex)
              this.vasData = { ...this.vasData, records: newData }
            }
          }
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
                { name: 'name', header: i18next.t('field.pallet_id') },
                { name: 'description', header: i18next.t('field.description') }
              ],
              list: { fields: ['name', 'description'] }
            }
          },
          width: 250
        },
        {
          type: 'object',
          name: 'inventory',
          header: i18next.t('field.inventory_list'),
          record: {
            editable: true,
            align: 'center',
            options: {
              queryName: 'inventories',
              basicArgs: {
                filters: []
              },
              select: [
                { name: 'id', hidden: true },
                { name: 'name', hidden: true },
                { name: 'palletId', header: i18next.t('field.pallet_id'), record: { align: 'center' } },
                { name: 'product', type: 'object' },
                { name: 'batchId', header: i18next.t('field.batch_no'), record: { align: 'center' } },
                { name: 'packingType', header: i18next.t('field.packing_type'), record: { align: 'center' } },
                {
                  name: 'location',
                  type: 'object',
                  subFields: ['name', 'description'],
                  record: { align: 'center' }
                }
              ],
              list: { fields: ['palletId', 'product', 'batchId', 'location'] }
            }
          },
          sortable: true,
          width: 180
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
        }
      ]
    }
  }

  async _fetchUserBizplaces() {
    if (!this._email) return
    const response = await client.query({
      query: gql`
        query {
          userBizplaces(${gqlBuilder.buildArgs({
            email: this._email
          })}) {
            id
            name
            description
            mainBizplace
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.userBizplaces.filter(userBizplaces => userBizplaces.mainBizplace)
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  _onFieldChange() {
    this.inventoryData = {
      ...this.inventoryGrist.dirtyData,
      records: this.inventoryGrist.dirtyData.records.map(record => {
        return {
          ...record,
          ...record.inventory
        }
      })
    }
  }

  _onProductChangeHandler(event) {
    const changeRecord = event.detail.after
    const changedColumn = event.detail.column.name

    if (changedColumn === 'releaseQty' || changedColumn === 'qty') {
      try {
        this._validateReleaseQty(changeRecord.releaseQty, changeRecord.qty)
      } catch (e) {
        this._showToast(e)
        delete event.detail.after.releaseQty
      }
    }

    this._updateInventoryList()
  }

  _validateReleaseQty(releaseQty, qty) {
    if (releaseQty > qty) {
      throw new Error(i18next.t('text.available_quantity_insufficient'))
    } else if (releaseQty <= 0) {
      throw new Error(i18next.t('text.invalid_quantity_input'))
    } else {
      return
    }
  }

  async _generateReleaseOrder() {
    try {
      this._validateForm()
      this._validateInventories()
      this._validateVas()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_release_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      let args = {
        releaseGood: { ...this._getReleaseOrder(), ownTransport: this._exportOption ? true : this._ownTransport }
      }
      if (this._exportOption && this._ownTransport) args.shippingOrder = this._getShippingOrder()

      const response = await client.query({
        query: gql`
            mutation {
              generateReleaseGood(${gqlBuilder.buildArgs(args)}) {
                id
                name
              }
            }
          `
      })

      if (!response.errors) {
        this._clearView()
        navigate(`release_order_detail/${response.data.generateReleaseGood.name}`)
        this._showToast({ message: i18next.t('release_order_created') })
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateForm() {
    if (!this.releaseOrderForm.checkValidity()) throw new Error('text.release_order_form_invalid')

    //    - condition: export is ticked and own transport
    if (this._exportOption && this._ownTransport) {
      if (!this.shippingOrderForm.checkValidity()) throw new Error('text.shipping_order_form_invalid')
    }
  }

  _validateInventories() {
    this.inventoryGrist.commit()
    // no records
    if (!this.inventoryGrist.data.records || !this.inventoryGrist.data.records.length)
      throw new Error(i18next.t('text.no_products'))

    // required field (batchId, packingType, weight, unit, packQty)
    if (
      this.inventoryGrist.data.records.filter(record => !record.releaseQty || !record.batchId || !record.packingType)
        .length
    )
      throw new Error(i18next.t('text.empty_value_in_list'))

    // duplication of pallet id
    const palletIds = this.inventoryGrist.data.records.map(inventory => inventory.palletId)
    if (palletIds.filter((palletId, idx, palletIds) => palletIds.indexOf(palletId) !== idx).length)
      throw new Error(i18next.t('text.pallet_id_is_duplicated'))
  }

  _validateVas() {
    this.vasGrist.commit()
    if (this.vasGrist.data.records && this.vasGrist.data.records.length) {
      // required field (vas && remark)
      if (this.vasGrist.data.records.filter(record => !record.vas || !record.remark).length)
        throw new Error(i18next.t('text.empty_value_in_list'))
    }
  }

  _updateInventoryList() {
    this._selectedInventories = [...(this.inventoryGrist.dirtyData.records || []).map(record => record.inventory.id)]

    var filter = [{ name: 'inventory', value: this._selectedInventories, operator: 'in' }]

    this.vasGristConfig = {
      ...this.vasGristConfig,
      columns: this.vasGristConfig.columns.map(column => {
        if (column.name === 'inventory') column.record.options.basicArgs.filters = filter

        return column
      })
    }
  }

  _getReleaseOrder() {
    let releaseGood = this._serializeForm(this.releaseOrderForm)

    releaseGood.orderInventories = this.inventoryGrist.data.records.map((record, idx) => {
      const seq = idx + 1

      return {
        releaseQty: record.releaseQty,
        seq,
        inventory: {
          id: record.id
        },
        type: ORDER_TYPES.RELEASE_OF_GOODS.value,
        status: ORDER_PRODUCT_STATUS.PENDING.value
      }
    })

    releaseGood.orderVass = this.vasGrist.data.records.map(record => {
      delete record.id
      delete record.vas.__origin__
      delete record.vas.__seq__
      delete record.vas.__selected__

      return { ...record, name }
    })

    return releaseGood
  }

  _serializeForm(form) {
    let obj = {}
    Array.from(form.querySelectorAll('input, select')).forEach(field => {
      if (!field.hasAttribute('hidden') && field.value) {
        obj[field.name] = field.type === 'checkbox' ? field.checked : field.value
      }
    })

    return obj
  }

  _getShippingOrder() {
    return this._serializeForm(this.shippingOrderForm)
  }

  _clearView() {
    this.releaseOrderForm.reset()
    this.shippingOrderForm.reset()
  }

  stateChanged(state) {
    this._email = state.auth && state.auth.user && state.auth.user.email
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

window.customElements.define('create-release-order', CreateReleaseOrder)
