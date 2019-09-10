import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import '../components/import-pop-up'

class TransportVehicle extends localize(i18next)(PageView) {
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
      data: Object,
      importHandler: Object
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        @submit=${async () => this.dataGrist.fetch()}
      ></search-form>

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
      title: i18next.t('title.transport_vehicle'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveTransportVehicle.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteTransportVehicle.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.transport_vehicle'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
    }
  }

  activated(active) {
    if (JSON.parse(active) && this.dataGrist) {
      this.dataGrist.fetch()
    }
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'regNumber',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.reg_number') }
      },
      {
        name: 'size',
        type: 'text',
        props: { searchOper: 'eq', placeholder: i18next.t('label.size') }
      },
      {
        name: 'status',
        type: 'text',
        props: { searchOper: 'like', placeholder: i18next.t('label.status') }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'regNumber',
          header: i18next.t('field.registration_number'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'bizplace',
          record: {
            align: 'center',
            editable: true,
            options: {
              queryName: 'bizplaces'
              // basicArgs: {
              //   filters: [
              //     {
              //       name: 'name',
              //       value: 'o',
              //       operator: 'like',
              //       dataType: 'string'
              //     }
              //   ]
              // }
            }
          },
          header: i18next.t('field.bizplace'),
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'size',
          header: i18next.t('field.size'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 80
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 100
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
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

  _importableData(records) {
    setTimeout(() => {
      openPopup(html`
        <import-pop-up
          style="width: 80vw; height: 80vh"
          .records=${records}
          .config=${this.config}
          .importHandler="${this.importHandler.bind(this)}"
        ></import-pop-up>
      `)
    }, 500)
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          transportVehicles(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              bizplace{
                id
                name
              }
              regNumber
              description
              size
              status
              updatedAt
              updater{
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

    return {
      total: response.data.transportVehicles.total || 0,
      records: response.data.transportVehicles.items || []
    }
  }

  async importHandler(patches) {
    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleTransportVehicle(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
    })

    if (!response.errors) {
      history.back()
      this.dataGrist.fetch()
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            message: i18next.t('text.data_imported_successfully')
          }
        })
      )
    }
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

  async _saveTransportVehicle() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(transportVehicle => {
        let patchField = transportVehicle.id ? { id: transportVehicle.id } : {}
        const dirtyFields = transportVehicle.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.cuFlag = transportVehicle.__dirty__

        return patchField
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleTransportVehicle(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.data_updated_successfully')
            }
          })
        )
      }
    }
  }

  async _deleteTransportVehicle() {
    let confirmDelete = confirm('Are you sure?')
    if (confirmDelete) {
      const names = this.dataGrist.selected.map(record => record.name)
      if (names && names.length > 0) {
        const response = await client.query({
          query: gql`
              mutation {
                deleteTransportVehicles(${gqlBuilder.buildArgs({ names })})
              }
            `
        })

        if (!response.errors) {
          this.dataGrist.fetch()
          document.dispatchEvent(
            new CustomEvent('notify', {
              detail: {
                message: i18next.t('text.data_updated_successfully')
              }
            })
          )
        }
      }
    }
  }

  get _columns() {
    return this.config.columns
  }

  _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = this.dataGrist.data.records
    }

    return records.map(item => {
      return this._columns
        .filter(column => column.type !== 'gutter')
        .reduce((record, column) => {
          record[column.name] = item[column.name]
          return record
        }, {})
    })
  }
}

window.customElements.define('transport-vehicle', TransportVehicle)
