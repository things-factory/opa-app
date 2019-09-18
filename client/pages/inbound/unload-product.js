import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class UnloadProduct extends localize(i18next)(PageView) {
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
          display: flex;
          flex-direction: column;
        }

        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;

          flex: 1;
        }

        data-grist {
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
      title: i18next.t('title.unloading')
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.worksheet_no')}</label>
          <input
            name="worksheetNo"
            @keypress="${async e => {
              if (e.keyCode === 13) {
                e.preventDefault()
                this._getProducts(e.currentTarget.value)
              }
            }}"
          />
        </fieldset>

        <fieldset>
          <legend>${i18next.t('title.worksheet')}</legend>

          <label>${i18next.t('label.buffer_location')}</label>
          <input name="bufferLocation" readonly />

          <label>${i18next.t('label.startedAt')}</label>
          <input name="startedAt" type="datetime-local" readonly />

          <label>${i18next.t('label.bizplace')}</label>
          <input name="bizplace" readonly />
        </fieldset>
      </form>

      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.products')}</h2>

        <data-grist .mode=${isMobileDevice() ? 'LIST' : 'GRID'} .config=${this.config} .data=${this.data}></data-grist>
      </div>
    `
  }

  firstUpdated() {
    this.config = {
      pagination: {
        infinite: true
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'center' },
          width: 200
        },
        {
          type: 'string',
          name: 'remark',
          header: i18next.t('field.remark'),
          width: 300
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'float',
          name: 'weight',
          header: i18next.t('field.weight'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'string',
          name: 'unit',
          header: i18next.t('field.unit'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'packQty',
          header: i18next.t('field.pack_qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'totalWeight',
          header: i18next.t('field.total_weight'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: { align: 'center' },
          width: 80
        }
      ]
    }

    this._focusOnBarcodField()
  }

  _focusOnBarcodField() {
    this.shadowRoot.querySelector('input[name=worksheetNo]').focus()
  }

  async _getProducts(name) {
    const response = await client.query({
      query: gql`
        query {
          unloadWorksheet(${gqlBuilder.buildArgs({
            name
          })}) {
            unloadWorksheetInfo {
              name
              status
              bufferLocation {
                id
                name
                description
              }
              startedAt
              bizplace {
                id
                name
                description
              }
            }
            unloadWorksheetDetails {
              product {
                id
                name
                description
              }
              remark
              packingType
              weight
              unit
              packQty
              totalWeight
              palletQty
            }
          }
        }
      `
    })

    if (!response.errors) {
      this._fillUpForm({
        ...response.data.unloadWorksheet.unloadWorksheetInfo,
        bufferLocation: response.data.unloadWorksheet.unloadWorksheetInfo.bufferLocation.name,
        bizplace: response.data.unloadWorksheet.unloadWorksheetInfo.bizplace.name
      })

      this.data = {
        ...this.data,
        records: response.data.unloadWorksheet.unloadWorksheetDetails
      }
    }
  }

  _fillUpForm(data) {
    for (let key in data) {
      Array.from(this.form.querySelectorAll('input')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key && field.type === 'datetime-local') {
          const datetime = Number(data[key])
          const timezoneOffset = new Date(datetime).getTimezoneOffset() * 60000
          field.value = new Date(datetime - timezoneOffset).toISOString().slice(0, -1)
        } else if (field.name === key) {
          field.value = data[key]
        }
      })
    }
  }
}

window.customElements.define('unload-product', UnloadProduct)
