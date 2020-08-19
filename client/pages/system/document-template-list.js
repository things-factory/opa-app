import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import { TEMPLATE_TYPES } from '../constants'
import './document-upload-template'

class DocumentTemplateList extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      searchFields: Array,
      config: Object,
      data: Object
    }
  }

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

  render() {
    return html`
      <search-form .fields=${this.searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.document_template_management'),
      actions: [
        {
          title: i18next.t('button.add'),
          action: this._uploadTemplate.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteTemplate.bind(this)
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

  pageUpdated(_changed, _lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  pageInitialized() {
    this.searchFields = [
      {
        name: 'name',
        label: i18next.t('field.name'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'description',
        label: i18next.t('field.description'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'category',
        label: i18next.t('field.category'),
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.config = {
      list: {
        fields: ['category', 'domain', 'updatedAt', 'updater']
      },
      rows: { appendable: false, selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: false },
        {
          type: 'string',
          name: 'category',
          header: i18next.t('field.category'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'domain',
          header: i18next.t('field.domain'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        }
      ]
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    let filters = [
      {
        name: 'category',
        operator: 'in',
        value: [
          TEMPLATE_TYPES.GRN_TEMPLATE.value,
          TEMPLATE_TYPES.DO_TEMPLATE.value,
          TEMPLATE_TYPES.CO_TEMPLATE.value,
          TEMPLATE_TYPES.JOB_TEMPLATE.value,
          TEMPLATE_TYPES.LOGO.value,
          TEMPLATE_TYPES.COP.value,
          TEMPLATE_TYPES.SIGNATURE.value
        ]
      }
    ]
    const response = await client.query({
      query: gql`
        query {
          attachments(${gqlBuilder.buildArgs({
            filters: [...filters, ...this.searchForm.queryFilters],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              refBy
              domain {
                id
                name
                description
              }
              path
              category
              updatedAt
              updater {
                id
                name
              }
            }
            total
          }
        }
      `
    })

    return {
      total: response.data.attachments.total || 0,
      records: response.data.attachments.items || []
    }
  }

  _uploadTemplate() {
    openPopup(
      html`
        <document-upload-template
          @template-uploaded="${() => {
            this.dataGrist.fetch()
            document.dispatchEvent(
              new CustomEvent('notify', {
                detail: {
                  message: i18next.t('text.template_upload_successfully')
                }
              })
            )
          }}"
        ></document-upload-template>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.upload_document_template')
      }
    )
  }

  async _deleteTemplate() {
    const selectedData = this.dataGrist.selected.map(record => record.id)
    const id = selectedData[0]
    const result = await CustomAlert({
      type: 'warning',
      title: i18next.t('button.delete'),
      text: i18next.t('text.are_you_sure'),
      confirmButton: { text: i18next.t('button.delete') },
      cancelButton: { text: i18next.t('button.cancel') }
    })

    if (!result.value) return
    const response = await client.query({
      query: gql`
          mutation {
            deleteAttachment(${gqlBuilder.buildArgs({
              id
            })}) {
              name
            }
          }
        `
    })

    if (!response.errors) {
      this.dataGrist.fetch()
    }
  }
}

customElements.define('document-template-list', DocumentTemplateList)
