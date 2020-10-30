import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView, store } from '@things-factory/shell'
import { flattenObject, gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

class InventoryAgingAndValuationReport extends connect(store)(localize(i18next)(PageView)) {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      data-grist {
        overflow-y: auto;
        flex: 1;
      }
    `
  }

  static get properties() {
    return {
      _searchFields: Object,
      _config: Object,
      _userBizplaces: Object,
      data: Object,
      _products: Object
    }
  }

  get context() {
    return {
      title: i18next.t('title.inventory_aging_and_valuation_report'),
      exportable: {
        name: i18next.t('title.inventory_aging_and_valuation_report'),
        data: this._exportableData.bind(this)
      }
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get _bizplaceSelector() {
    return this.searchForm.shadowRoot.querySelector('select[name=bizplace]')
  }

  get _fromDateInput() {
    return this.searchForm.shadowRoot.querySelector('input[name=fromDate]')
  }

  get _toDateInput() {
    return this.searchForm.shadowRoot.querySelector('input[name=toDate]')
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields}></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this._config}
        .data="${this._products}"
      ></data-grist>
    `
  }

  get searchFields() {
    return [
      {
        label: i18next.t('field.product'),
        name: 'product',
        type: 'string',
        props: { searchOper: 'in' }
      },
      {
        label: i18next.t('field.from_date'),
        name: 'fromDate',
        type: 'date',
        props: {
          searchOper: 'eq',
          max: new Date().toISOString().split('T')[0]
        },
        value: (() => {
          let date = new Date()
          date.setMonth(date.getMonth() - 6)
          return date.toISOString().split('T')[0]
        })(),
        handlers: { change: this._modifyDateRange.bind(this) }
      },
      {
        label: i18next.t('field.to_date'),
        name: 'toDate',
        type: 'date',
        props: {
          searchOper: 'eq',
          min: (() => {
            let date = new Date()
            date.setMonth(date.getMonth() - 1)
            return date.toISOString().split('T')[0]
          })(),
          max: new Date().toISOString().split('T')[0]
        },
        value: new Date().toISOString().split('T')[0]
      }
    ]
  }

  get reportConfig() {
    return {
      list: {
        fields: [
          'sku',
          'productName',
          'packingType',
          'type',
          'batchNo',
          'initialInboundDate',
          'unitPrice',
          'qty',
          'value',
          'stockHoldingPeriod',
          'daysRemaining'
        ]
      },
      rows: {
        selectable: false,
        insertable: false,
        appendable: false
      },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'sku',
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.sku'), key: 'sku', width: 15, type: 'string' },
          header: i18next.t('field.sku'),
          width: 180
        },
        {
          type: 'string',
          name: 'productName',
          header: i18next.t('field.product'),
          record: { editable: false, align: 'left' },
          imex: { header: i18next.t('field.product'), key: 'productName', width: 75, type: 'string' },
          width: 320
        },
        {
          type: 'string',
          name: 'packingType',
          header: i18next.t('field.packing_type'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.packing_type'), key: 'packingType', width: 25, type: 'string' },
          width: 100
        },
        {
          type: 'string',
          name: 'type',
          header: i18next.t('field.type'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.type'), key: 'type', width: 25, type: 'string' },
          width: 100
        },
        {
          type: 'string',
          name: 'batchNo',
          header: i18next.t('field.batch_no'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.batch_no'), key: 'batchNo', width: 25, type: 'string' },
          width: 100
        },
        {
          type: 'string',
          name: 'initialInboundDate',
          header: i18next.t('field.initial_inbound_date'),
          record: { editable: false, align: 'center' },
          imex: {
            header: i18next.t('field.initial_inbound_date'),
            key: 'initialInboundDate',
            width: 25,
            type: 'string'
          },
          width: 100
        },
        {
          type: 'string',
          name: 'unitPrice',
          header: i18next.t('field.unit_price'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.unit_price'), key: 'unitPrice', width: 25, type: 'string' },
          width: 100
        },
        {
          type: 'string',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.qty'), key: 'qty', width: 25, type: 'string' },
          width: 140
        },
        {
          type: 'string',
          name: 'value',
          record: { editable: false, align: 'center' },
          header: i18next.t('field.value'),
          imex: { header: i18next.t('field.value'), key: 'value', width: 25, type: 'string' },
          width: 140
        },
        {
          type: 'string',
          name: 'stockHoldingPeriod',
          header: i18next.t('field.stock_holding_period'),
          record: { editable: false, align: 'center' },
          imex: {
            header: i18next.t('field.stock_holding_period'),
            key: 'stockHoldingPeriod',
            width: 25,
            type: 'string'
          },
          width: 160
        },
        {
          type: 'string',
          name: 'daysRemaining',
          header: i18next.t('field.days_remaining'),
          record: { editable: false, align: 'center' },
          imex: { header: i18next.t('field.days_remaining'), key: 'daysRemaining', width: 25, type: 'string' },
          width: 160
        }
      ]
    }
  }

  async pageInitialized() {
    this._products = {
      records: [
        {
          sku: '10101860',
          productName: 'SENSODYNE GENTLE WH 100G',
          packingType: 'UNIT',
          type: 'DENTAL',
          batchNo: 'TEMU9147364',
          initialInboundDate: '9/5/20',
          unitPrice: '8.73',
          qty: '117',
          value: '1021.09',
          stockHoldingPeriod: '55',
          daysRemaining: '30'
        },
        {
          sku: '10103430',
          productName: "BMORES BETACAROTENE 6MG 90'S",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'LHF000021',
          initialInboundDate: '9/5/20',
          unitPrice: '40.69',
          qty: '6',
          value: '244.15',
          stockHoldingPeriod: '55',
          daysRemaining: '50'
        },
        {
          sku: '10103480',
          productName: "BMORES EXEC B 60'S*2",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'TCLU1064559',
          initialInboundDate: '9/5/20',
          unitPrice: '72.92',
          qty: '5',
          value: '364.59',
          stockHoldingPeriod: '55',
          daysRemaining: '50'
        },
        {
          sku: '10103660',
          productName: "BMORES EPO+FISH OIL 30'S",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'TEM9685040',
          initialInboundDate: '9/5/20',
          unitPrice: '28.42',
          qty: '5',
          value: '142.09',
          stockHoldingPeriod: '55',
          daysRemaining: '120'
        },
        {
          sku: '10103710',
          productName: "BMORES FISH OIL 1000MG 30'S",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'HLBU9411270',
          initialInboundDate: '9/5/20',
          unitPrice: '30.50',
          qty: '6',
          value: '183.00',
          stockHoldingPeriod: '55',
          daysRemaining: '100'
        },
        {
          sku: '10103750',
          productName: "BMORES GARLIC OIL 90'S",
          packingType: 'UNIT',
          type: 'HERBAL',
          batchNo: 'TRLU1742022',
          initialInboundDate: '9/5/20',
          unitPrice: '17.50',
          qty: '5',
          value: '87.51',
          stockHoldingPeriod: '55',
          daysRemaining: '33'
        },
        {
          sku: '10103810',
          productName: "BMORES LECITHIN 1200MG 100'S",
          packingType: 'UNIT',
          type: 'HERBAL',
          batchNo: 'CGMU6531028',
          initialInboundDate: '9/5/20',
          unitPrice: '40.32',
          qty: '3',
          value: '120.96',
          stockHoldingPeriod: '55',
          daysRemaining: '44'
        },
        {
          sku: '10104380',
          productName: "APPETON TAURINE HI-Q+DHA  60'S",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'GESU9351839',
          initialInboundDate: '9/5/20',
          unitPrice: '36.41',
          qty: '4',
          value: '145.65',
          stockHoldingPeriod: '55',
          daysRemaining: '21'
        },
        {
          sku: '10104390',
          productName: "APPETON ESS ACTIV C 250MG 60'S",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'UMDOEC0048',
          initialInboundDate: '9/5/20',
          unitPrice: '24.30',
          qty: '5',
          value: '121.50',
          stockHoldingPeriod: '55',
          daysRemaining: '12'
        },
        {
          sku: '10104550',
          productName: "CHAMPS C 100MG STRAW 100'S",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'TRIU8743047',
          initialInboundDate: '9/5/20',
          unitPrice: '18.38',
          qty: '2',
          value: '36.76',
          stockHoldingPeriod: '55',
          daysRemaining: '56'
        },
        {
          sku: '10104680',
          productName: "PHARMATON CAPSULES 100'S+30'S ",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'FFDO004',
          initialInboundDate: '9/5/20',
          unitPrice: '99.02',
          qty: '39',
          value: '3861.66',
          stockHoldingPeriod: '55',
          daysRemaining: '56'
        },
        {
          sku: '10104720',
          productName: 'KIDDI PHARMATON 100ML',
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'UMDOEC0036',
          initialInboundDate: '9/5/20',
          unitPrice: '16.70',
          qty: '3',
          value: '50.09',
          stockHoldingPeriod: '55',
          daysRemaining: '43'
        },
        {
          sku: '10105110',
          productName: "SIMEPAR 40'S ",
          packingType: 'UNIT',
          type: 'HERBAL',
          batchNo: 'OOLU6415892',
          initialInboundDate: '9/5/20',
          unitPrice: '28.31',
          qty: '61',
          value: '1726.94',
          stockHoldingPeriod: '55',
          daysRemaining: '23'
        },
        {
          sku: '10105240',
          productName: 'BRAGG APPLE CIDER 946ML',
          packingType: 'UNIT',
          type: 'HERBAL',
          batchNo: 'MNBU3039334',
          initialInboundDate: '9/6/20',
          unitPrice: '19.15',
          qty: '404',
          value: '7736.60',
          stockHoldingPeriod: '56',
          daysRemaining: '12'
        },
        {
          sku: '10105270',
          productName: 'SCOTTS EMUL 200ML',
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'APRU5711585',
          initialInboundDate: '9/6/20',
          unitPrice: '9.10',
          qty: '57',
          value: '518.85',
          stockHoldingPeriod: '56',
          daysRemaining: '32'
        },
        {
          sku: '10105590',
          productName: 'HIMALAYA BONNISAN SYRUP 120ML',
          packingType: 'UNIT',
          type: 'HERBAL',
          batchNo: 'LHF000002',
          initialInboundDate: '9/6/20',
          unitPrice: '14.10',
          qty: '18',
          value: '253.87',
          stockHoldingPeriod: '56',
          daysRemaining: '45'
        },
        {
          sku: '10105710',
          productName: "ENERVON C 100'S ",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'OOLU6213572-2',
          initialInboundDate: '9/6/20',
          unitPrice: '43.14',
          qty: '19',
          value: '819.73',
          stockHoldingPeriod: '56',
          daysRemaining: '100'
        },
        {
          sku: '10105740',
          productName: "NEW OBIMIN 30'S",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'FOS0038',
          initialInboundDate: '9/6/20',
          unitPrice: '14.28',
          qty: '12',
          value: '171.34',
          stockHoldingPeriod: '56',
          daysRemaining: '34'
        },
        {
          sku: '10105760',
          productName: "SANGOBION 4'S*25",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'CXRU1211889',
          initialInboundDate: '9/6/20',
          unitPrice: '61.73',
          qty: '66',
          value: '4074.23',
          stockHoldingPeriod: '56',
          daysRemaining: '23'
        },
        {
          sku: '10105780',
          productName: "PRINCI-B FORTE 10'S*30 ",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'CGMU4971861',
          initialInboundDate: '9/6/20',
          unitPrice: '125.15',
          qty: '10',
          value: '1251.50',
          stockHoldingPeriod: '56',
          daysRemaining: '60'
        },
        {
          sku: '10105810',
          productName: "HOVID NEUROVIT 10'S*10",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'FOS0080',
          initialInboundDate: '9/6/20',
          unitPrice: '12.30',
          qty: '16',
          value: '196.80',
          stockHoldingPeriod: '56',
          daysRemaining: '156'
        },
        {
          sku: '10105830',
          productName: "SCOTTS CLO 100'S",
          packingType: 'UNIT',
          type: 'VIT & MIN',
          batchNo: 'FOS0049',
          initialInboundDate: '9/6/20',
          unitPrice: '18.21',
          qty: '14',
          value: '254.91',
          stockHoldingPeriod: '56',
          daysRemaining: '30'
        },
        {
          sku: '10106650',
          productName: 'NUTREN DIABETIK 400G ',
          packingType: 'UNIT',
          type: 'NUTRIOTC',
          batchNo: 'OOLU6165664',
          initialInboundDate: '9/6/20',
          unitPrice: '49.50',
          qty: '3',
          value: '148.50',
          stockHoldingPeriod: '56',
          daysRemaining: '50'
        },
        {
          sku: '10106660',
          productName: 'NUTREN PEPTAMEN 400G',
          packingType: 'UNIT',
          type: 'NUTRIOTC',
          batchNo: 'TTNU8008480',
          initialInboundDate: '9/6/20',
          unitPrice: '87.19',
          qty: '1',
          value: '87.19',
          stockHoldingPeriod: '56',
          daysRemaining: '50'
        },
        {
          sku: '10107190',
          productName: 'TOLNADERM CR 15G',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'FOS0043',
          initialInboundDate: '9/6/20',
          unitPrice: '9.56',
          qty: '8',
          value: '76.47',
          stockHoldingPeriod: '56',
          daysRemaining: '120'
        },
        {
          sku: '10107200',
          productName: 'TOLNADERM LOT 10ML',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'ZCSU5131390-7',
          initialInboundDate: '9/6/20',
          unitPrice: '8.74',
          qty: '2',
          value: '17.49',
          stockHoldingPeriod: '56',
          daysRemaining: '100'
        },
        {
          sku: '10107310',
          productName: 'CERUMOL EAR DROP 11ML ',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'BMOU9242286',
          initialInboundDate: '9/6/20',
          unitPrice: '9.89',
          qty: '72',
          value: '711.90',
          stockHoldingPeriod: '56',
          daysRemaining: '33'
        },
        {
          sku: '10107360',
          productName: 'A LICES 60ML',
          packingType: 'UNIT',
          type: 'TOI HAIR',
          batchNo: 'UMDOEC0008',
          initialInboundDate: '9/6/20',
          unitPrice: '11.95',
          qty: '118',
          value: '1409.76',
          stockHoldingPeriod: '56',
          daysRemaining: '44'
        },
        {
          sku: '10107450',
          productName: "PANADOL SOLUBLE 20'S  ",
          packingType: 'UNIT',
          type: 'PFG',
          batchNo: 'UMDOEC0035',
          initialInboundDate: '9/6/20',
          unitPrice: '11.56',
          qty: '35',
          value: '404.77',
          stockHoldingPeriod: '56',
          daysRemaining: '21'
        },
        {
          sku: '10107460',
          productName: "PANADOL SOLUBLE 120'S  ",
          packingType: 'UNIT',
          type: 'PFG',
          batchNo: 'FOS0005',
          initialInboundDate: '9/6/20',
          unitPrice: '67.84',
          qty: '5.79',
          value: '392.78',
          stockHoldingPeriod: '56',
          daysRemaining: '12'
        },
        {
          sku: '10107720',
          productName: 'MAALOX PLUS SUSP 250ML',
          packingType: 'UNIT',
          type: 'NUTRIOTC',
          batchNo: 'FFDO001',
          initialInboundDate: '9/6/20',
          unitPrice: '22.38',
          qty: '12',
          value: '268.53',
          stockHoldingPeriod: '56',
          daysRemaining: '56'
        },
        {
          sku: '10107810',
          productName: "ACTAL PLUS 120'S",
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'MNBU0392461',
          initialInboundDate: '9/6/20',
          unitPrice: '27.22',
          qty: '20.17',
          value: '549.03',
          stockHoldingPeriod: '56',
          daysRemaining: '56'
        },
        {
          sku: '10107830',
          productName: "ACTAL 120'S",
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'CXRU5661108',
          initialInboundDate: '9/7/20',
          unitPrice: '18.49',
          qty: '26.5',
          value: '489.85',
          stockHoldingPeriod: '57',
          daysRemaining: '43'
        },
        {
          sku: '10107850',
          productName: "ACTAL 20'S",
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'SCEU9000020',
          initialInboundDate: '9/8/20',
          unitPrice: '3.16',
          qty: '18',
          value: '56.83',
          stockHoldingPeriod: '58',
          daysRemaining: '23'
        },
        {
          sku: '10107960',
          productName: "CARDIPRIN 100MG 30'S",
          packingType: 'UNIT',
          type: 'POISON C',
          batchNo: 'SZLU9150051',
          initialInboundDate: '9/9/20',
          unitPrice: '13.18',
          qty: '3',
          value: '39.54',
          stockHoldingPeriod: '59',
          daysRemaining: '12'
        },
        {
          sku: '10108220',
          productName: "ULTRACARBON 50'S",
          packingType: 'UNIT',
          type: 'NUTRIOTC',
          batchNo: 'FOS0059',
          initialInboundDate: '9/10/20',
          unitPrice: '16.35',
          qty: '69',
          value: '1128.00',
          stockHoldingPeriod: '60',
          daysRemaining: '32'
        },
        {
          sku: '10108660',
          productName: 'ENO LEMON 100G',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'CXRU1510180',
          initialInboundDate: '9/11/20',
          unitPrice: '8.22',
          qty: '1',
          value: '8.22',
          stockHoldingPeriod: '61',
          daysRemaining: '45'
        },
        {
          sku: '10108670',
          productName: 'ENO WHITE 200G ',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'CGMU5070596',
          initialInboundDate: '9/12/20',
          unitPrice: '11.82',
          qty: '3',
          value: '35.45',
          stockHoldingPeriod: '62',
          daysRemaining: '100'
        },
        {
          sku: '10108680',
          productName: 'ENO LEMON 200G',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'WHLU7736437',
          initialInboundDate: '9/13/20',
          unitPrice: '12.02',
          qty: '8',
          value: '96.13',
          stockHoldingPeriod: '63',
          daysRemaining: '34'
        },
        {
          sku: '10108770',
          productName: 'BREACOL CHILD 60ML',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'SZLU9209930-1',
          initialInboundDate: '9/14/20',
          unitPrice: '5.18',
          qty: '28',
          value: '145.10',
          stockHoldingPeriod: '64',
          daysRemaining: '23'
        },
        {
          sku: '10108780',
          productName: 'BREACOL ADULT 60ML',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'CXRU1341054-6',
          initialInboundDate: '9/15/20',
          unitPrice: '4.96',
          qty: '25',
          value: '124.09',
          stockHoldingPeriod: '65',
          daysRemaining: '60'
        },
        {
          sku: '10108790',
          productName: 'BREACOL ADULT 120ML',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'KLSPDO004755',
          initialInboundDate: '9/16/20',
          unitPrice: '7.48',
          qty: '21',
          value: '156.99',
          stockHoldingPeriod: '66',
          daysRemaining: '156'
        },
        {
          sku: '10108810',
          productName: "PANADOL CHILD 24'S",
          packingType: 'UNIT',
          type: 'PFG',
          batchNo: 'FOS0052',
          initialInboundDate: '9/17/20',
          unitPrice: '5.06',
          qty: '32',
          value: '161.92',
          stockHoldingPeriod: '67',
          daysRemaining: '30'
        },
        {
          sku: '10108820',
          productName: 'PANADOL SUSP 1-6 YEAR 60ML',
          packingType: 'UNIT',
          type: 'PFG',
          batchNo: 'FOS0002',
          initialInboundDate: '9/18/20',
          unitPrice: '6.69',
          qty: '30',
          value: '200.70',
          stockHoldingPeriod: '68',
          daysRemaining: '50'
        },
        {
          sku: '10108830',
          productName: 'PANADOL SUSP 6+YEAR 60ML',
          packingType: 'UNIT',
          type: 'PFG',
          batchNo: 'UMDOEC0033',
          initialInboundDate: '9/19/20',
          unitPrice: '8.49',
          qty: '41',
          value: '348.09',
          stockHoldingPeriod: '69',
          daysRemaining: '50'
        },
        {
          sku: '10108890',
          productName: 'DUPHALAC 200ML ',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'APRU5776837',
          initialInboundDate: '9/20/20',
          unitPrice: '18.09',
          qty: '148',
          value: '2677.69',
          stockHoldingPeriod: '70',
          daysRemaining: '120'
        },
        {
          sku: '10109070',
          productName: 'TAMSOLO EXPECTORANT 120ML',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'OTPU6045425',
          initialInboundDate: '9/20/20',
          unitPrice: '5.28',
          qty: '1',
          value: '5.28',
          stockHoldingPeriod: '70',
          daysRemaining: '100'
        },
        {
          sku: '10109400',
          productName: 'COUNTERPAIN 60G ',
          packingType: 'UNIT',
          type: 'FIRST AID',
          batchNo: 'CGMU5070596-1',
          initialInboundDate: '9/20/20',
          unitPrice: '10.97',
          qty: '127',
          value: '1393.09',
          stockHoldingPeriod: '70',
          daysRemaining: '33'
        },
        {
          sku: '10109460',
          productName: 'SOLCOSERYL JELLY 20G ',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'ZCSU5131390-6',
          initialInboundDate: '9/20/20',
          unitPrice: '19.36',
          qty: '32',
          value: '619.64',
          stockHoldingPeriod: '70',
          daysRemaining: '44'
        },
        {
          sku: '10109470',
          productName: 'SOLCOSERYL OINT 20G  ',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'UMDOEC0003',
          initialInboundDate: '9/20/20',
          unitPrice: '17.06',
          qty: '9',
          value: '153.50',
          stockHoldingPeriod: '70',
          daysRemaining: '21'
        },
        {
          sku: '10109550',
          productName: 'ZAM-BUK OINT 18G',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'FOS0032',
          initialInboundDate: '9/20/20',
          unitPrice: '9.74',
          qty: '3',
          value: '29.22',
          stockHoldingPeriod: '70',
          daysRemaining: '12'
        },
        {
          sku: '10109660',
          productName: 'A BITE CR 15G',
          packingType: 'UNIT',
          type: 'FIRST AID',
          batchNo: 'DO-2010-00036',
          initialInboundDate: '9/20/20',
          unitPrice: '7.76',
          qty: '121',
          value: '939.19',
          stockHoldingPeriod: '70',
          daysRemaining: '56'
        },
        {
          sku: '10109710',
          productName: 'BONJELA GEL 15G',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'KLSPDO04801',
          initialInboundDate: '9/20/20',
          unitPrice: '17.43',
          qty: '8',
          value: '139.44',
          stockHoldingPeriod: '70',
          daysRemaining: '56'
        },
        {
          sku: '10109880',
          productName: 'PRIME ACRIFLAVINE SOL 30ML ',
          packingType: 'UNIT',
          type: 'FIRST AID',
          batchNo: 'CBHU2832439',
          initialInboundDate: '9/20/20',
          unitPrice: '2.30',
          qty: '138',
          value: '316.82',
          stockHoldingPeriod: '70',
          daysRemaining: '43'
        },
        {
          sku: '10110030',
          productName: 'KAPS METHYLATED SPIRIT 100ML',
          packingType: 'UNIT',
          type: 'FIRST AID',
          batchNo: 'CGMU5272154',
          initialInboundDate: '9/20/20',
          unitPrice: '5.20',
          qty: '9',
          value: '46.80',
          stockHoldingPeriod: '70',
          daysRemaining: '23'
        },
        {
          sku: '10110130',
          productName: 'MOSIGUARD INSECT REPELLENT',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'KLSPDO004777',
          initialInboundDate: '9/20/20',
          unitPrice: '19.11',
          qty: '1',
          value: '19.11',
          stockHoldingPeriod: '70',
          daysRemaining: '12'
        },
        {
          sku: '10110160',
          productName: 'PERSKINDOL GEL 100ML ',
          packingType: 'UNIT',
          type: 'FIRST AID',
          batchNo: 'MNBU3365984',
          initialInboundDate: '9/20/20',
          unitPrice: '17.52',
          qty: '20',
          value: '350.42',
          stockHoldingPeriod: '70',
          daysRemaining: '32'
        },
        {
          sku: '10110170',
          productName: 'PERSKINDOL SPRAY 150ML ',
          packingType: 'UNIT',
          type: 'FIRST AID',
          batchNo: 'OOLU6213572-3',
          initialInboundDate: '9/20/20',
          unitPrice: '19.00',
          qty: '18',
          value: '342.00',
          stockHoldingPeriod: '70',
          daysRemaining: '45'
        },
        {
          sku: '10110280',
          productName: 'EGO PINETARSOL SHW SOL 200ML',
          packingType: 'UNIT',
          type: 'HERBAL',
          batchNo: 'TMDOEL000006',
          initialInboundDate: '9/20/20',
          unitPrice: '19.84',
          qty: '1',
          value: '19.84',
          stockHoldingPeriod: '70',
          daysRemaining: '100'
        },
        {
          sku: '10110490',
          productName: 'DETTOL LIQ 750ML',
          packingType: 'UNIT',
          type: 'FIRST AID',
          batchNo: ' ZMOU8874965',
          initialInboundDate: '9/21/20',
          unitPrice: '29.54',
          qty: '80',
          value: '2363.20',
          stockHoldingPeriod: '71',
          daysRemaining: '34'
        },
        {
          sku: '10110510',
          productName: 'OPTREX EYE CLEANS 300ML',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'TRIU8030473',
          initialInboundDate: '9/21/20',
          unitPrice: '29.05',
          qty: '14',
          value: '406.73',
          stockHoldingPeriod: '71',
          daysRemaining: '23'
        },
        {
          sku: '10110520',
          productName: 'OPTREX EYE CLEANS 110ML',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'LHF000011',
          initialInboundDate: '9/21/20',
          unitPrice: '18.29',
          qty: '48',
          value: '877.74',
          stockHoldingPeriod: '71',
          daysRemaining: '60'
        },
        {
          sku: '10110560',
          productName: 'ACULIFE SICKNESS BAND',
          packingType: 'UNIT',
          type: 'FIRST AID',
          batchNo: 'SEGU96798559',
          initialInboundDate: '9/21/20',
          unitPrice: '12.96',
          qty: '4',
          value: '51.84',
          stockHoldingPeriod: '71',
          daysRemaining: '156'
        },
        {
          sku: '10110760',
          productName: 'ACULIFE PILL CRUSHER',
          packingType: 'UNIT',
          type: 'FIRST AID',
          batchNo: 'SZLU9239180',
          initialInboundDate: '9/21/20',
          unitPrice: '11.94',
          qty: '2',
          value: '23.88',
          stockHoldingPeriod: '71',
          daysRemaining: '30'
        },
        {
          sku: '10110920',
          productName: 'KY JELLY 50G ',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'TEMU9135635',
          initialInboundDate: '9/21/20',
          unitPrice: '8.04',
          qty: '51',
          value: '410.03',
          stockHoldingPeriod: '71',
          daysRemaining: '50'
        },
        {
          sku: '10110930',
          productName: 'KY JELLY 100G',
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'EPEDO0003',
          initialInboundDate: '9/21/20',
          unitPrice: '12.95',
          qty: '52',
          value: '673.63',
          stockHoldingPeriod: '71',
          daysRemaining: '50'
        },
        {
          sku: '10111290',
          productName: "DUREX EXTRA SAFE 12'S",
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'MNBU0485610',
          initialInboundDate: '9/21/20',
          unitPrice: '23.72',
          qty: '1',
          value: '23.72',
          stockHoldingPeriod: '71',
          daysRemaining: '120'
        },
        {
          sku: '10111340',
          productName: "DUREX SELECT 3'S",
          packingType: 'UNIT',
          type: 'OTC',
          batchNo: 'FOS0073',
          initialInboundDate: '9/21/20',
          unitPrice: '6.98',
          qty: '156',
          value: '1088.88',
          stockHoldingPeriod: '71',
          daysRemaining: '100'
        },
        {
          sku: '10112470',
          productName: 'ORAL B SATIN TAPE MINT 25M',
          packingType: 'UNIT',
          type: 'DENTAL',
          batchNo: 'KLSPDO004781',
          initialInboundDate: '9/21/20',
          unitPrice: '11.18',
          qty: '2',
          value: '22.36',
          stockHoldingPeriod: '71',
          daysRemaining: '33'
        },
        {
          sku: '10112770',
          productName: 'DARLIE KIDS APPLE 40G',
          packingType: 'UNIT',
          type: 'DENTAL',
          batchNo: 'LHF000025',
          initialInboundDate: '9/21/20',
          unitPrice: '2.70',
          qty: '14',
          value: '37.80',
          stockHoldingPeriod: '71',
          daysRemaining: '44'
        },
        {
          sku: '10115700',
          productName: 'ORGANIC AID E CR 4Oz/110G',
          packingType: 'UNIT',
          type: 'TOI BODY',
          batchNo: 'LHF000057',
          initialInboundDate: '9/21/20',
          unitPrice: '32.63',
          qty: '3',
          value: '97.89',
          stockHoldingPeriod: '71',
          daysRemaining: '21'
        },
        {
          sku: '10115760',
          productName: 'ORGANIC AID E CLEANS FOAM 2OZ',
          packingType: 'UNIT',
          type: 'TOI BODY',
          batchNo: 'ZCSU5131390',
          initialInboundDate: '9/21/20',
          unitPrice: '16.43',
          qty: '3',
          value: '49.29',
          stockHoldingPeriod: '71',
          daysRemaining: '12'
        },
        {
          sku: '10116180',
          productName: 'OXY 5 CR 25G ',
          packingType: 'UNIT',
          type: 'TOI FACE',
          batchNo: 'SZLU9596357',
          initialInboundDate: '9/21/20',
          unitPrice: '13.31',
          qty: '9',
          value: '119.80',
          stockHoldingPeriod: '71',
          daysRemaining: '56'
        }
      ]
    }

    this._searchFields = this.searchFields
    this._config = this.reportConfig
  }

  async pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async _exportableData() {
    try {
      let header = [
        ...this.dataGrist._config.columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .map(column => {
            return column.imex
          })
      ]

      let data = this._products.records

      return { header, data }
    } catch (e) {
      this._showToast(e)
    }
  }

  _modifyDateRange(e) {
    const fromDate = e.currentTarget.value

    if (this._toDateInput.value < fromDate) this._toDateInput.value = fromDate

    let min = new Date(fromDate)
    let today = new Date()
    today.setHours(0, 0, 0, 0)

    min = min.toISOString().split('T')[0]

    this._toDateInput.min = min
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

window.customElements.define('inventory-aging-and-valuation-report', InventoryAgingAndValuationReport)
