import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { openPopup } from '@things-factory/layout-base'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import './upload-receival-note'

class ReceivalNoteList extends localize(i18next)(PageView) {
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
      data: Object
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
        label: i18next.t('field.customer'),
        name: 'bizplace',
        type: 'object',
        queryName: 'bizplaces',
        field: 'name'
      },
      {
        label: i18next.t('field.gan'),
        name: 'refNo',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.config = {
      pagination: { infinite: false },
      rows: { appendable: false, selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'post_add',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (record.id) this._uploadGRN(record.name, record.id)
            }
          }
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              navigate(`receival_note_detail/${record.name}`)
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
          name: 'bizplace',
          header: i18next.t('field.customer'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'refNo',
          header: i18next.t('field.ref_no'),
          record: { align: 'center' },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { align: 'center' },
          sortable: true,
          width: 150
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
        data: response.data.goodsReceivalNotes.items.map(grn => {
          return {
            ...grn,
            refNo: grn.arrivalNotice.refNo
          }
        }),
        total: response.data.goodsReceivalNotes.total || 0,
        records: response.data.goodsReceivalNotes.items || []
      }
    }
  }

  _uploadGRN(grnName, grnId) {
    openPopup(
      html`
        <upload-receival-note .grnName="${grnName}" .grnId="${grnId}"></upload-receival-note>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.upload_signed_grn')
      }
    )
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    return this.dataGrist.exportRecords()
  }
}

window.customElements.define('receival-note-list', ReceivalNoteList)
