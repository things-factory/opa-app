import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { BILLING_MODE } from './constants/claim'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { openPopup } from '@things-factory/layout-base'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/import-pop-up'

class CreateClaimChit extends connect(store)(localize(i18next)(PageView)) {
  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
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

  static get properties() {
    return {
      config: Object,
      data: Object,
      importHandler: Object,
      _orderNo: Object
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <label>${i18next.t('label.orderNo')}</label>
          <select name="orderNo">
            ${Object.keys(this._orderNo).map(key => {
              const orderNo = this._orderNo[key]
              return html`
                <option value="${orderNo.value}">${i18next.t(`label.${orderNo.name}`)}</option>
              `
            })}</select
          >
        </fieldset>
      </form>
      <!-- <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div> -->
    `
  }

  get context() {
    return {
      title: 'Create Claim Chit',
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveCompanies.bind(this)
        }
      ]
    }
  }

  async pageInitialized() {
    this._orderNo = BILLING_MODE
    // this._searchFields = [
    //   {
    //     label: i18next.t('label.name'),
    //     name: 'name',
    //     type: 'text',
    //     props: { searchOper: 'like', placeholder: i18next.t('label.name') }
    //   },
    //   {
    //     label: i18next.t('label.country_code'),
    //     name: 'country_code',
    //     type: 'text',
    //     props: { searchOper: 'like', placeholder: i18next.t('label.country_code') }
    //   },
    //   {
    //     label: i18next.t('label.brn'),
    //     name: 'brn',
    //     type: 'text',
    //     props: { searchOper: 'like', placeholder: i18next.t('label.brn') }
    //   },
    //   {
    //     label: i18next.t('label.address'),
    //     name: 'address',
    //     type: 'text',
    //     props: { searchOper: 'like', placeholder: i18next.t('label.address') }
    //   },
    //   {
    //     label: i18next.t('label.status'),
    //     name: 'status',
    //     type: 'text',
    //     props: { searchOper: 'like', placeholder: i18next.t('label.status') }
    //   }
    // ]
    // this.config = this.gristConfig
    // await this.updateComplete
    // this.dataGrist.fetch()
  }

  get gristConfig() {
    return {
      // rows: { selectable: { multiple: true } },
      // columns: [
      //   { type: 'gutter', gutterName: 'dirty' },
      //   { type: 'gutter', gutterName: 'sequence' },
      //   { type: 'gutter', gutterName: 'row-selector', multiple: true },
      //   {
      //     type: 'gutter',
      //     gutterName: 'button',
      //     icon: 'reorder',
      //     handlers: {
      //       click: (columns, data, column, record, rowIndex) => {
      //         if (record.id) navigate(`bizplaces/${record.id}`)
      //       }
      //     }
      //   },
      //   {
      //     type: 'string',
      //     name: 'name',
      //     header: i18next.t('field.name'),
      //     record: { editable: true, align: 'left' },
      //     sortable: true,
      //     width: 200
      //   },
      //   {
      //     type: 'string',
      //     name: 'description',
      //     header: i18next.t('field.description'),
      //     record: { editable: true, align: 'left' },
      //     sortable: true,
      //     width: 150
      //   },
      //   {
      //     type: 'string',
      //     name: 'countryCode',
      //     header: i18next.t('field.country_code'),
      //     record: { editable: true, align: 'center' },
      //     sortable: true,
      //     width: 80
      //   },
      //   {
      //     type: 'string',
      //     name: 'brn',
      //     header: i18next.t('field.brn'),
      //     record: { editable: true, align: 'left' },
      //     sortable: true,
      //     width: 100
      //   },
      //   {
      //     type: 'string',
      //     name: 'postalCode',
      //     header: i18next.t('field.postal_code'),
      //     record: { editable: true, align: 'left' },
      //     sortable: true,
      //     width: 150
      //   },
      //   {
      //     type: 'string',
      //     name: 'address',
      //     header: i18next.t('field.address'),
      //     record: { editable: true, align: 'left' },
      //     sortable: true,
      //     width: 250
      //   },
      //   {
      //     type: 'string',
      //     name: 'status',
      //     header: i18next.t('field.status'),
      //     record: { editable: true, align: 'center' },
      //     sortable: true,
      //     width: 80
      //   },
      //   {
      //     type: 'datetime',
      //     name: 'updatedAt',
      //     header: i18next.t('field.updated_at'),
      //     record: { editable: false, align: 'center' },
      //     sortable: true,
      //     width: 150
      //   },
      //   {
      //     type: 'object',
      //     name: 'updater',
      //     header: i18next.t('field.updater'),
      //     record: { editable: false, align: 'center' },
      //     sortable: true,
      //     width: 150
      //   }
      // ]
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
            .config=${this.config}
            .importHandler="${this.importHandler.bind(this)}"
          ></import-pop-up>
        `,
        {
          backdrop: true,
          size: 'large'
        }
      )
    }, 500)
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          companies(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
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

  // _conditionParser() {
  //   return this.searchForm
  //     .getFields()
  //     .filter(field => (field.type !== 'checkbox' && field.value && field.value !== '') || field.type === 'checkbox')
  //     .map(field => {
  //       return {
  //         name: field.name,
  //         value:
  //           field.type === 'text'
  //             ? field.value
  //             : field.type === 'checkbox'
  //             ? field.checked
  //             : field.type === 'number'
  //             ? parseFloat(field.value)
  //             : field.value,
  //         operator: field.getAttribute('searchOper')
  //       }
  //     })
  // }

  async _saveCompanies() {
    // let patches = this.dataGrist.dirtyRecords
    // if (patches && patches.length) {
    //   patches = patches.map(company => {
    //     let patchField = company.id ? { id: company.id } : {}
    //     const dirtyFields = company.__dirtyfields__
    //     for (let key in dirtyFields) {
    //       patchField[key] = dirtyFields[key].after
    //     }
    //     patchField.cuFlag = company.__dirty__
    //     return patchField
    //   })
    //   const response = await client.query({
    //     query: gql`
    //         mutation {
    //           updateMultipleCompany(${gqlBuilder.buildArgs({
    //             patches
    //           })}) {
    //             name
    //           }
    //         }
    //       `
    //   })
    //   if (!response.errors) {
    //     this.dataGrist.fetch()
    //     document.dispatchEvent(
    //       Swal.fire({
    //         type: 'success',
    //         title: 'Your work has been saved',
    //         showConfirmButton: false,
    //         timer: 1500
    //       })
    //     )
    //   }
    // }
  }

  get _columns() {
    return this.config.columns
  }
}

window.customElements.define('create-claim-chit', CreateClaimChit)
