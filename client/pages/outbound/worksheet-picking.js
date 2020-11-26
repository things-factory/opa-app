import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_INVENTORY_STATUS, WORKSHEET_STATUS, WORKSHEET_TYPE } from '../constants'
import './inventory-assign-popup'
import './inventory-auto-assign-popup'

class WorksheetPicking extends localize(i18next)(PageView) {
  static get properties() {
    return {
      isPalletPickingOrder: Boolean,
      _worksheetNo: String,
      _worksheetStatus: String,
      _roNo: String,
      ganNo: String,
      productGristConfig: Object,
      wsdGristConfig: Object,
      productGristData: Object,
      worksheetDetailData: Object,
      crossDocking: Boolean
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
        .form-container {
          display: flex;
        }
        .form-container > form {
          flex: 1;
        }
        barcode-tag {
          width: 100px;
          height: 100px;
          margin: 10px;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: row;
          flex: 1;
          overflow-y: auto;
        }
        .grist-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: auto;
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

  constructor() {
    super()
    this.isPalletPickingOrder = false
    this.worksheetDetailData = { records: [] }
  }

  get context() {
    return {
      title: i18next.t('title.worksheet_picking'),
      actions: this._actions,
      printable: {
        accept: ['preview'],
        content: this
      }
    }
  }

  render() {
    return html`
      <div class="form-container">
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.picking')}</legend>
            <label>${i18next.t('label.release_good_no')}</label>
            <input name="releaseGood" readonly />

            <label>${i18next.t('label.customer')}</label>
            <input name="bizplace" readonly />

            <label>${i18next.t('label.ref_no')}</label>
            <input name="refNo" readonly />

            <label>${i18next.t('label.release_date')}</label>
            <input name="releaseDate" type="date" readonly />

            <label>${i18next.t('label.status')}</label>
            <select name="status" disabled>
              ${Object.keys(WORKSHEET_STATUS).map(
                key => html`<option value="${WORKSHEET_STATUS[key].value}">${WORKSHEET_STATUS[key].name}</option>`
              )}
            </select>

            <input id="ownCollection" type="checkbox" name="ownCollection" disabled />
            <label for="ownCollection">${i18next.t('label.own_collection')}</label>

            <input name="crossDocking" type="checkbox" .checked="${this.crossDocking}" disabled />
            <label>${i18next.t('field.cross_docking')}</label>
          </fieldset>
        </form>

        <barcode-tag bcid="qrcode" .value=${this._roNo}></barcode-tag>
      </div>

      <div class="grist">
        ${this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value && !this.isPalletPickingOrder
          ? html`
              <div class="grist-column">
                <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.product')}</h2>

                <data-grist
                  id="product-grist"
                  .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
                  .config=${this.productGristConfig}
                  .data="${this.productGristData}"
                ></data-grist>
              </div>
            `
          : ''}

        <div class="grist-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.worksheet_detail')}</h2>
          <data-grist
            id="wsd-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.wsdGristConfig}
            .data="${this.worksheetDetailData}"
          ></data-grist>
        </div>
      </div>
    `
  }

  async updated(changeProps) {
    if (changeProps.has('crossDocking') || changeProps.has('ganNo')) {
      if (this.crossDocking && this.ganNo) {
        const { name, status } = await this.fetchUnloadingWorksheet()
        this.unloadingWorksheetNo = name
        this.unloadingWorksheetStatus = status
        this._updateContext()
      }
    }
  }

  async pageUpdated(changes) {
    if (this.active && (changes.resourceId || this._worksheetNo)) {
      if (changes.resourceId) {
        this._worksheetNo = changes.resourceId
      }
      await this.fetchOrderInventories()
      this._updateContext()
      this._updateGristConfig()
    }
  }

  pageInitialized() {
    this.productGristConfig = {
      pagination: { infinite: true },
      rows: {
        appendable: false,
        classifier: record => {
          return {
            emphasized: record.completed
          }
        },
        handlers: {
          click: async (columns, data, column, record, rowIndex) => {
            if (record.batchId && record.product?.name && record.packingType) {
              await this.fetchWorksheetDetails(
                this._worksheetNo,
                record.batchId,
                record.product.name,
                record.packingType
              )
              this._selectedProduct = {
                batchId: record.batchId,
                product: record.product,
                packingType: record.packingType,
                releaseQty: record.releaseQty,
                releaseUomValue: record.releaseUomValue,
                completed: record.completed
              }

              this._updateContext()
            }
          }
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'completed',
          header: i18next.t('field.done'),
          width: 40
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'assignment',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.completed) return

              this._selectedProduct = {
                batchId: record.batchId,
                product: record.product,
                bizplaceId: record.bizplaceId,
                packingType: record.packingType,
                releaseQty: record.releaseQty,
                releaseUomValue: record.releaseUomValue
              }
              this._showInventoryAssignPopup()
            }
          }
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 250
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'string',
          name: 'releaseUomValue',
          header: i18next.t('field.release_uom_value'),
          record: { align: 'center' },
          width: 60
        }
      ]
    }

    this.preWsdGristConfig = {
      list: { fields: ['palletId', 'batchId', 'product', 'packingType', 'location', 'releaseQty', 'status'] },
      pagination: { infinite: true },
      rows: { appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          width: 120
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 250
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'availableQty',
          header: i18next.t('field.available_qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'string',
          name: 'releaseUomValue',
          header: i18next.t('field.release_uom_value'),
          record: { align: 'center' },
          width: 60
        }
      ]
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get productGrist() {
    return this.shadowRoot.querySelector('data-grist#product-grist')
  }

  get wsdGrist() {
    return this.shadowRoot.querySelector('data-grist#wsd-grist')
  }

  async fetchOrderInventories() {
    if (!this._worksheetNo) return
    const response = await client.query({
      query: gql`
        query {
          worksheet(${gqlBuilder.buildArgs({
            name: this._worksheetNo
          })}) {
            status
            releaseGood {
              name
              description
              refNo
              ownTransport
              crossDocking
              releaseDate
              arrivalNotice {
                name
              }
            }
            orderInventories {
              status
              batchId
              product {
                id
                name
                description
              }
              packingType
              releaseQty
              releaseUomValue
              inventory {
                qty
                lockedQty
                palletId
                uom
                location {
                  name
                  description
                }
              }
            }
            bizplace {
              id
              name
              description
            }
            worksheetDetails {
              status
              targetInventory {
                batchId
                product {
                  id
                  name
                  description
                }
                packingType
                releaseQty
                releaseUomValue
                status
                inventory {
                  product {
                    name
                    description
                  }
                }
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      const worksheet = response.data.worksheet
      this.worksheetDetails = worksheet.worksheetDetails
      this._worksheetStatus = worksheet.status
      this._roNo = worksheet?.releaseGood?.name || ''
      this.crossDocking = worksheet?.releaseGood?.crossDocking
      this.ganNo = worksheet?.releaseGood?.arrivalNotice?.name

      this._fillupForm({
        ...worksheet,
        releaseGood: worksheet.releaseGood.name,
        bizplace: worksheet.bizplace.name,
        refNo: worksheet.releaseGood.refNo,
        ownCollection: worksheet.releaseGood.ownTransport,
        releaseDate: worksheet.releaseGood.releaseDate
      })

      if (this._worksheetStatus !== WORKSHEET_STATUS.DEACTIVATED.value) this.fetchWorksheetDetails()

      const { tempOrderInvs, completedOrderInvs } = worksheet.orderInventories.reduce(
        (result, ordInv) => {
          if (ordInv.status === ORDER_INVENTORY_STATUS.PENDING_SPLIT.value) {
            result.tempOrderInvs.push(ordInv)
          } else {
            ordInv.releaseUomValue = Math.round(ordInv.releaseUomValue).toFixed(2) + ' ' + ordInv.inventory.uom

            result.completedOrderInvs.push(ordInv)
          }

          return result
        },
        {
          tempOrderInvs: [],
          completedOrderInvs: []
        }
      )

      this.isPalletPickingOrder = Boolean(!tempOrderInvs || !tempOrderInvs.length)

      this.productGristData = {
        records: tempOrderInvs.map(ordInv => {
          const { compQty, compUomValue } = completedOrderInvs.reduce(
            (result, compOrdInv) => {
              if (this._checkSameOrderInv(ordInv, compOrdInv)) {
                result.compQty += compOrdInv.releaseQty
                result.compUomValue += compOrdInv.releaseUomValue
              }

              // need to round off the completed uomValue to bypass the validation
              result.compUomValue = Math.round(result.compUomValue * 100) / 100

              return result
            },
            { compQty: 0, compUomValue: 0 }
          )

          return {
            ...ordInv,
            bizplaceId: worksheet.bizplace.id,
            completed: compQty === ordInv.releaseQty && compUomValue === ordInv.releaseUomValue
          }
        })
      }

      if (completedOrderInvs && completedOrderInvs.length) {
        this.worksheetDetailData = {
          records: completedOrderInvs.map(item =>
            Object.assign({ description: item.description }, item, item?.inventory, item?.inventory?.location)
          )
        }
      }

      this._updateContext()
    }
  }

  async fetchUnloadingWorksheet() {
    const response = await client.query({
      query: gql`
        query {
          worksheetByOrderNo(${gqlBuilder.buildArgs({
            orderType: WORKSHEET_TYPE.UNLOADING.value,
            orderNo: this.ganNo
          })}) {
            name
            status
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.worksheetByOrderNo
    }
  }

  _checkSameOrderInv(a, b) {
    return a.batchId === b.batchId && a.product?.name === b.product?.name && a.packingType === b.packingType
  }

  async fetchWorksheetDetails(worksheetNo, batchId, productName, packingType) {
    if (worksheetNo && batchId && productName && packingType) {
      await this.fetchWorksheetDetailsByProductGroup(worksheetNo, batchId, productName, packingType)
    } else {
      await this.fetchWholeWorksheetDetails()
    }
  }

  async fetchWorksheetDetailsByProductGroup(worksheetNo, batchId, productName, packingType) {
    const response = await client.query({
      query: gql`
        query {
          worksheetDetailsByProductGroup(${gqlBuilder.buildArgs({
            worksheetNo,
            batchId,
            productName,
            packingType
          })}) {
            items {
              id
              name
              description
              targetInventory {
                releaseQty
                releaseUomValue
                inventory {
                  uom
                  qty
                  lockedQty
                  batchId
                  palletId
                  packingType
                  product {
                    name
                    description
                  }
                  location {
                    name
                    description
                    zone
                  }
                }
              }
              status
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      this.worksheetDetailData = {
        records: response.data.worksheetDetailsByProductGroup.items.map(item => {
          return {
            ...item,
            ...item.targetInventory,
            ...item.targetInventory.inventory,
            ...item.targetInventory.inventory.location,
            description: item.description,
            releaseUomValue: Math.round(item.targetInventory.releaseUomValue).toFixed(2) + ' ' + item.targetInventory.inventory.uom,
            availableQty:
              item.targetInventory.inventory.qty -
              item.targetInventory.inventory.lockedQty +
              item.targetInventory.releaseQty
          }
        }),
        total: response.data.worksheetDetailsByProductGroup.total
      }
    }
  }

  async fetchWholeWorksheetDetails() {
    if (!this._worksheetNo) return
    const response = await client.query({
      query: gql`
        query {
          worksheet(${gqlBuilder.buildArgs({
            name: this._worksheetNo
          })}) {
            worksheetDetails {
              name
              status
              description
              targetInventory {
                batchId
                releaseQty
                releaseUomValue
                product {
                  name
                  description
                }
                packingType
                inventory {
                  qty
                  lockedQty
                  palletId
                  batchId
                  packingType
                  warehouse {
                    name
                    description
                  }
                  location {
                    name
                    description
                  }
                  product {
                    name
                    description
                  }
                  zone
                  uom
                }
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      const worksheetDetails = response.data.worksheet.worksheetDetails

      this.worksheetDetailData = {
        records: worksheetDetails.map(wsd => {
          let record = {
            name: wsd.name,
            description: wsd.description,
            status: wsd.status,
            releaseQty: wsd.targetInventory.releaseQty,
            releaseUomValue: Math.round(wsd.targetInventory.releaseUomValue).toFixed(2) + ' ' + wsd.targetInventory.inventory.uom,
            availableQty:
              wsd.targetInventory.inventory.qty -
              wsd.targetInventory.inventory.lockedQty +
              wsd.targetInventory.releaseQty
          }

          if (wsd.targetInventory?.inventory) {
            record = Object.assign(record, wsd.targetInventory.inventory)
          } else {
            record = Object.assign(record, wsd.targetInventory)
          }

          return record
        })
      }
    }
  }

  _updateContext() {
    this._actions = []

    if (this.crossDocking) {
      this._actions = this._updateCrossDockingContext()
    }

    if (this.undoable) {
      this._actions.push({
        title: i18next.t('button.undo'),
        action: this._undoAssignment.bind(this)
      })
    }

    if (this.activatable) {
      this._actions.push({
        title: i18next.t('button.activate'),
        action: this._activateWorksheet.bind(this)
      })
    }

    if (this.assignable) {
      this._actions.push({
        title: i18next.t('button.auto_assign'),
        action: this._showAutoAssignPopup.bind(this)
      })
    }

    this._actions.push({
      title: i18next.t('button.back'),
      action: () => history.back()
    })

    store.dispatch({ type: UPDATE_CONTEXT, context: this.context })
  }

  get undoable() {
    return this.productGristData.records.some(record => record.completed) && this._selectedProduct?.completed
  }

  get activatable() {
    if (this.productGristData.records.every(record => record.completed)) {
      if (this.crossDocking) {
        return (
          this.unloadingWorksheetStatus === WORKSHEET_STATUS.EXECUTING.value &&
          this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value
        )
      } else {
        return this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value
      }
    }
  }

  get assignable() {
    return !this.productGristData.records.every(record => record.completed)
  }

  _updateCrossDockingContext() {
    let actions = []

    const isWorksheetDeactive = this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value
    const isUnloadingWorksheetExecuted = this.unloadingWorksheetStatus === WORKSHEET_STATUS.EXECUTING.value

    if (isWorksheetDeactive) {
      if (!isUnloadingWorksheetExecuted) {
        actions.push({
          title: i18next.t('button.move_to_x', { state: { x: i18next.t('title.worksheet_unloading') } }),
          action: () => navigate(`worksheet_unloading/${this.unloadingWorksheetNo}`)
        })
      }
    }

    return actions
  }

  _updateGristConfig() {
    const statusColumnConfig = {
      type: 'string',
      name: 'status',
      header: i18next.t('field.status'),
      record: { align: 'center' },
      width: 100
    }

    if (
      !this.preWsdGristConfig.columns.some(e => e.name === 'status') &&
      this._worksheetStatus !== WORKSHEET_STATUS.DEACTIVATED.value
    ) {
      this.preWsdGristConfig.columns = [...this.preWsdGristConfig.columns, statusColumnConfig]
    } else if (
      this.preWsdGristConfig.columns.some(e => e.name === 'status') &&
      this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value
    ) {
      this.preWsdGristConfig.columns.splice(this.preWsdGristConfig.columns.map(e => e.name).indexOf('status'))
    }

    this.wsdGristConfig = { ...this.preWsdGristConfig }
  }

  _fillupForm(data) {
    for (let key in data) {
      Array.from(this.form.querySelectorAll('input, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key) {
          if (data[key] instanceof Object) {
            const objectData = data[key]
            field.value = `${objectData.name} ${objectData.description ? `(${objectData.description})` : ''}`
          } else {
            field.value = data[key]
          }
        }
      })
    }
  }

  _showInventoryAssignPopup() {
    try {
      if (!this._selectedProduct) throw new Error(i18next.t('text.there_is_no_selected_product'))
      openPopup(
        html`
          <inventory-assign-popup
            .worksheetNo="${this._worksheetNo}"
            .batchId="${this._selectedProduct.batchId}"
            .productId="${this._selectedProduct.product.id}"
            .productName="${this._selectedProduct.product.name}"
            .bizplaceId="${this._selectedProduct.bizplaceId}"
            .packingType="${this._selectedProduct.packingType}"
            .releaseQty="${this._selectedProduct.releaseQty}"
            .releaseUomValue="${this._selectedProduct.releaseUomValue}"
            @completed="${async () => {
              await this.fetchOrderInventories()
              await this.fetchWorksheetDetails(
                this._worksheetNo,
                this._selectedProduct.batchId,
                this._selectedProduct.product.name,
                this._selectedProduct.packingType
              )

              this._selectedProduct.completed = true
              this._updateContext()
            }}"
          ></inventory-assign-popup>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.inventory_assign')
        }
      )
    } catch (e) {
      this._showToast(e)
    }
  }

  _showAutoAssignPopup() {
    openPopup(
      html`
        <inventory-auto-assign-popup
          .worksheetNo="${this._worksheetNo}"
          .data="${this.productGrist.data}"
          @completed="${async () => {
            await this.fetchOrderInventories()
            await this.fetchWorksheetDetails(
              this._worksheetNo,
              this._selectedProduct?.batchId,
              this._selectedProduct?.product?.name,
              this._selectedProduct?.packingType
            )

            this._updateContext()
          }}"
        ></inventory-auto-assign-popup>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.inventory_auto_assign')
      }
    )
  }

  async _undoAssignment() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.undo_picking_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      await client.query({
        query: gql`
          mutation {
            undoPickingAssigment(${gqlBuilder.buildArgs({
              worksheetNo: this._worksheetNo,
              batchId: this._selectedProduct.batchId,
              productId: this._selectedProduct.product.id,
              packingType: this._selectedProduct.packingType
            })})
          }
        `
      })

      await this.fetchOrderInventories()
      await this.fetchWorksheetDetails(
        this._worksheetNo,
        this._selectedProduct.batchId,
        this._selectedProduct.product.name,
        this._selectedProduct.packingType
      )

      this._selectedProduct.completed = false
      this._updateContext()
    } catch (e) {
      this._showToast(e)
    }
  }

  async _activateWorksheet() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.activate_picking_worksheet'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            activatePicking(${gqlBuilder.buildArgs({
              worksheetNo: this._worksheetNo
            })}) {
              name
            }
          }
        `
      })
      if (!response.errors) {
        this._showToast({ message: i18next.t('text.worksheet_activated') })
        await this.fetchOrderInventories()
        this._updateContext()
        navigate(`outbound_worksheets`)
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getPickingWorksheetDetails() {
    return this.productGrist.dirtyData.records.map(worksheetDetail => {
      return {
        name: worksheetDetail.name,
        description: worksheetDetail.description
      }
    })
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

window.customElements.define('worksheet-picking', WorksheetPicking)
