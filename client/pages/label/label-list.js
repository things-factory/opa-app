import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

class LabelList extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      _searchFields: Array,
      data: Object,
      config: Object
    }
  }

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
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.user'),
      printable: {
        options: {}
      }
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${() => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <data-grist .mode=${isMobileDevice() ? 'LIST' : 'GRID'} .config=${this.config}></data-grist>
      </div>
    `
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  pageInitialized() {
    this._searchFields = [
      {
        name: 'name',
        type: 'text',
        props: {
          placeholder: i18next.t('field.product_name'),
          searchOper: 'like'
        }
      },
      {
        name: 'batchNo',
        type: 'text',
        props: {
          placeholder: i18next.t('field.batch_no'),
          searchOper: 'like'
        }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.product_name'),
          record: {
            editable: false
          },
          width: 250
        },
        {
          type: 'string',
          name: 'batchNo',
          header: i18next.t('field.batch_no'),
          record: {
            editable: false
          },
          width: 200
        },
        {
          type: 'string',
          name: 'palletQty',
          header: i18next.t('field.pallet_qty'),
          record: {
            editable: false
          },
          width: 100
        },
        {
          type: 'string',
          name: 'qty',
          header: i18next.t('field.qty'),
          record: {
            editable: false
          },
          width: 100
        },
        {
          type: 'string',
          name: 'packageType',
          header: i18next.t('field.packageType'),
          record: {
            editable: false
          },
          width: 150
        },
        {
          type: 'datetime',
          name: 'printedAt',
          header: i18next.t('field.printed_at'),
          record: {
            editable: false
          },
          width: 180
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

  _conditionParser() {
    return this.searchForm
      .getFields()
      .filter(field => (field.type !== 'checkbox' && field.value && field.value !== '') || field.type === 'checkbox')
      .map(field => {
        return {
          name: field.name,
          value:
            field.type === 'text'
              ? field.value
              : field.type === 'checkbox'
              ? field.checked
              : field.type === 'number'
              ? parseFloat(field.value)
              : field.value,
          operator: field.getAttribute('searchOper')
        }
      })
  }
}

window.customElements.define('label-list', LabelList)
