import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { navigate, client, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { ScrollbarStyles } from '@things-factory/styles'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class JobSheetList extends localize(i18next)(PageView) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        search-form {
          overflow: visible;
        }

        data-grist {
          overflow-y: auto;
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.job_sheet_list'),
      actions: []
    }
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

  async pageInitialized() {
    const partners = await this._fetchPartners()

    this._searchFields = [
      {
        label: i18next.t('field.customer'),
        name: 'bizplace',
        type: 'select',
        options: [
          { value: '' },
          ...partners
            .map(partner => {
              return {
                name: `${partner.partnerBizplace.name} ${
                  partner.partnerBizplace.description ? `(${partner.partnerBizplace.description})` : ''
                }`,
                value: partner.partnerBizplace.id
              }
            })
            .sort(this._compareValues('name', 'asc'))
        ],
        props: { searchOper: 'eq' },
        attrs: ['custom']
      },
      {
        label: i18next.t('field.from_date'),
        name: 'fromDate',
        type: 'date',
        props: {
          searchOper: 'eq',
          max: new Date().toISOString().split('T')[0]
        },
        attrs: ['custom'],
        value: (() => {
          let date = new Date()
          date.setMonth(date.getMonth() - 1)
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
            date.setMonth(date.getMonth() - 1)
            return date.toISOString().split('T')[0]
          })(),
          max: new Date().toISOString().split('T')[0]
        },
        attrs: ['custom'],
        value: new Date().toISOString().split('T')[0]
      }
    ]

    this.config = {
      rows: { appendable: false },
      list: { fields: ['jobSheet', 'name', 'updatedAt'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              navigate(`job_sheet_report/${record.name}`)
            }
          }
        },
        {
          type: 'string',
          name: 'jobSheetNo',
          header: i18next.t('field.job_sheet'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.gan_no'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'left' },
          sortable: true,
          width: 150
        }
      ]
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  async _fetchPartners() {
    const response = await client.query({
      query: gql`
        query {
          partners(${gqlBuilder.buildArgs({
            filters: []
          })}) {
            items {
              partnerBizplace {
                id
                name
                description
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      return response.data.partners.items
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    try {
      this._validate()
      let arrivalNotice = {}
      let filters = []
      const _customFields = this.searchForm
        .getFields()
        .filter(field => field.hasAttribute('custom'))
        .map(field => field.name)
      this.searchForm.queryFilters.forEach(filter => {
        if (_customFields.includes(filter.name)) {
          if (filter.name === 'bizplace') {
            arrivalNotice[filter.name] = { id: filter.value }
          } else {
            arrivalNotice[filter.name] = filter.value
          }
        } else {
          filters.push(filter)
        }
      })
      const response = await client.query({
        query: gql`
          query {
            bizplaceArrivalNotices(${gqlBuilder.buildArgs({
              arrivalNotice,
              filters,
              pagination: { page, limit },
              sortings: sorters
            })}) {
              items {
                name
                description
                bizplace {
                  id
                  name
                  description
                }
                jobSheetNo
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

      return {
        total: response.data.bizplaceArrivalNotices.total || 0,
        records: response.data.bizplaceArrivalNotices.items || []
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validate() {
    if (!this.searchForm.shadowRoot.querySelector('form').checkValidity())
      throw new Error(i18next.t('text.invalid_form_value'))
    if (!this._bizplaceSelector.value) throw new Error(i18next.t('text.customer_does_not_selected'))
    if (!this._fromDateInput.value) throw new Error(i18next.t('text.from_date_is_empty'))
    if (!this._toDateInput.value) throw new Error(i18next.t('text.to_date_is_empty'))
  }

  _modifyDateRange(e) {
    this._toDateInput.value = ''
    const fromDate = e.currentTarget.value
    let min = new Date(fromDate)
    let max = new Date(fromDate)
    max.setMonth(max.getMonth() + 1)
    max.setHours(0, 0, 0, 0)
    let today = new Date()
    today.setDate(today.getDate() + 1)
    today.setHours(0, 0, 0, 0)

    if (max >= today) max = today
    min = min.toISOString().split('T')[0]
    max = max.toISOString().split('T')[0]

    this._fromDateInput.max = max
    this._toDateInput.min = min
    this._toDateInput.max = max
  }

  get _columns() {
    return this.config.columns
  }

  _compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0
      }

      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key]
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key]

      let comparison = 0
      if (varA > varB) {
        comparison = 1
      } else if (varA < varB) {
        comparison = -1
      }
      return order === 'desc' ? comparison * -1 : comparison
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

window.customElements.define('job-sheet-list', JobSheetList)
