import { MultiColumnFormStyles, SingleColumnFormStyles } from '@things-factory/form-ui'
import { getRenderer } from '@things-factory/grist-ui'
import { i18next } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, navigate, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import '../components/popup-note'
import '../components/vas-templates'
import {
  VAS_BATCH_AND_PRODUCT_TYPE,
  VAS_BATCH_NO_TYPE,
  VAS_ETC_TYPE,
  VAS_PRODUCT_TYPE,
  WORKSHEET_STATUS
} from '../constants'

export class AbstractExecuteVas extends LitElement {
  static get styles() {
    return [
      SingleColumnFormStyles,
      MultiColumnFormStyles,
      css`
        :host {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
        }
        .grist {
          overflow: hidden;
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
      _template: Object,
      _templateContextBtns: Array
    }
  }

  get infoForm() {
    return this.shadowRoot.querySelector('form#info-form')
  }

  get detailInfoForm() {
    return this.shadowRoot.querySelector('form#detail-info-form')
  }

  get taskGrist() {
    return this.shadowRoot.querySelector('data-grist#task-grist')
  }

  updated(changedProps) {
    if (changedProps.has('_selectedTaskStatus') && this._selectedTaskStatus) {
      this._updateContext()
    }
  }

  firstUpdated() {
    this.vasGristConfig = this.getVasGristConfig()
    this.taskGristConfig = this.getTaskGristConfig()
  }

  getVasGristConfig() {
    return {
      list: { fields: ['completed', 'targetDisplay', 'vasCount'] },
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
          name: 'target',
          header: i18next.t('field.target'),
          record: {
            renderer: (value, column, record, rowIndex, field) => {
              if (record.targetType === VAS_BATCH_NO_TYPE) {
                return getRenderer()(record.targetBatchId, column, record, rowIndex, field)
              } else if (record.targetType === VAS_PRODUCT_TYPE) {
                return getRenderer('object')(record.targetProduct, column, record, rowIndex, field)
              } else if (record.targetType === VAS_BATCH_AND_PRODUCT_TYPE) {
                return getRenderer()(
                  `${record.targetBatchId} / ${record.targetProduct.name}`,
                  column,
                  record,
                  rowIndex,
                  field
                )
              } else if (record.targetType === VAS_ETC_TYPE) {
                return getRenderer()(record.otherTarget, column, record, rowIndex, field)
              }
            },
            align: 'center'
          },
          width: 250
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
  }

  getTaskGristConfig() {
    return {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (data.records.length && record) {
              this._selectedVas = record
              this._selectedTaskStatus = null
              this._selectedTaskStatus = record.status
              this._vasName = `${record.vas.name} ${record.vas.description ? `(${record.vas.description})` : ''}`
              this.detailInfoForm.reset()
              this._fillUpDetailInfoForm(record)
              if (record.vas.operationGuideType && record.vas.operationGuideType === 'template') {
                this.initVasTemplate(record)
              } else {
                this.clearVasTemplate()
                if (this.initCommonVas && typeof this.initCommonVas === 'function') this.initCommonVas()
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

  initVasTemplate(record) {
    this._template = document.createElement(record.vas.operationGuide)
    this._template.record = { ...record, operationGuide: JSON.parse(record.operationGuide) }
    this._template.orderType = this.orderType

    if (!record.completed) {
      this._template.isExecuting = true
    } else {
      this._template.isExecuting = false
    }

    this._templateContextBtns = this._template.contextButtons
    this._template.init()
  }

  clearVasTemplate() {
    if (!this._template) return
    this._template = null
    this._templateContextBtns = null
  }

  async _templateCompletedHandler() {
    const selectedVasName = this._selectedVas.name
    await this.fetchVas()
    this._selectedVas = this.vasTasks.records.find(record => record.name === selectedVasName)
    if (this._selectedVas && this._selectedVas.status === WORKSHEET_STATUS.EXECUTING.value) {
      this._fillUpDetailInfoForm(this._selectedVas)
      this._selectedTaskStatus = this._selectedVas.status
      this._template.record = { ...this._selectedVas, operationGuide: JSON.parse(this._selectedVas.operationGuide) }
      this._template.init()
    } else {
      this.clearVasTemplate()
    }
  }

  _updateContext() {
    let actions = []

    if (this._templateContextBtns && this._templateContextBtns.length) {
      actions = this._templateContextBtns
    }

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

  async fetchVas() {
    try {
      if (!this.orderNo) throw new Error(i18next.t('text.order_no_is_empty'))

      this._clearView()
      const response = await client.query({
        query: gql`
          ${this.fetchVasQuery}
        `
      })

      if (!response.errors) {
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
    } catch (e) {
      this._showToast(e)
    }
  }

  _formatData(tasks) {
    return tasks
      .sort((a, b) => a.set - b.set)
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
      palletId: task.inventory?.palletId || '',
      name: task.name,
      vas: task.vas,
      remark: task.remark,
      status: task.status,
      locationInv: task.locationInv,
      operationGuide: task.operationGuide,
      completed: task.status === WORKSHEET_STATUS.DONE.value,
      description: task.description,
      qty: task.qty,
      weight: task.weight,
      inventory: task.inventory,
      issue: task.issue
    }
  }

  _clearView() {
    this.vasSets = { records: [] }
    this.vasTasks = { records: [] }
    this.detailInfoForm.reset()
    this._selectedVas = null
    this._selectedTaskStatus = null
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
      this.checkExecutionValidity()

      if (this._template) {
        await this._template.checkExecutionValidity()
      }

      const response = await client.query({
        query: gql`
          mutation {
            executeVas(${gqlBuilder.buildArgs(this._getExecuteArgs())})
          }
        `
      })

      if (!response.errors) {
        this.resetView()
        this.fetchVas()
        this._updateContext()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _getExecuteArgs() {
    const worksheetDetail = this.taskGrist.dirtyData.records.filter(record => record.name === this._selectedVas.name)[0]
    let vasWorkseetDetail = { name: worksheetDetail.name }
    if (worksheetDetail.issue) vasWorkseetDetail.issue = worksheetDetail.issue
    return { worksheetDetail: vasWorkseetDetail }
  }

  async _undoVas() {
    try {
      this.checkUndoValidity()

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
        this.resetView()
        this.fetchVas()
        this._updateContext()
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  resetView() {
    this._selectedVas = null
    this._selectedTaskStatus = null
    this.clearVasTemplate()
    this.infoForm.reset()
    this.detailInfoForm.reset()
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

  checkExecutionValidity() {
    // 1. validate for vas selection
    if (!this._selectedVas) throw new Error(i18next.t('text.target_is_not_selected'))
  }

  checkUndoValidity() {
    if (!this._selectedVas) throw new Error(i18next.t('text.target_is_not_selected'))
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
