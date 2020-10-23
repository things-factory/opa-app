import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { isMobileDevice } from '@things-factory/utils'
import { css, html } from 'lit-element'

class WorksheetBatchPicking extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _worksheetNo: String,
      _worksheetStatus: String,
      _roNo: String,
      wsdGristConfig: Object,
      worksheetDetailData: Object
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
        .form-container {
          display: flex;
        }
        .form-container > form {
          flex: 1;
        }
        barcode-tag {
          width: 100px;
          height: 100px;
          margin: 10px;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: row;
          flex: 1;
          overflow-y: auto;
        }
        .grist-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: auto;
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

  constructor() {
    super()
    this.worksheetDetailData = { records: [] }
  }

  get context() {
    return {
      title: i18next.t('title.worksheet_batch_picking'),
      actions: this._actions,
      printable: {
        accept: ['preview'],
        content: this
      }
    }
  }

  render() {
    return html`
      <div class="form-container">
        <form class="multi-column-form">
          <fieldset>
            <legend>${i18next.t('title.batch_picking')}</legend>
            <label>${i18next.t('label.no_of_orders')}</label>
            <input name="orderQty" readonly />

            <label>${i18next.t('label.execute_date')}</label>
            <input name="executionDate" readonly />

            <label>${i18next.t('label.status')}</label>
            <input name="status" readonly />
          </fieldset>
        </form>

        <barcode-tag bcid="qrcode" .value=${this._worksheetNo}></barcode-tag>
      </div>

      <div class="grist">
        <div class="grist-column">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.worksheet_detail')}</h2>
          <data-grist
            id="wsd-grist"
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.wsdGristConfig}
            .data="${this.worksheetDetailData}"
          ></data-grist>
        </div>
      </div>
    `
  }

  async pageUpdated(changes) {
    if (this.active && (changes.resourceId || this._worksheetNo)) {
      if (changes.resourceId) {
        this._worksheetNo = changes.resourceId
      }
      await this.fetchOrderInventories()
      this._updateContext()
    }
  }

  pageInitialized() {
    this.wsdGristConfig = {
      list: { fields: ['lotId', 'batchId', 'sku', 'product', 'packingType', 'location', 'releaseQty', 'status'] },
      pagination: { infinite: true },
      rows: { appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'lotNo',
          header: i18next.t('field.lot_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'string',
          name: 'sku',
          header: i18next.t('field.sku'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'string',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 250
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { align: 'center' },
          width: 150
        },
        {
          type: 'string',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'availableQty',
          header: i18next.t('field.available_qty'),
          record: { align: 'center' },
          width: 80
        },
        {
          type: 'integer',
          name: 'releaseQty',
          header: i18next.t('field.release_qty'),
          record: { align: 'center' },
          width: 60
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { align: 'center' },
          width: 100
        }
      ]
    }
  }

  get form() {
    return this.shadowRoot.querySelector('form')
  }

  get wsdGrist() {
    return this.shadowRoot.querySelector('data-grist#wsd-grist')
  }

  async fetchOrderInventories() {
    this._fillupForm({
      orderQty: '4',
      executionDate: '23/10/2020',
      status: 'EXECUTING'
    })

    this.worksheetDetailData = {
      records: [
        {
          batchId: '93371230',
          lotNo: 'L20201020309',
          sku: '10101860',
          product: 'SENSODYNE GENTLE WH 100G',
          packingType: 'Ea',
          location: '05-01-01-A',
          availableQty: 100,
          releaseQty: 20,
          status: 'EXECUTING'
        },
        {
          batchId: '93451369',
          lotNo: 'L20201020310',
          sku: '10103430',
          product: 'BMORES BETACAROTENE 6MG 90S',
          packingType: 'Ea',
          location: '05-01-01-B',
          availableQty: 120,
          releaseQty: 40,
          status: 'EXECUTING'
        },
        {
          batchId: '74305001321',
          lotNo: 'L20201020311',
          sku: '10104720',
          product: 'KIDDI PHARMATON 100ML',
          packingType: 'Ea',
          location: '05-01-01-C',
          availableQty: 50,
          releaseQty: 10,
          status: 'EXECUTING'
        },
        {
          batchId: 'UNEU27',
          lotNo: 'L202010102309',
          sku: '10105710',
          product: 'ENERVON C 100S',
          packingType: 'CARTON',
          location: '04-01-01-C',
          availableQty: 10,
          releaseQty: 1,
          status: 'EXECUTING'
        },
        {
          batchId: '9556258000817',
          lotNo: 'L20201020329',
          sku: '10106650',
          product: 'NUTREN DIABETIK 400G',
          packingType: 'Ea',
          location: '05-01-01-H',
          availableQty: 92,
          releaseQty: 10,
          status: 'EXECUTING'
        },
        {
          batchId: '8886456200759',
          lotNo: 'L20201020339',
          sku: '10108670',
          product: 'ENO WHITE 200G',
          packingType: 'Ea',
          location: '05-01-01-A',
          availableQty: 42,
          releaseQty: 20,
          status: 'EXECUTING'
        },
        {
          batchId: '8886456200315',
          lotNo: 'L20201020379',
          sku: '10108830',
          product: 'PANADOL SUSP 6+YEAR 60ML',
          packingType: 'Ea',
          location: '05-01-02-A',
          availableQty: 55,
          releaseQty: 12,
          status: 'EXECUTING'
        },
        {
          batchId: '5052197037654',
          lotNo: 'L20201022359',
          sku: '10110930',
          product: 'KY JELLY 100G',
          packingType: 'Ea',
          location: '05-01-01-A',
          availableQty: 90,
          releaseQty: 10,
          status: 'EXECUTING'
        },
        {
          batchId: '75987008004',
          lotNo: 'L2020102521',
          product: 'DUREX SELECT 3S x 60',
          sku: '10126100',
          packingType: 'CARTON',
          location: '04-01-01-B',
          availableQty: 20,
          releaseQty: 2,
          status: 'EXECUTING'
        },
        {
          batchId: '10910302',
          lotNo: 'L2020102227491',
          sku: '10122320',
          product: 'JJ BABY BATH REG 200ML',
          packingType: 'Ea',
          location: '05-01-04-H',
          availableQty: 60,
          releaseQty: 20,
          status: 'EXECUTING'
        },
        {
          batchId: '13010',
          lotNo: 'L202010202129',
          sku: '10126150',
          product: 'HANSAPLAST SENSITIVE 20S',
          packingType: 'Ea',
          location: '05-02-06-A',
          availableQty: 10,
          releaseQty: 5,
          status: 'EXECUTING'
        }
      ]
    }

    this._updateContext()
  }

  _updateContext() {
    this._actions = []

    this._actions.push({
      title: i18next.t('button.back'),
      action: () => navigate('outbound_worksheets')
    })

    store.dispatch({ type: UPDATE_CONTEXT, context: this.context })
  }

  _fillupForm(data) {
    for (let key in data) {
      Array.from(this.form.querySelectorAll('input, select')).forEach(field => {
        if (field.name === key && field.type === 'checkbox') {
          field.checked = data[key]
        } else if (field.name === key) {
          if (data[key] instanceof Object) {
            const objectData = data[key]
            field.value = `${objectData.name} ${objectData.description ? `(${objectData.description})` : ''}`
          } else {
            field.value = data[key]
          }
        }
      })
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

window.customElements.define('worksheet-batch-picking', WorksheetBatchPicking)
