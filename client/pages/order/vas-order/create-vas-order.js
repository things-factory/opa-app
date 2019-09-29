import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { LOAD_TYPES, ORDER_STATUS, PACKING_TYPES, ORDER_TYPES } from '../constants/order'

class CreateVasOrder extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      /**
       * @description
       * flag for whether use transportation from warehouse or not.
       * true =>
       */
      _ganNo: String,
      _ownTransport: Boolean,
      productGristConfig: Object,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
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
      title: i18next.t('title.create_vas_order'),
      actions: [
        {
          title: i18next.t('button.create'),
          action: this._generateVasOrder.bind(this)
        }
      ]
    }
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist#vas-grist')
  }

  render() {
    return html`
      <div class="grist">
        <data-grist
          id="vas-grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this.data = {}
    this.config = {}
  }

  updated(changedProps) {
    if (changedProps.has('_ganNo') && this._ganNo) {
      this.fetchGAN()
      this._updateBatchList()
    } else if (changedProps.has('_ganNo') && !this._ganNo) {
      this._clearPage()
      this._updateBatchList()
    }

    this._contextHandler()
  }

  pageInitialized() {
    this.config = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'close',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.data = {
                ...this.data,
                records: data.records.filter((record, idx) => idx !== rowIndex)
              }
            }
          }
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          record: { editable: true, align: 'center', options: { queryName: 'vass' } },
          width: 250
        },
        {
          type: 'select',
          name: 'batchId',
          header: i18next.t('field.batch_id'),
          record: { editable: true, align: 'center', options: ['', i18next.t('label.all')] },
          width: 150
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          record: { editable: true, align: 'center' },
          width: 350
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'center' },
          width: 350
        }
      ]
    }
  }

  _clearPage() {
    this.grist.data = Object.assign({ records: [] })
  }

  _validateVas() {
    this.grist.commit()
    if (this.grist.data.records && this.grist.data.records.length) {
      if (this.grist.data.records.filter(record => !record.vas || !record.remark).length)
        throw new Error(i18next.t('text.empty_value_in_list'))

      const vasBatches = this.grist.data.records.map(vas => `${vas.vas.id}-${vas.batchId}`)
      if (vasBatches.filter((vasBatch, idx, vasBatches) => vasBatches.indexOf(vasBatch) !== idx).length)
        throw new Error(i18next.t('text.duplicated_vas_on_same_batch'))
    }
  }

  async _generateVasOrder() {
    try {
      this._validateVas()
      let patches = this.grist.dirtyRecords

      if (patches && patches.length) {
        patches = patches.map(orderVas => {
          let patchField = orderVas.id ? { id: orderVas.id } : {}
          const dirtyFields = orderVas.__dirtyfields__
          for (let key in dirtyFields) {
            patchField[key] = dirtyFields[key].after
          }
          patchField.cuFlag = orderVas.__dirty__
          patchField.status = ORDER_STATUS.PENDING.value

          //try with hard code
          patchField.name = "GAN-20213930349sdf Test"
          patchField.bizplace = { id: '83b0f4c8-c94f-4701-9316-80e85de2a731' }

  
          return patchField
        })
  
        const response = await client.query({
          query: gql`
              mutation {
                updateMultipleOrderVas(${gqlBuilder.buildArgs({
                  patches
                })}) {
                  id
                  name
                  batchId
                  remark
                }
              }
            `
        }) 
        if (!response.errors) this.dataGrist.fetch()
      }
    } catch (e) {
      this._showToast({ message: e.message})
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

window.customElements.define('create-vas-order', CreateVasOrder)
