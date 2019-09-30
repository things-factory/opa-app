import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS } from '../constants/order'

class RejectedVasOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _ganNo: String,
      _ownTransport: Boolean,
      productGristConfig: Object,
      vasGristConfig: Object,
      productData: Object,
      vasData: Object
    }
  }

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

  get context() {
    return {
      title: i18next.t('title.rejected_vas_order'),
      actions: [
        {
          title: i18next.t('button.back'),
          action: () => history.back()
        }
      ]
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.fetchGAN()
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vasGristConfig}
          .data="${this.vasData}"
          .fetchHandler="${this.fetchHandler.bind(this)}"
          ></data-grist>
      </div>
    `
  }

  pageInitialized() {

    this.vasGristConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: {
            align: 'center',
            options: { queryName: 'vass' }
          },
          width: 250
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          width: 180
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: {
            align: 'center',
            options: [i18next.t('label.all')]
          },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          width: 350
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('_ganNo')) {
      this.fetchGAN()
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    let filters = []
    if(this._ganNo) {
      filters.push({
        name: 'name',
        operator: 'eq',
        value: this._ganNo
      })
    }

    const response = await client.query({
      query: gql`
        query {
          orderVass(${gqlBuilder.buildArgs({
            filters: filters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items{
              id
              name
              bizplace {
                id
              }
              vas {
                id
                name
                description
              }
              status
              description
              batchId
              remark
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
        total: response.data.orderVass.total || 0,
        records: response.data.orderVass.items || []
      }
    }
  }

  stateChanged(state) {
    if (this.active) {
      this._ganNo = state && state.route && state.route.resourceId
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

window.customElements.define('rejected-vas-order', RejectedVasOrder)
