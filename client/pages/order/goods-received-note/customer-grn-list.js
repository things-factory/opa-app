import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, navigate, PageView } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { getCodeByName } from '@things-factory/code-base'

class CustomerGrnList extends localize(i18next)(PageView) {
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
      title: i18next.t('title.goods_received_notes')
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async pageInitialized() {
    const _grnStatus = await getCodeByName('CUSTOMER_GRN_STATUS')

    this._searchFields = [
      {
        label: i18next.t('field.grn'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'arrivalNoticeRefNo',
        label: i18next.t('field.ref_no'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'arrivalNoticeNo',
        label: i18next.t('field.gan'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.status'),
        name: 'customerStatus',
        type: 'select',
        options: [
          { value: '' },
          ..._grnStatus.map(status => {
            return { name: i18next.t(`label.${status.description}`), value: status.name }
          })
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      list: {
        fields: ['name', 'bizplace', 'refNo', 'arrivalNotice', 'updater', 'updatedAt']
      },
      rows: { appendable: false, selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              navigate(`received_note/${record.name}`)
            }
          }
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'left' },
          sortable: true,
          width: 160
        },
        {
          type: 'object',
          name: 'arrivalNotice',
          header: i18next.t('field.gan'),
          record: { align: 'left' },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'ganStatus',
          header: i18next.t('field.gan_status'),
          record: { align: 'center' },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.grn_status'),
          record: { align: 'center' },
          sortable: true,
          width: 180
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'center' },
          sortable: true,
          width: 160
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

  async fetchHandler({ page, limit, sorters = [{ name: 'createdAt', desc: true }] }) {
    const filters = await this.searchForm.getQueryFilters()
    const response = await client.query({
      query: gql`
        query {
          goodsReceivalNotes(${gqlBuilder.buildArgs({
            filters: [...filters, { name: 'status', operator: 'notin', value: ['READY_TO_SEND'] }],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              arrivalNotice {
                id
                name
                description
                refNo
              }
              customerStatus
              description
              bizplace {
                id
                name
                description
              }
              createdAt
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

    if (!response.errors) {
      return {
        total: response.data.goodsReceivalNotes.total || 0,
        records:
          response.data.goodsReceivalNotes.items.map(grn => {
            return {
              ...grn,
              refNo: grn.arrivalNotice.refNo || '',
              ganStatus: grn.arrivalNotice.status
            }
          }) || []
      }
    }
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('customer-grn-list', CustomerGrnList)
