import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { getColumns } from '@things-factory/resource-base'
import { client, gqlBuilder, PageView, ScrollbarStyles, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '@things-factory/resource-ui/client/data-grist/wrapper/data-list-wrapper'

class CompanyList extends localize(i18next)(PageView) {
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

        data-list-wrapper {
          flex: 1;

          overflow: hidden;
        }
      `
    ]
  }

  static get properties() {
    return {
      items: Array,
      _columns: Array,
      _searchFields: Array
    }
  }

  async activated(active) {
    if (active) {
      const response = await getColumns('Company')
      const metaData = response.menu

      this._searchFields = metaData.columns
        .filter(field => field.searchRank && field.searchRank > 0)
        .sort((a, b) => (a['searchRank'] > b['searchRank'] ? 1 : -1))
        .map(field => {
          return {
            name: field.name,
            type: field.searchEditor ? field.searchEditor : 'text',
            props: {
              min: field.rangeVal ? field.rangeVal.split(',')[0] : null,
              max: field.rangeVal ? field.rangeVal.split(',')[1] : null,
              searchOper: field.searchOper ? field.searchOper : 'eq',
              placeholder: field.term
            },
            value: field.searchInitVal
          }
        })

      this._columns = metaData.columns
        .filter(column => column.gridRank > 0)
        .map(column => {
          column.term = i18next.t(column.term)
          return column
        })
        .sort((a, b) => {
          return a['gridRank'] > b['gridRank'] ? 1 : -1
        })

      this.fetchHandler()
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${this._getCompanies}
      ></search-form>

      <data-list-wrapper
        pulltorefresh
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .columns=${this._columns}
        .records=${this.items}
        .fetchHandler=${this.fetchHandler.bind(this)}
      >
      </data-list-wrapper>
    `
  }

  get context() {
    return {
      title: i18next.t('title.company')
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  buildFilters() {
    const conditions = []

    this.searchForm.getFields().forEach(field => {
      if (field.value) {
        conditions.push({
          name: field.name,
          operator: field.getAttribute('searchOper'),
          value: field.value,
          dataType: this._columns.find(c => c.name === field.name).colType
        })
      }
    })

    return conditions
  }

  async fetchHandler() {
    this.columns = []

    const response = await client.query({
      query: gql`
        query {
          companies(${gqlBuilder.buildArgs({
            filters: this.buildFilters()
          })}) {
            items {
              name
            }
            total
          }
        }
      `
    })

    this.searchForm.form.reset()

    return {
      total: response.data.companies.total || 0,
      records: response.data.companies.items || []
    }
  }
}

window.customElements.define('company-list', CompanyList)
