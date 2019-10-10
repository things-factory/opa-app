import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { getCodeByName } from '@things-factory/code-base'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { openPopup } from '@things-factory/layout-base'
import '../components/import-pop-up'
import { CustomAlert } from '../../utils/custom-alert'

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

        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }

        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      data: Object,
      importHandler: Object
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.company'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveCompanies.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteCompanies.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.company'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
    }
  }

  async pageInitialized() {
    this.countryCodes = await getCodeByName('COUNTRY_CODE')

    this._searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.country_code'),
        name: 'countryCode',
        type: 'select',
        options: [
          { value: '' },
          ...this.countryCodes.map(countryCodes => {
            return {
              name: countryCodes.name,
              value: countryCodes.name
            }
          })
        ],
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.brn'),
        name: 'brn',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.address'),
        name: 'address',
        type: 'text',
        props: { searchOper: 'like' }
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'text',
        props: { searchOper: 'like' }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.id) navigate(`bizplaces/${record.id}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: true,
            align: 'left'
          },
          imex: { header: 'Name', key: 'name', width: 50, type: 'string' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: true,
            align: 'left'
          },
          imex: { header: 'Description', key: 'description', width: 50, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'code',
          name: 'countryCode',
          header: i18next.t('field.country_code'),
          record: {
            editable: true,
            align: 'center',
            codeName: 'COUNTRY_CODE'
          },
          imex: {
            header: 'Country Code',
            key: 'countryCode',
            width: 100,
            type: 'array',
            arrData: this.countryCodes.map(countryCodes => {
              return {
                name: countryCodes.name,
                id: countryCodes.name
              }
            })
          },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'brn',
          header: i18next.t('field.brn'),
          record: {
            editable: true,
            align: 'left'
          },
          imex: { header: 'Brn', key: 'brn', width: 50, type: 'string' },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'postalCode',
          header: i18next.t('field.postal_code'),
          record: {
            editable: true,
            align: 'left'
          },
          imex: { header: 'Postal Code', key: 'postalCode', width: 50, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'address',
          header: i18next.t('field.address'),
          record: {
            editable: true,
            align: 'left'
          },
          imex: { header: 'Address', key: 'address', width: 50, type: 'string' },
          sortable: true,
          width: 250
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            editable: true,
            align: 'left'
          },
          imex: { header: 'Status', key: 'status', width: 50, type: 'string' },
          sortable: true,
          width: 80
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  get gristConfig() {
    return {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.id) navigate(`bizplaces/${record.id}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: true,
            align: 'left',
            imex: { header: 'Name', key: 'name', width: 50, type: 'string' }
          },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: true,
            align: 'left',
            imex: { header: 'Description', key: 'description', width: 50, type: 'string' }
          },
          sortable: true,
          width: 150
        },
        {
          type: 'code',
          name: 'countryCode',
          header: i18next.t('field.country_code'),
          record: {
            editable: true,
            align: 'center',
            codeName: 'COUNTRY_CODE',
            imex: {
              header: 'Country Code',
              key: 'countryCode',
              width: 100,
              type: 'array',
              arrData: this.countryCodes.map(countryCodes => {
                return {
                  name: countryCodes.name,
                  id: countryCodes.name
                }
              })
            }
          },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'brn',
          header: i18next.t('field.brn'),
          record: {
            editable: true,
            align: 'left',
            imex: { header: 'Brn', key: 'brn', width: 50, type: 'string' }
          },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'postalCode',
          header: i18next.t('field.postal_code'),
          record: {
            editable: true,
            align: 'left',
            imex: { header: 'Postal Code', key: 'postalCode', width: 50, type: 'string' }
          },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'address',
          header: i18next.t('field.address'),
          record: {
            editable: true,
            align: 'left',
            imex: { header: 'Address', key: 'address', width: 50, type: 'string' }
          },
          sortable: true,
          width: 250
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            editable: true,
            align: 'left',
            imex: { header: 'Status', key: 'status', width: 50, type: 'string' }
          },
          sortable: true,
          width: 80
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        }
      ]
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  _importableData(records) {
    setTimeout(() => {
      openPopup(
        html`
          <import-pop-up
            .records=${records}
            .config=${{
              rows: this.config.rows,
              columns: [...this.config.columns.filter(column => column.imex !== undefined)]
            }}
            .importHandler="${this.importHandler.bind(this)}"
          ></import-pop-up>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.import')
        }
      )
    }, 500)
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          companies(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              countryCode
              postalCode
              brn
              address
              status
              updatedAt
              updater{
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
      total: response.data.companies.total || 0,
      records: response.data.companies.items || []
    }
  }

  async importHandler(patches) {
    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleCompany(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
    })
    if (!response.errors) {
      history.back()
      this.dataGrist.fetch()
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            message: i18next.t('text.data_imported_successfully')
          }
        })
      )
    }
  }

  async _saveCompanies() {
    var patches = this.dataGrist.exportPatchList({ flagName: 'cuFlag' })
    if (patches && patches.length) {
      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleCompany(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.data_updated_successfully')
            }
          })
        )
      }
    }
  }

  async _deleteCompanies() {
    CustomAlert({
      title: i18next.t('text.are_you_sure'),
      text: i18next.t('text.you_wont_be_able_to_revert_this!'),
      type: 'warning',
      confirmButton: { text: i18next.t('button.delete'), color: '#22a6a7' },
      cancelButton: { text: 'cancel', color: '#cfcfcf' },
      callback: async result => {
        if (result.value) {
          const names = this.dataGrist.selected.map(record => record.name)
          if (names && names.length > 0) {
            const response = await client.query({
              query: gql`
                mutation {
                  deleteCompanies(${gqlBuilder.buildArgs({ names })})
                }
              `
            })
            if (!response.errors) {
              this.dataGrist.fetch()
              document.dispatchEvent(
                new CustomEvent('notify', {
                  detail: {
                    message: i18next.t('text.data_deleted_successfully')
                  }
                })
              )
            }
          }
        }
      }
    })
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = this.dataGrist.data.records
    }
    // data structure // { //    header: {headerName, fieldName, type = string, arrData = []} //    data: [{fieldName: value}] // }

    var headerSetting = this.dataGrist._config.columns
      .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
      .map(column => {
        return column.imex
      })

    var data = records.map(item => {
      return {
        id: item.id,
        ...this._columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .reduce((record, column) => {
            record[column.imex.key] = column.imex.key
              .split('.')
              .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
            return record
          }, {})
      }
    })

    return { header: headerSetting, data: data }
    // return this.dataGrist.exportRecords()
  }
}

window.customElements.define('company-list', CompanyList)
