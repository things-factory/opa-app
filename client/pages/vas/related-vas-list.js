import '@things-factory/barcode-ui'
import '@things-factory/grist-ui'
import { getRenderer } from '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import '../components/popup-note'
import '../components/vas-templates'
import {
  ORDER_VAS_STATUS,
  VAS_BATCH_AND_PRODUCT_TYPE,
  VAS_BATCH_NO_TYPE,
  VAS_ETC_TYPE,
  VAS_PRODUCT_TYPE,
  WORKSHEET_STATUS
} from '../constants'
import './target-inventory-assignment-popup'

class RelatedVasList extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      worksheetNo: String,
      config: Object,
      data: Object,
      orderNo: String,
      orderType: String
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
        .container {
          overflow: hidden;
          display: flex;
          flex: 1;
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

  render() {
    return html`
      <div class="container">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.non_assigned_vas')}</h2>

          <data-grist
            id="grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.config}
            .data="${this.data}"
          ></data-grist>
        </div>
      </div>
    `
  }

  constructor() {
    super()
    this.data = { records: [] }
  }

  firstUpdated() {
    this.config = {
      rows: {
        appendable: false,
        handlers: {
          click: (columns, data, column, record, rowIndex) => {
            if (record && record.vas && record.vas.operationGuideType === 'template') {
              this._template = document.createElement(record.vas.operationGuide)
              this._template.record = { ...record, operationGuide: JSON.parse(record.operationGuide) }
            } else {
              this._template = null
            }

            if (column.name === 'issue' && record.issue) {
              this._showIssueNotePopup(record)
            }
          }
        },
        classifier: (record, rowIndex) => {
          return {
            emphasized: Boolean(record.operationGuide)
          }
        }
      },
      list: { fields: ['location', 'targetType', 'targetBatchId', 'targetProduct', 'otherTarget', 'vas', 'remark'] },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'set',
          header: i18next.t('field.set'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'string',
          name: 'targetType',
          header: i18next.t('field.target_type'),
          record: { align: 'left' },
          width: 200
        },
        {
          type: 'string',
          name: 'target',
          header: i18next.t('field.target'),
          record: {
            renderer: (value, column, record, rowIndex, field) => {
              if (record.targetType === VAS_BATCH_NO_TYPE) {
                return getRenderer()(record.targetBatchId, column, record, rowIndex, field)
              } else if (record.targetType === VAS_PRODUCT_TYPE) {
                return getRenderer('object')(record.targetProduct, column, record, rowIndex, field)
              } else if (record.targetType === VAS_BATCH_AND_PRODUCT_TYPE) {
                return getRenderer()(
                  `${record.targetBatchId} / ${record.targetProduct.name}`,
                  column,
                  record,
                  rowIndex,
                  field
                )
              } else if (record.targetType === VAS_ETC_TYPE) {
                return getRenderer()(record.otherTarget, column, record, rowIndex, field)
              }
            },
            align: 'left'
          },

          width: 200
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packingType'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'object',
          name: 'vas',
          header: i18next.t('field.vas'),
          width: 250
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          width: 200
        }
      ]
    }
  }

  updated(changedProps) {
    if (changedProps.has('worksheetNo') && this.worksheetNo) {
      this.fetchVasWorksheet()
    }
  }

  async fetchVasWorksheet() {
    if (!this.worksheetNo) return

    const response = await client.query({
      query: gql`
        query {
          worksheet(${gqlBuilder.buildArgs({
            name: this.worksheetNo
          })}) {
            worksheetDetails {
              description
              issue
              seq
              status
              targetVas {
                vas {
                  name
                  description
                  operationGuide
                  operationGuideType
                }
                set
                targetType
                targetBatchId
                status
                operationGuide
                targetProduct {
                  id
                  name
                  description
                }
                packingType
                qty
                otherTarget
                remark
              }
            }
          }
        }
      `
    })

    if (!response.errors) {
      const worksheetDetails = response.data.worksheet.worksheetDetails

      this.data = {
        ...this.data,
        records: worksheetDetails
          .sort((a, b) => a.targetVas.set - b.targetVas.set)
          .map(wsd => {
            return {
              ...wsd.targetVas,
              set: `Set ${wsd.targetVas.set}`,
              issue: wsd.issue,
              status: wsd.status
            }
          })
      }
    }
  }
}

customElements.define('related-vas-list', RelatedVasList)
