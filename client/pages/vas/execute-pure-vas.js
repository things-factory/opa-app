import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { html } from 'lit-element'
import { AbstractExecuteVas } from './abastract-execute-vas'

class ExecutePureVas extends localize(i18next)(AbstractExecuteVas) {
  render() {
    return html`
      <form class="multi-column-form" id="info-form">
        <fieldset>
          <legend>${`${i18next.t('title.vas_order')}: ${this.orderNo || ''}`}</legend>

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

        <div class="right-column">
          <form id="detail-info-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('label.vas')}: ${this._vasName}</legend>

              <label>${i18next.t('label.pallet')}</label>
              <input name="palletId" readonly />

              <label>${i18next.t('label.qty')}</label>
              <input name="qty" readonly />

              <label>${i18next.t('label.weight')}</label>
              <input name="weight" readonly />

              <label>${i18next.t('label.remark')}</label>
              <input name="remark" readonly />

              <label>${i18next.t('label.comment')}</label>
              <input name="description" readonly />
            </fieldset>
          </form>

          ${this._template}
        </div>
      </div>
    `
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
          weight
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
            weight
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
  }

  _fillUpDetailInfoForm(data) {
    const palletIdInput = this.detailInfoForm.querySelector('input[name=palletId]')
    const qtyInput = this.detailInfoForm.querySelector('input[name=qty]')
    const weightInput = this.detailInfoForm.querySelector('input[name=weight]')
    const remarkInput = this.detailInfoForm.querySelector('input[name=remark]')
    const descriptionInput = this.detailInfoForm.querySelector('input[name=description]')

    palletIdInput.value = data.palletId
    qtyInput.value = data.qty
    weightInput.value = data.weight
    remarkInput.value = data.remark
    descriptionInput.value = data.description
  }
}

window.customElements.define('execute-pure-vas', ExecutePureVas)
