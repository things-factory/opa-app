import '@things-factory/barcode-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { html } from 'lit-element'
import { ARRIVAL_NOTICE, RELEASE_OF_GOODS } from '../constants'
import { AbstractExecuteVas } from './abstract-execute-vas'

class ExecuteRefVas extends localize(i18next)(AbstractExecuteVas) {
  render() {
    return html`
      <form class="multi-column-form" id="info-form">
        <fieldset>
          ${this.orderType === ARRIVAL_NOTICE.value
            ? html` <legend>${`${i18next.t('title.arrival_notice')}: ${this.orderNo || ''}`}</legend>
                <label>${i18next.t('label.container_no')}</label>
                <input name="containerNo" readonly />`
            : this.orderType === RELEASE_OF_GOODS.value
            ? html` <legend>${`${i18next.t('title.release_order')}: ${this.orderNo}`}</legend> `
            : ''}

          <label>${i18next.t('label.customer')}</label>
          <input name="bizplaceName" readonly />

          <label>${i18next.t('label.started_at')}</label>
          <input name="startedAt" type="datetime-local" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <div class="left-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.vas')}</h2>
          <data-grist
            id="vas-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.vasGristConfig}
            .data=${this.vasSets}
          ></data-grist>

          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.task_list')}</h2>
          <data-grist
            id="task-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.taskGristConfig}
            .data=${this.vasTasks}
            @record-change="${e => {
              e.detail.after.validity = e.detail.after.actualQty === e.detail.after.packQty
            }}"
          ></data-grist>
        </div>

        <div class="right-column" @completed="${this._templateCompletedHandler.bind(this)}">
          <form id="detail-info-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('label.vas')}: ${this._vasName}</legend>

              <label>${i18next.t('label.qty')}</label>
              <input name="qty" readonly />

              <label>${i18next.t('label.uom_value')}</label>
              <input name="uomValue" readonly />

              <label>${i18next.t('label.remark')}</label>
              <input name="remark" readonly />
            </fieldset>
          </form>

          ${this._template ? html`${this._template}` : ''}
        </div>
      </div>
    `
  }

  get palletIdInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=palletId]')?.shadowRoot?.querySelector('input')
  }

  get fetchVasQuery() {
    return /* GraphQL */ `query {
      vasWorksheet(${gqlBuilder.buildArgs({
        orderNo: this.orderNo,
        orderType: this.orderType
      })}) {
        worksheetInfo {
          bizplaceName
          startedAt
          containerNo
        }
        worksheetDetailInfos {
          batchId
          name
          targetName
          status
          issue
          set
          targetType
          targetBatchId
          targetProduct {
            id
            name
            description
          }
          otherTarget
          qty
          uomValue
          operationGuide
          vas {
            id
            name
            description
            operationGuide
            operationGuideType
          }
          inventory {
            palletId
            qty
            uomValue
          }
          description
          remark
        }
      }
    }`
  }

  _fillUpInfoForm(data) {
    const bizplaceNameInput = this.infoForm.querySelector('input[name=bizplaceName]')
    const startedAtInput = this.infoForm.querySelector('input[name=startedAt')

    bizplaceNameInput.value = data.bizplaceName

    const datetime = Number(data.startedAt)
    const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
    startedAtInput.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)

    if (this.orderType === ARRIVAL_NOTICE.value) {
      const containerNoInput = this.infoForm.querySelector('input[name=containerNo]')
      containerNoInput.value = data.containerNo || ''
    }
  }

  _fillUpDetailInfoForm(data) {
    const qtyInput = this.detailInfoForm.querySelector('input[name=qty]')
    const uomValueInput = this.detailInfoForm.querySelector('input[name=uomValue]')
    const remarkInput = this.detailInfoForm.querySelector('input[name=remark]')
    qtyInput.value = data.qty
    uomValueInput.value = data.uomValue
    remarkInput.value = data.remark || ''
  }

  async inputFormKeypressHandler(e) {
    if (e.keyCode === 13) {
      await this._executeVas()
    }
  }

  checkExecutionValidity() {
    // 1. validate for vas selection
    if (!this._selectedVas) throw new Error(i18next.t('text.target_is_not_selected'))
    // 2. pallet id is required for reference vas

    if (
      this._template &&
      this._template.checkExecutionValidity &&
      typeof this._template.checkExecutionValidity === 'function'
    ) {
      this._template.checkExecutionValidity()
    }
  }

  /**
   * @description Be called after requesting executeVas resolver
   */
  resetView() {
    this._selectedVas = null
    this._selectedTaskStatus = null
    this.clearVasTemplate()
    this.infoForm.reset()
    this.detailInfoForm.reset()
    if (this.palletIdInput) {
      this.palletIdInput.value = ''
    }
  }

  /**
   * @description Override AbstractExecuteVas
   * For VAS which comes together with Arrival notice or Release order
   * Those type of VAS order should assign inventory within executing transaction
   */
  _getExecuteArgs() {
    const worksheetDetail = this.taskGrist.dirtyData.records.filter(record => record.name === this._selectedVas.name)[0]
    let vasWorkseetDetail = { name: worksheetDetail.name }
    if (worksheetDetail.issue) vasWorkseetDetail.issue = worksheetDetail.issue
    const args = {
      worksheetDetail: vasWorkseetDetail
    }
    const palletId = this.palletIdInput?.value
    if (palletId) {
      args.palletId = palletId
    }
    return args
  }
}

window.customElements.define('execute-ref-vas', ExecuteRefVas)
