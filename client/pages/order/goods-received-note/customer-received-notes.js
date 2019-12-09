import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { GRN_STATUS } from '../constants/order'
import './upload-received-note'

class CustomerReceivedNotes extends localize(i18next)(PageView) {
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
      title: i18next.t('title.goods_received_notes'),
      exportable: {
        name: i18next.t('title.goods_received_notes'),
        data: this._exportableData.bind(this)
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async pageInitialized() {
    this._searchFields = [
      {
        label: i18next.t('field.grn'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'arrivalNotice',
        label: i18next.t('field.ref_no'),
        type: 'object',
        queryName: 'arrivalNotices',
        field: 'refNo',
        props: { searchOper: 'i_like' }
      }
    ]

    this.config = {
      rows: { appendable: false, selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'cloud_download',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.attachments[0] && record.attachments[0].path) {
                if (record.status === GRN_STATUS.NEW.value) this._receivedGRN(record.name)
                window.open(`attachment/${record.attachments[0].path}`)
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.grn'),
          record: { align: 'left' },
          sortable: true,
          width: 180
        },
        {
          type: 'object',
          name: 'arrivalNotice',
          header: i18next.t('field.gan'),
          record: { align: 'left' },
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.id) navigate(`arrival_notice_detail/${record.arrivalNotice.name}`)
            }
          },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'orderRefNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
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
    const response = await client.query({
      query: gql`
        query {
          customerReceivalNotes(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
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
              status
              description
              bizplace {
                id
                name
                description
              }
              attachments {
                id
                name
                refBy
                path
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
        total: response.data.customerReceivalNotes.total || 0,
        records:
          response.data.customerReceivalNotes.items.map(grn => {
            return {
              ...grn,
              orderRefNo: grn.arrivalNotice.refNo || ''
            }
          }) || []
      }
    }
  }

  async _receivedGRN(name) {
    const response = await client.query({
      query: gql`
        mutation {
          receivedGoodsReceivalNote(${gqlBuilder.buildArgs({
            name
          })}) {
            id
            status
          }
        }
      `
    })

    if (!response.error) this.dataGrist.fetch()
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('customer-received-notes', CustomerReceivedNotes)
