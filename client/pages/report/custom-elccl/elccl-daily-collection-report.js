import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { html, css } from 'lit-element'
import { client, PageView, store } from '@things-factory/shell'
import { gqlBuilder, flattenObject } from '@things-factory/utils'
import { connect } from 'pwa-helpers/connect-mixin'
import { localize, i18next } from '@things-factory/i18n-base'
import gql from 'graphql-tag'

class ElcclDailyCollectionReport extends connect(store)(localize(i18next)(PageView)) {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      data-report {
        flex: 1;
      }
    `
  }

  static get properties() {
    return {
      _searchFields: Object,
      _config: Object,
      _userBizplaces: Object,
      data: Object
    }
  }

  get context() {
    return {
      title: i18next.t('title.daily_collection_report'),
      exportable: {
        name: i18next.t('title.daily_collection_report'),
        data: this._exportableData.bind(this)
      }
    }
  }

  get report() {
    return this.shadowRoot.querySelector('data-report')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get _bizplaceSelector() {
    return this.searchForm.shadowRoot.querySelector('select[name=bizplace]')
  }

  get _fromDateInput() {
    return this.searchForm.shadowRoot.querySelector('input[name=fromDate]')
  }

  get _toDateInput() {
    return this.searchForm.shadowRoot.querySelector('input[name=toDate]')
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.report.fetch()}></search-form>

      <data-report .config=${this._config} .fetchHandler="${this.fetchHandler.bind(this)}"></data-grist>
    `
  }

  get searchFields() {
    return [
      {
        label: i18next.t('field.customer'),
        name: 'bizplace',
        type: 'select',
        options: [
          { value: '' },
          ...this._userBizplaces.map(bizplaceList => {
            return {
              name: bizplaceList.name,
              value: bizplaceList.id
            }
          })
        ],
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.gan'),
        name: 'arrivalNotice',
        type: 'string',
        props: { searchOper: 'in' }
      },
      {
        label: i18next.t('field.from_date'),
        name: 'fromDate',
        type: 'date',
        props: {
          searchOper: 'eq',
          max: new Date().toISOString().split('T')[0]
        },
        value: (() => {
          let date = new Date()
          date.setTime(date.getTime() - 86400000 * 7)
          return date.toISOString().split('T')[0]
        })(),
        handlers: { change: this._modifyDateRange.bind(this) }
      },
      {
        label: i18next.t('field.to_date'),
        name: 'toDate',
        type: 'date',
        props: {
          searchOper: 'eq',
          min: (() => {
            let date = new Date()
            date.setTime(date.getTime() - 86400000 * 7)
            return date.toISOString().split('T')[0]
          })(),
          max: new Date().toISOString().split('T')[0]
        },
        value: new Date().toISOString().split('T')[0]
      }
    ]
  }

  get reportConfig() {
    return {
      pagination: { infinite: true },
      rows: {
        selectable: false,
        groups: [{ column: 'bizplace_name' }, { column: 'ended_at' }, { column: 'arrival_notice_name' }]
      },
      columns: [
        {
          type: 'string',
          name: 'bizplace_name',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.customer'),
          imex: { header: i18next.t('field.customer'), key: 'bizplace_name', width: 75, type: 'string' },
          width: 450
        },
        {
          type: 'string',
          name: 'ended_at',
          header: i18next.t('field.date'),
          record: { editable: false, align: 'left' },
          imex: { header: i18next.t('field.date'), key: 'ended_at', width: 15, type: 'string' },
          width: 110
        },
        {
          type: 'string',
          name: 'arrival_notice_name',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.job_sheet'),
          imex: { header: i18next.t('field.job_sheet'), key: 'arrival_notice_name', width: 40, type: 'string' },
          width: 250
        },
        {
          type: 'string',
          name: 'batch_id',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.container_no'),
          imex: { header: i18next.t('field.container_no'), key: 'batch_id', width: 25, type: 'string' },
          width: 180
        },
        {
          type: 'float',
          name: 'total_self_collect',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.total_self_collect'),
          imex: { header: i18next.t('field.total_self_collect'), key: 'total_self_collect', width: 20, type: 'string' },
          width: 180
        },
        {
          type: 'float',
          name: 'total_delivery',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.total_delivery'),
          imex: { header: i18next.t('field.total_delivery'), key: 'total_delivery', width: 20, type: 'string' },
          width: 180
        },
        {
          type: 'string',
          name: 'self_collect',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.self_collect'),
          imex: { header: i18next.t('field.self_collect'), key: 'self_collect', width: 200, type: 'string' },
          width: 500
        },
        {
          type: 'string',
          name: 'delivery',
          record: { editable: false, align: 'left' },
          header: i18next.t('field.delivery'),
          imex: { header: i18next.t('field.delivery'), key: 'delivery', width: 200, type: 'string' },
          width: 500
        }
      ]
    }
  }

  async pageInitialized() {
    this._products = []
    this._userBizplaces = [...(await this._fetchBizplaceList())]

    this._searchFields = this.searchFields
    this._config = this.reportConfig
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.report.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      this._validate()

      const response = await client.query({
        query: gql`
          query {
            elcclDailyCollectionReport(${gqlBuilder.buildArgs({
              filters: [...this.searchForm.queryFilters],
              pagination: { page, limit },
              sortings: sorters
            })}) {              
              arrival_notice_name
              bizplace_name
              ended_at
              batch_id
              self_collect
              total_self_collect
              delivery
              total_delivery
            }
          }
        `
      })

      this.data = {
        filter: [...this.searchForm.queryFilters],
        records: response.data.elcclDailyCollectionReport || []
      }

      return {
        total: 0,
        records: this.data.records
      }
    } catch (e) {
      console.log(e)
    }
  }

  async _fetchBizplaceList() {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: []
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

    if (!response.errors) {
      return response.data.bizplaces.items
    }
  }

  _validate() {
    if (!this.searchForm.shadowRoot.querySelector('form').checkValidity())
      throw new Error(i18next.t('text.invalid_form_value'))
    // if (!this._bizplaceSelector.value) throw new Error(i18next.t('text.customer_does_not_selected'))
    if (!this._fromDateInput.value) throw new Error(i18next.t('text.from_date_is_empty'))
    if (!this._toDateInput.value) throw new Error(i18next.t('text.to_date_is_empty'))
  }

  _modifyDateRange(e) {
    const fromDate = e.currentTarget.value

    if (this._toDateInput.value < fromDate) this._toDateInput.value = fromDate

    let min = new Date(fromDate)
    let today = new Date()
    today.setHours(0, 0, 0, 0)

    min = min.toISOString().split('T')[0]

    this._toDateInput.min = min
  }

  _exportableData() {
    try {
      var headerSetting = [
        ...this.report._config.columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .map(column => {
            return column.imex
          })
      ]
      debugger
      return {
        header: headerSetting,
        data: this.report.data.records,
        groups: this.report._config.rows.groups,
        totals: []
      }
    } catch (e) {
      this._showToast(e)
    }
  }
}

window.customElements.define('elccl-daily-collection-report', ElcclDailyCollectionReport)
