import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

class OnhandStock extends localize(i18next)(PageView) {
  static get properties() {
    return {
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          height: 100%;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
          padding-top: var(--grist-title-with-grid-padding);
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.onhand_stock')
    }
  }

  render() {
    return html`
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.name')}</label>
            <input name="name" />

            <label>${i18next.t('label.description')}</label>
            <input name="description" />
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <data-grist
          id="products"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>

      </div>
    `
  }

  async firstUpdated() {
    this.config = {
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'button', icon: 'edit' },
        {
          name: 'name',
          type: 'string',
          hidden: false,
          width: 200,
          resizable: true,
          sortable: true,
          header: i18next.t('label.name')
        },
        {
          name: 'description',
          type: 'string',
          hidden: false,
          width: 260,
          resizable: true,
          sortable: true,
          header: i18next.t('label.description')
        },
        {
          name: 'etd',
          type: 'datetime',
          width: 150,
          record: {
            align: 'center'
          },
          header: i18next.t('label.etd')
        },
        {
          name: 'eta',
          type: 'datetime',
          width: 150,
          record: {
            align: 'center'
          },
          header: i18next.t('label.eta')
        },
        {
          name: 'type',
          type: 'string',
          hidden: false,
          width: 150,
          resizable: true,
          sortable: true,
          header: i18next.t('label.type'),
          record: {
            align: 'center'
          }
        },
        {
          name: 'unit',
          type: 'string',
          hidden: false,
          width: 150,
          resizable: true,
          sortable: true,
          header: i18next.t('label.unit')
        },
        {
          name: 'updatedAt',
          type: 'datetime',
          hidden: false,
          width: 80,
          resizable: true,
          sortable: true,
          header: i18next.t('label.updated_at')
        }
      ],
      pagination: { pages: [20, 30, 50, 100, 200], infinite: false },
      rows: { appendable: true, insertable: true },
      sorters: [
        { name: 'name', descending: false },
        { name: 'type', descending: false },
        { name: 'unit', descending: false }
      ]
    }

    this.data = await this._getStocks()
  }

  async _getStocks() {
    const response = await client.query({
      query: gql`
        query {
          response: customerProducts(${gqlBuilder.buildArgs({ filters: [] })}) {
            items {
              name
              description
              type
              unit
              updatedAt
              updater {
                id
                name
                description
              }
            }
          }
        }
      `
    })

    return {
      records: response.data.response.items.map(product => {
        const stdDate = new Date().getTime()
        const etd = stdDate + Math.floor(Math.random() * 10000000000)
        const eta = etd + Math.floor(Math.random() * 1000000000)

        return {
          ...product,
          etd: new Date(etd),
          eta: new Date(eta)
        }
      }),
      total: response.data.response.total
    }
  }
}

window.customElements.define('onhand-stock', OnhandStock)
