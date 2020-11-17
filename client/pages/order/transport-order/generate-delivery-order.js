import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_INVENTORY_STATUS, ORDER_STATUS, WORKSHEET_STATUS } from '../../constants'
import './inventory-assign-popup'
import './inventory-auto-assign-popup'

class WorksheetPicking extends localize(i18next)(PageView) {
  static get properties() {
    return {
      isPalletPickingOrder: Boolean,
      ownCollection: Boolean,
      truckNo: String,
      _truckExist: Boolean,
      _bizplaces: Array,
      _driverList: Array,
      _truckList: Array,
      _hideInfoForm: Boolean,
      _otherDestination: Boolean,
      _worksheetNo: String,
      _worksheetStatus: String,
      productGristConfig: Object,
      wsdGristConfig: Object,
      productGristData: Object,
      worksheetDetailData: Object
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
    this._otherDestination = false
    this._hideInfoForm = true
  }

  get context() {
    return {
      title: i18next.t('title.worksheet_picking'),
      actions: [{ title: i18next.t('button.submit'), action: this._generateDeliveryOrder.bind(this) }],
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
            <legend>${i18next.t('title.choose_customer')}</legend>
            <label>${i18next.t('label.customer')}</label>
            <select
              name="bizplace"
              @change="${e => {
                this._customerSelected = e.currentTarget.value
                if (this._customerSelected) {
                  this._hideInfoForm = false
                  this._fetchReleaseOrder(this._customerSelected)
                }
              }}"
            >
              <option value="">-- ${i18next.t('text.please_select_a_customer')} --</option>
              ${(this.bizplaces || []).map(
                bizplace => html` <option value="${bizplace && bizplace.id}">${bizplace && bizplace.name}</option> `
              )}
            </select>
          </fieldset>

          <fieldset .hidden=${this._hideInfoForm}>
            <legend>${i18next.t('title.delivery_information')}</legend>
            <label>${i18next.t('label.delivery_date')}</label>
            <input name="deliveryDate" type="date" min="${this._getStdDate()}" required />

            <label>${i18next.t('label.driver_name')}</label>
            <input name="otherDriver" ?hidden="${!this.ownCollection}" />
            <select name="ownDriver" ?hidden="${this.ownCollection}">
              <option value="">-- ${i18next.t('text.please_select_a_driver')} --</option>
              ${(this._driverList || []).map(
                driver => html` <option value="${driver && driver.name}">${driver && driver.name}</option> `
              )}
            </select>

            <label>${i18next.t('label.truck_no')}</label>
            <input name="otherTruck" ?hidden="${!this.ownCollection}" value="${this.truckNo}" />
            <select name="ownTruck" ?hidden="${this.ownCollection}">
              <option value="">-- ${i18next.t('text.please_select_a_truck')} --</option>
              ${(this._truckList || []).map(
                truck => html` <option value="${truck && truck.name}">${truck && truck.name}</option> `
              )}
            </select>

            <label ?hidden="${this._otherDestination}">${i18next.t('label.to')}</label>
            <select name="contactPoint" ?hidden="${this._otherDestination}">
              <option value="">-- ${i18next.t('text.please_select_a_destination')} --</option>
              ${(this.contactPoints || []).map(
                cp => html` <option value="${cp && cp.id}">${cp && cp.contactName},${cp && cp.address}</option> `
              )}
            </select>

            <input
              name="otherDestBoolean"
              type="checkbox"
              ?checked="${this._otherDestination}"
              @change="${e => (this._otherDestination = e.currentTarget.checked)}"
            />
            <label>${i18next.t('label.other_destination')}</label>

            <label ?hidden="${!this._otherDestination}">${i18next.t('label.contact_name')}</label>
            <input name="contactName" ?hidden="${!this._otherDestination}" />

            <label ?hidden="${!this._otherDestination}">${i18next.t('label.other_destination')}</label>
            <textarea name="otherDestination" ?hidden="${!this._otherDestination}"></textarea>
          </fieldset>
        </form>
      </div>

      <div class="grist">
        ${this._worksheetStatus === WORKSHEET_STATUS.DEACTIVATED.value && !this.isPalletPickingOrder
          ? html`
              <div class="grist-column">
                <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.release_order')}</h2>

                <data-grist
                  id="ro-grist"
                  .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
                  .config=${this.roGristConfig}
                  .data="${this.roGristData}"
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

  async firstUpdated() {
    this._driverList = await this._fetchTruckDriver()
    this._truckList = await this._fetchTrucks()
    this._bizplaces = await this._fetchBizplaces()
  }

  pageInitialized() {
    this.roGristConfig = {
      pagination: { infinite: true },
      rows: {
        appendable: false,
        handlers: {
          click: async (columns, data, column, record, rowIndex) => {
            if (record.name) {
              await this.fetchWorksheetDetails(record.name)
              this._selectedProduct = {
                batchId: record.batchId,
                productName: record.productName,
                packingType: record.packingType,
                releaseQty: record.releaseQty,
                releaseStdUnitValue: record.releaseStdUnitValue
              }
            }
          }
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'assignment',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._selectedProduct = {
                batchId: record.batchId,
                productName: record.productName,
                bizplaceId: record.bizplaceId,
                packingType: record.packingType,
                releaseQty: record.releaseQty,
                releaseStdUnitValue: record.releaseStdUnitValue
              }
              this._showInventoryAssignPopup()
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'date',
          name: 'releaseDate',
          header: i18next.t('field.release_date'),
          record: { align: 'left' },
          width: 250
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
          name: 'qty',
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
          type: 'float',
          name: 'releaseStdUnitValue',
          header: i18next.t('field.release_std_unit_value'),
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

  async _fetchReleaseOrder(bizplace) {
    const response = await client.query({
      query: gql`
          query {
            releaseGoodRequests(${gqlBuilder.buildArgs({
              filters: [
                { name: 'bizplace', operator: 'eq', value: bizplace },
                { name: 'status', operator: 'eq', value: ORDER_STATUS.LOADING }
              ],
              pagination: { page, limit },
              sortings: sorters
            })}) {
              items {
                id
                bizplace {
                  id
                  name
                  description
                }
                name
                releaseDate
                status
                refNo
                ownTransport
                exportOption
                updatedAt
                updater {
                  id
                  name
                  description
                }
              }
              total
            }
          }
        `
    })

    if (!response.errors) {
      this.productGristData = {
        records: response.data.releaseGoodRequests.items || []
      }
    }
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
              releaseDate
            }
            orderInventories {
              status
              batchId
              productName
              packingType
              releaseQty
              releaseStdUnitValue
              inventory {
                qty
                palletId
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
                productName
                packingType
                releaseQty
                releaseStdUnitValue
                status
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
      this._roNo = (worksheet.releaseGood && worksheet.releaseGood.name) || ''

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
          } else if (ordInv.status === ORDER_INVENTORY_STATUS.READY_TO_PICK.value) {
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

      if (completedOrderInvs && completedOrderInvs.length) {
        this.worksheetDetailData = {
          records: completedOrderInvs.map(item => {
            return {
              ...item,
              ...item.inventory,
              product: { name: item.productName },
              ...item.inventory.location,
              description: item.description
            }
          })
        }
      } else {
        this.worksheetDetailData = { records: [] }
      }
    }
  }

  _checkSameOrderInv(a, b) {
    return a.batchId === b.batchId && a.productName === b.productName && a.packingType === b.packingType
  }

  async fetchWorksheetDetails(roNo) {
    if (roNo) {
      await this.fetchWorksheetDetailsByProductGroup(worksheetNo, batchId, productName, packingType)
    } else {
      await this.fetchWholeWorksheetDetails()
    }
  }

  async _fetchBizplaces(bizplace = []) {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: [...bizplace]
            })}) {
              items{
                id
                name
                description
              }
            }
          }
        `
    })
    return response.data.bizplaces.items
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
                productName
                releaseQty
                releaseStdUnitValue
                inventory {
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
            description: item.description
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
                releaseQty
                releaseStdUnitValue                
                inventory {
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
                  qty
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
        records: worksheetDetails.map(worksheetDetail => {
          return {
            ...worksheetDetail.targetInventory.inventory,
            name: worksheetDetail.name,
            description: worksheetDetail.description,
            status: worksheetDetail.status,
            releaseQty: worksheetDetail.targetInventory.releaseQty,
            releaseStdUnitValue: worksheetDetail.targetInventory.releaseStdUnitValue
          }
        })
      }
    }
  }

  async _fetchTrucks() {
    const response = await client.query({
      query: gql`
      query {
        transportVehicles(${gqlBuilder.buildArgs({
          filters: [],
          sortings: [{ name: 'name' }]
        })}) {
          items {
            id
            name
          }
        }
      }
    `
    })

    if (!response.errors) {
      return response.data.transportVehicles.items || []
    }
  }

  async _fetchTruckDriver() {
    const response = await client.query({
      query: gql`
      query {
        transportDrivers(${gqlBuilder.buildArgs({
          filters: [],
          sortings: [{ name: 'name' }]
        })}) {
          items{
              id
              name
              driverCode
            }
        }
      }
    `
    })

    if (!response.errors) {
      return response.data.transportDrivers.items || []
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
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
            .productName="${this._selectedProduct.productName}"
            .bizplaceId="${this._selectedProduct.bizplaceId}"
            .packingType="${this._selectedProduct.packingType}"
            .releaseQty="${this._selectedProduct.releaseQty}"
            .releaseStdUnitValue="${this._selectedProduct.releaseStdUnitValue}"
            @completed="${async () => {
              await this.fetchOrderInventories()
              await this.fetchWorksheetDetails(
                this._worksheetNo,
                this._selectedProduct.batchId,
                this._selectedProduct.productName,
                this._selectedProduct.packingType
              )
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
              this._selectedProduct.batchId,
              this._selectedProduct.productName,
              this._selectedProduct.packingType
            )
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

  async _generateDeliveryOrder() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.generate_delivery_order'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            generateDeliveryOrder(${gqlBuilder.buildArgs({
              worksheetNo: this._getPickingWorksheetDetails
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
