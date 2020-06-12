import '@things-factory/barcode-ui'
import { getCodeByName } from '@things-factory/code-base'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { getRenderer } from '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../components/popup-note'
import '../components/vas-templates'
import { WORKSHEET_STATUS } from '../inbound/constants/worksheet'
import { BATCH_AND_PRODUCT_TYPE, BATCH_NO_TYPE, ETC_TYPE, ORDER_TYPES, PRODUCT_TYPE } from '../order/constants'
import './target-inventory-assignment-popup'

class WorksheetRefVas extends localize(i18next)(PageView) {
  static get properties() {
    return {
      // 상위 리스트 화면에서 선택한 작업지시서의 name
      // 작업 지시서의 상세 항목을 조회하기 위한 Key
      _worksheetNo: String,
      // 화면 상단에 노출되는 폼을 채워 넣기 위한 오브젝트
      formData: Object,
      // VAS 작업은 여러개의 작업 리스트가 하나의 세트를 구성하고 있고
      // 작업 세트를 출력하기 위한 Grist의 설정
      taskGristConfig: Object,
      // 작업 세트 데이터
      taskData: Object,
      // Template Element
      _template: Object
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
        .container {
          overflow: hidden;
          display: flex;
          flex: 1;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .guide-container {
          display: flex;
          margin: auto;
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
      title: i18next.t('title.worksheet_vas'),
      actions: [{ title: i18next.t('button.back'), action: () => history.back() }],
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
            <legend>${i18next.t('title.vas')}</legend>
            ${this.formData.orderType === ORDER_TYPES.ARRIVAL_NOTICE.value
              ? html` <label>${i18next.t('label.arrival_notice')}</label>
                  <input readonly value="${this.formData.orderNo}" />`
              : this.formData.orderType === ORDER_TYPES.RELEASE_OF_GOODS.value
              ? html` <label>${i18next.t('label.release_goods')}</label>
                  <input readonly value="${this.formData.orderNo}" />`
              : ''}
            <!-- TODO: Showing reference order number -->
            <label>${i18next.t('label.customer')}</label>
            <input name="bizplace" readonly value="${this.formData.customer}" />

            <label>${i18next.t('label.status')}</label>
            <input name="status" readonly value="${this.formData.status}" />
          </fieldset>
        </form>

        <!-- TODO: Get reference order number to show QR code -->
        <barcode-tag bcid="qrcode" .value=${this.formData.orderNo}></barcode-tag>
      </div>

      <div class="container">
        <data-grist
          class="right"
          .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
          .config="${this.taskGristConfig}"
          .data="${this.taskData}"
        ></data-grist>
      </div>

      <div class="guide-container">
        ${this._template}
      </div>
    `
  }

  constructor() {
    super()
    this.formData = {
      customer: '',
      status: '',
      arrivalNotice: '',
      releaseGood: '',
      vasOrder: '',
      orderType: ''
    }
    this.taskData = { records: [] }
  }

  pageInitialized() {
    this.taskGristConfig = {
      rows: { appendable: false, handlers: { click: this.taskGristClickHandler.bind(this) } },
      list: { fields: ['set', 'vas', 'status'] },
      pagination: { infinite: true },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'string',
          name: 'set',
          header: i18next.t('field.set'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'string',
          name: 'targetBatchId',
          header: i18next.t('field.target_batch_id'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'object',
          name: 'targetProduct',
          header: i18next.t('field.target_product'),
          record: { align: 'center' },
          width: 200
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'otherTarget',
          header: i18next.t('field.other_target'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { align: 'center' },
          width: 250
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          width: 200
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          width: 250
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.comment'),
          width: 250
        },
        {
          type: 'string',
          name: 'issue',
          header: i18next.t('field.issue'),
          width: 250
        }
      ]
    }
  }

  async pageUpdated(changes) {
    if (this.active) {
      if (changes.resourceId) this._worksheetNo = changes.resourceId
      await this.fetchWorksheet()
    }
  }

  /**
   * @description Get worksheet set and format it to show in grist
   */
  async fetchWorksheet() {
    if (!this._worksheetNo) return

    const response = await client.query({
      query: gql`
        query {
          worksheet(${gqlBuilder.buildArgs({
            name: this._worksheetNo
          })}) {
            bizplace {
              name
            }
            status
            arrivalNotice {
              name
            }
            vasOrder {
              name
            }
            releaseGood {
              name
            }
            worksheetDetails {
              targetVas {
                set
                targetBatchId
                targetProduct {
                  name
                  description
                }
                packingType
                otherTarget
                vas {
                  name
                  description
                  operationGuide
                }
                status
                remark
                operationGuide
              }
              description
              issue
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.worksheet = response.data.worksheet
      this.formData = this.formatFormData()
      this.taskData = this.formatTaskData()
    }
  }

  formatFormData() {
    const orderType = this.worksheet.arrivalNotice?.name
      ? ORDER_TYPES.ARRIVAL_NOTICE.value
      : this.worksheet.releaseGood?.name
      ? ORDER_TYPES.RELEASE_OF_GOODS.value
      : ORDER_TYPES.VAS_ORDER.value
    const formData = {
      customer: this.worksheet.bizplace.name,
      status: this.worksheet.status,
      arrivalNotice: this.worksheet.arrivalNotice?.name,
      releaseGood: this.worksheet.releaseGood?.name,
      vasOrder: this.worksheet.vasOrder?.name,
      orderType
    }

    formData.orderNo =
      this.worksheet.arrivalNotice?.name || this.worksheet.releaseGood?.name || this.worksheet.vasOrder?.name

    return formData
  }

  formatTaskData() {
    return {
      records: this.worksheet.worksheetDetails.map(wsd => {
        return { ...wsd.targetVas, description: wsd.description, issue: wsd.issue }
      })
    }
  }

  taskGristClickHandler(columns, data, column, record, rowIndex) {
    if (record.operationGuide && record.vas.operationGuide) {
      this._template = document.createElement(record.vas.operationGuide)
      this._template.record = { ...record, operationGuide: JSON.parse(record.operationGuide) }
    } else {
      this._template = null
    }

    if (column.name === 'issue' && record.issue) {
      this._showIssueNotePopup(record)
    }
  }

  _showIssueNotePopup(record) {
    openPopup(html` <popup-note title="${record.batchId}" value="${record.issue}" .readonly="${true}"></popup-note> `, {
      backdrop: true,
      size: 'medium',
      title: i18next.t('title.issue_note')
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

window.customElements.define('worksheet-ref-vas', WorksheetRefVas)
