import '@things-factory/barcode-ui'
import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { getRenderer } from '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import {
  client,
  CustomAlert,
  gqlBuilder,
  isMobileDevice,
  navigate,
  PageView,
  store,
  UPDATE_CONTEXT
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/popup-note'
import '../components/vas-relabel'
import { WORKSHEET_STATUS } from '../inbound/constants/worksheet'
import { ORDER_TYPES, PRODUCT_TYPE, ETC_TYPE, BATCH_NO_TYPE } from '../order/constants'

class ExecuteVas extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      orderNo: String,
      orderType: String,
      vasGristConfig: Object,
      taskGristConfig: Object,
      vasSets: Object,
      vasTasks: Object,
      _vasName: String,
      _selectedTaskStatus: String,
      _template: Object
    }
  }

  static get styles() {
    return [
      SingleColumnFormStyles,
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }

        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex: 1;
        }

        .left-column {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .right-column {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        data-grist {
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

        @media (max-width: 460px) {
          :host {
            display: block;
          }

          .grist {
            min-height: 500px;
          }
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.vas')
    }
  }

  get orderNoInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=orderNo]').shadowRoot.querySelector('input')
  }

  get orderTypeInput() {
    return this.shadowRoot.querySelector('select[name=orderType]')
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get inputForm() {
    return this.shadowRoot.querySelector('form#input-form')
  }

  get taskGrist() {
    return this.shadowRoot.querySelector('data-grist#task-grist')
  }

  render() {
    return html`
      <form class="multi-column-form" id="info-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.order_no')}</label>
          <barcode-scanable-input
            name="orderNo"
            custom-input
            @keypress="${e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this.orderNo = e.currentTarget.value
                this.orderType = this.orderTypeInput.value
                this._fetchVass()
              }
            }}"
          ></barcode-scanable-input>

          <label>${i18next.t('label.order_type')}</label>
          <select
            name="orderType"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this.orderNo = this.orderNoInput.value
                this.orderType = e.currentTarget.value
                this._fetchVass()
              }
            }}"
          >
            <option></option>
            ${Object.keys(ORDER_TYPES).map(
              key => html`
                <option value="${ORDER_TYPES[key].value}">${i18next.t(`label.${ORDER_TYPES[key].name}`)}</option>
              `
            )}
          </select>
        </fieldset>

        <fieldset>
          <legend ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}">
            ${`${i18next.t('title.arrival_notice')}: ${this.orderNo}`}
          </legend>

          <label ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}">${i18next.t('label.customer')}</label>
          <input ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}" name="bizplaceName" readonly />

          <label ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}"
            >${i18next.t('label.container_no')}</label
          >
          <input ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}" name="containerNo" readonly />

          <label ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}"
            >${i18next.t('label.started_at')}</label
          >
          <input
            ?hidden="${this.orderType !== ORDER_TYPES.ARRIVAL_NOTICE.value}"
            name="startedAt"
            type="datetime-local"
            readonly
          />
        </fieldset>

        <fieldset>
          <legend ?hidden="${this.orderType !== ORDER_TYPES.VAS_ORDER.value}">
            ${`${i18next.t('title.vas_order')}: ${this.orderNo}`}
          </legend>

          <label ?hidden="${this.orderType !== ORDER_TYPES.VAS_ORDER.value}">${i18next.t('label.customer')}</label>
          <input ?hidden="${this.orderType !== ORDER_TYPES.VAS_ORDER.value}" name="bizplaceName" readonly />

          <label ?hidden="${this.orderType !== ORDER_TYPES.VAS_ORDER.value}">${i18next.t('label.started_at')}</label>
          <input
            ?hidden="${this.orderType !== ORDER_TYPES.VAS_ORDER.value}"
            name="startedAt"
            type="datetime-local"
            readonly
          />
        </fieldset>

        <fieldset>
          <legend ?hidden="${this.orderType !== ORDER_TYPES.RELEASE_OF_GOODS.value}">
            ${`${i18next.t('title.release_order')}: ${this.orderNo}`}
          </legend>

          <label ?hidden="${this.orderType !== ORDER_TYPES.RELEASE_OF_GOODS.value}"
            >${i18next.t('label.customer')}</label
          >
          <input ?hidden="${this.orderType !== ORDER_TYPES.RELEASE_OF_GOODS.value}" name="bizplaceName" readonly />

          <label ?hidden="${this.orderType !== ORDER_TYPES.RELEASE_OF_GOODS.value}"
            >${i18next.t('label.started_at')}</label
          >
          <input
            ?hidden="${this.orderType !== ORDER_TYPES.RELEASE_OF_GOODS.value}"
            name="startedAt"
            type="datetime-local"
            readonly
          />
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
          <form id="input-form" class="single-column-form">
            <fieldset>
              <legend>${i18next.t('label.vas')}: ${this._vasName}</legend>

              <label>${i18next.t('label.location')}</label>
              <input name="locationInv" readonly />

              <label>${i18next.t('label.vas')}</label>
              <input name="vas" readonly />

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

  constructor() {
    super()
    this._vasName = ''
    this.orderNo = ''
    this._selectedVas = null
    this._selectedTaskStatus = null
  }

  updated(changedProps) {
    if (changedProps.has('_selectedTaskStatus') && this._selectedTaskStatus) {
      this._updateContext()
    }
  }

  pageInitialized() {
    this.vasGristConfig = {
      list: { fields: ['completed', 'targetType', 'targetDisplay', 'vasCount', 'qty'] },
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            this._selectedVasSet = record.set
            this.vasTasks = { records: record.tasks }
          }
        }
      },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'completed',
          header: i18next.t('field.completed'),
          width: 40
        },
        {
          type: 'string',
          name: 'targetType',
          header: i18next.t('field.target_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'target',
          header: i18next.t('field.target'),
          record: {
            renderer: (value, column, record, rowIndex, field) => {
              if (record.targetType === BATCH_NO_TYPE) {
                return getRenderer()(record.targetBatchId, column, record, rowIndex, field)
              } else if (record.targetType === PRODUCT_TYPE) {
                return getRenderer('object')(record.targetProduct, column, record, rowIndex, field)
              } else if (record.targetType === ETC_TYPE) {
                return getRenderer()(record.otherTarget, column, record, rowIndex, field)
              }
            },
            align: 'center'
          },
          width: 250
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'vasCount',
          header: i18next.t('field.vas_count'),
          record: { align: 'center' },
          width: 100
        }
      ]
    }

    this.taskGristConfig = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (data.records.length && record) {
              this._selectedVas = record
              this._selectedTaskStatus = null
              this._selectedTaskStatus = record.status
              this._vasName = `${record.vas.name} ${record.vas.description ? `(${record.vas.description})` : ''}`

              this.inputForm.reset()
              this._fillUpInputForm(record)

              if (record.vas.operationGuideType && record.vas.operationGuideType === 'template') {
                this._template = document.createElement(record.vas.operationGuide)
                this._template.record = { ...record, operationGuide: JSON.parse(record.operationGuide) }
              } else {
                this._template = null
              }
            }
          }
        }
      },
      pagination: {
        infinite: true
      },
      list: { fields: ['complete', 'vas', 'issue'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'boolean',
          name: 'completed',
          header: i18next.t('field.completed'),
          records: { editable: false },
          width: 40
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          width: 200
        },
        {
          type: 'string',
          name: 'issue',
          header: i18next.t('field.issue'),
          width: 300
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this._focusOnBarcodeField()
    }
  }

  _updateContext() {
    let actions = []

    if (this._selectedTaskStatus === WORKSHEET_STATUS.EXECUTING.value) {
      actions = [
        ...actions,
        { title: i18next.t('button.issue'), action: this._openIssueEditor.bind(this) },
        { title: i18next.t('button.done'), action: this._executeVas.bind(this) }
      ]
    } else if (this._selectedTaskStatus === WORKSHEET_STATUS.DONE.value) {
      actions = [...actions, { title: i18next.t('button.undo'), action: this._undoVas.bind(this) }]
    }

    if (this.vasSets && this.vasSets.records && this.vasSets.records.every(record => record.completed)) {
      actions = [...actions, { title: i18next.t('button.complete'), action: this._complete.bind(this) }]
    }

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: {
        title: i18next.t('title.vas'),
        actions
      }
    })
  }

  _focusOnBarcodeField() {
    setTimeout(() => this.orderNoInput.focus(), 100)
  }

  async _fetchVass() {
    const orderNo = this.orderNo ? this.orderNo : this.orderNoInput.value
    const orderType = this.orderType ? this.orderType : this.orderTypeInput.value
    if (!orderNo) {
      this._showToast({ message: i18next.t('text.order_no_is_empty') })
      return
    }

    if (!orderType) {
      this._showToast({ message: i18next.t('text.order_type_is_empty') })
      return
    }

    this._clearView()
    const response = await client.query({
      query: gql`
        query {
          vasWorksheet(${gqlBuilder.buildArgs({
            orderNo,
            orderType
          })}) {
            worksheetInfo {
              bizplaceName
              containerNo
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
              operationGuide
              locationInv 
              vas {
                id
                name
                description
                operationGuide
                operationGuideType
              }
              description
              remark
            }
          }
        }
      `
    })

    if (!response.errors) {
      this.orderNo = orderNo
      this.orderType = orderType
      this._fillUpInfoForm(response.data.vasWorksheet.worksheetInfo)

      const records = this._formatData(response.data.vasWorksheet.worksheetDetailInfos)
      this.vasSets = { records }

      if (this._selectedVasSet) {
        this.vasTasks = { records: records.find(record => record.set === this._selectedVasSet).tasks }
      }

      if (this.vasSets && this.vasSets.records && this.vasSets.records.every(record => record.completed)) {
        this._complete()
      }

      this._updateContext()
    }
  }

  _formatData(tasks) {
    return tasks
      .reduce((vasSet, task) => {
        if (vasSet.find(vas => vas.set === task.set)) {
          vasSet = vasSet.map(vas => {
            if (vas.set === task.set) {
              vas.tasks.push(this._formatTask(task))
            }
            return vas
          })
        } else {
          vasSet.push({
            set: task.set,
            targetType: task.targetType,
            targetBatchId: task.targetBatchId,
            targetProduct: task.targetProduct,
            otherTarget: task.otherTarget,
            qty: task.qty,
            tasks: [...(vasSet.tasks || []), this._formatTask(task)]
          })
        }

        return vasSet
      }, [])
      .map(vasSet => {
        return {
          ...vasSet,
          completed: vasSet.tasks.every(task => task.completed),
          vasCount: vasSet.tasks.length
        }
      })
  }

  _formatTask(task) {
    return {
      name: task.name,
      vas: task.vas,
      remark: task.remark,
      status: task.status,
      locationInv: task.locationInv,
      operationGuide: task.operationGuide,
      completed: task.status === WORKSHEET_STATUS.DONE.value,
      description: task.description
    }
  }

  _clearView() {
    this.vasSets = { records: [] }
    this.vasTasks = { records: [] }
    this.inputForm.reset()
    this._selectedVas = null
    this._selectedTaskStatus = null
  }

  _fillUpInfoForm(data) {
    for (let key in data) {
      Array.from(this.infoForm.querySelectorAll('input, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
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

  _fillUpInputForm(data) {
    for (let key in data) {
      Array.from(this.inputForm.querySelectorAll('input, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
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

  _openIssueEditor() {
    openPopup(
      html`
        <popup-note
          .title="${i18next.t('title.issue')}"
          .value="${this._selectedVas && this._selectedVas.issue ? this._selectedVas.issue : ''}"
          @submit="${async e => {
            this.vasTasks = {
              records: this.vasTasks.records.map(record => {
                if (record.name === this._selectedVas.name) record.issue = e.detail.value
                return record
              })
            }
          }}"
        ></popup-note>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.vas_issue')
      }
    )
  }

  async _executeVas() {
    try {
      this._validate()
      const response = await client.query({
        query: gql`
          mutation {
            executeVas(${gqlBuilder.buildArgs({
              worksheetDetail: this._getVasWorksheetDetail()
            })})
          }
        `
      })

      if (!response.errors) {
        this._selectedVas = null
        this._selectedTaskStatus = null
        this.infoForm.reset()
        this.inputForm.reset()
        this._fetchVass()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _undoVas() {
    try {
      this._validate()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.undo_vas'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            undoVas(${gqlBuilder.buildArgs({
              worksheetDetail: { name: this._selectedVas.name }
            })})
          }
        `
      })

      if (!response.errors) {
        this._selectedVas = null
        this._selectedTaskStatus = null
        this.infoForm.reset()
        this.inputForm.reset()
        this._fetchVass()
        this._updateContext()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validate() {
    // 1. validate for vas selection
    if (!this._selectedVas) throw new Error(i18next.t('text.target_doesnt_selected'))
  }

  _getVasWorksheetDetail() {
    const worksheetDetail = this.taskGrist.dirtyData.records.filter(record => record.name === this._selectedVas.name)[0]
    let vasWorkseetDetail = { name: worksheetDetail.name }
    if (worksheetDetail.issue) vasWorkseetDetail.issue = worksheetDetail.issue
    return vasWorkseetDetail
  }

  async _complete() {
    try {
      this._validateComplete()

      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.vas_has_been_completed'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) return

      const response = await client.query({
        query: gql`
          mutation {
            completeVas(${gqlBuilder.buildArgs({
              orderNo: this.orderNo,
              orderType: this.orderType
            })})
          }
        `
      })

      if (!response.errors) {
        this._clearView()
        this._selectedVasSet = null
        this._showToast({ message: i18next.t('text.vas_is_completed') })
        navigate('vas_worksheets')
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateComplete() {
    const tasks = this.vasSets.records.map(vasSet => vasSet.tasks).flat()
    if (!tasks.every(record => record.completed)) {
      throw new Error('text.there_is_uncompleted_task')
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

window.customElements.define('execute-vas', ExecuteVas)
