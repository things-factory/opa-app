import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { getCodeByName } from '@things-factory/code-base'

class ReceivedNoteList extends localize(i18next)(PageView) {
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
    const _grnStatus = await getCodeByName('GRN_STATUS')
    const _userBizplaces = await this.fetchBizplaces()

    this._searchFields = [
      {
        label: i18next.t('field.grn'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.customer'),
        name: 'bizplaceName',
        type: 'select',
        options: [
          { value: '' },
          ..._userBizplaces
            .filter(userBizplaces => !userBizplaces.mainBizplace)
            .map(userBizplace => {
              return {
                name: userBizplace.name,
                value: userBizplace.name
              }
            })
            .sort(this._compareValues('name', 'asc'))
        ],
        props: { searchOper: 'eq' }
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
        name: 'status',
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
        fields: ['name', 'bizplace', 'orderRefNo', 'arrivalNotice', 'updater', 'updatedAt']
      },
      rows: { appendable: false, selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        // {
        //   type: 'gutter',
        //   gutterName: 'button',
        //   icon: 'post_add',
        //   handlers: {
        //     click: (columns, data, column, record, rowIndex) => {
        //       if (record.id) this._uploadGRN(record.name, record.id)
        //     }
        //   }
        // },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              navigate(`received_note_detail/${record.name}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.grn'),
          record: { align: 'left' },
          sortable: true,
          width: 180,
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.attachments[0] && record.attachments[0].path) {
                window.open(`/attachment/${record.attachments[0].path}`)
              }
            }
          }
        },
        {
          type: 'object',
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 230
        },
        {
          type: 'string',
          name: 'orderRefNo',
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
          goodsReceivalNotes(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
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
        total: response.data.goodsReceivalNotes.total || 0,
        records:
          response.data.goodsReceivalNotes.items.map(grn => {
            return {
              ...grn,
              orderRefNo: grn.arrivalNotice.refNo || ''
            }
          }) || []
      }
    }
  }

  async fetchBizplaces(bizplace = []) {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: [...bizplace]
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
    return response.data.bizplaces.items
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

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('received-note-list', ReceivedNoteList)
