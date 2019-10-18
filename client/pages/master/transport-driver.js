import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { CustomAlert } from '../../utils/custom-alert'
import '../components/import-pop-up'

class TransportDriver extends localize(i18next)(PageView) {
  static get properties() {
    return {
      config: Object,
      data: Object,
      importHandler: Object,
      bizplace: Array
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
      title: i18next.t('title.transport_driver'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveTransportDriver.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteTransportDriver.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.transport_driver'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this._importableData.bind(this)
      }
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async pageInitialized() {
    this.bizplace = await this.fetchBizplace()

    this._searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.driver_code'),
        name: 'driverCode',
        type: 'text',
        props: { searchOper: 'eq' }
      },
      {
        label: i18next.t('field.description'),
        name: 'description',
        type: 'text',
        props: { searchOper: 'i_like' }
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
          record: {
            editable: true,
            align: 'left'
          },
          imex: { header: i18next.t('field.name'), key: 'name', width: 50, type: 'string' },
          sortable: true,
          width: 250
        },
        {
          type: 'object',
          name: 'bizplace',
          record: {
            align: 'center',
            editable: true,
            options: {
              queryName: 'bizplaces'
            }
          },
          imex: {
            header: i18next.t('field.branch'),
            key: 'bizplace.name',
            width: 50,
            type: 'array',
            arrData: this.bizplace
          },
          header: i18next.t('field.branch'),
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: true,
            align: 'center'
          },
          imex: { header: i18next.t('field.description'), key: 'description', width: 100, type: 'string' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'driverCode',
          header: i18next.t('field.driver_code'),
          record: { editable: true, align: 'center' },
          imex: { header: i18next.t('field.driver_code'), key: 'driverCode', width: 100, type: 'string' },
          sortable: true,
          width: 80
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: {
            editable: false,
            align: 'center'
          },
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
      openPopup(
        html`
          <import-pop-up
            .records=${records}
            .config=${{
              rows: this.config.rows,
              columns: [...this.config.columns.filter(column => column.imex !== undefined)]
            }}
            .importHandler="${this.importHandler.bind(this)}"
          ></import-pop-up>
        `,
        {
          backdrop: true,
          size: 'large',
          title: i18next.t('title.import')
        }
      )
    }, 500)
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          transportDrivers(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
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
              driverCode
              description
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
      total: response.data.transportDrivers.total || 0,
      records: response.data.transportDrivers.items || []
    }
  }

  async importHandler(patches) {
    patches = patches.map(patch => {
      if (patch.bizplace) {
        delete patch.bizplace.__seq__
        delete patch.bizplace.__origin__
        delete patch.bizplace.__selected__
      }
      return patch
    })
    const response = await client.query({
      query: gql`
          mutation {
            updateMultipleTransportDriver(${gqlBuilder.buildArgs({
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

  _openContactPoints(bizplaceId, bizplaceName) {
    openPopup(
      html`
        <contact-point-list .bizplaceId="${bizplaceId}" .bizplaceName="${bizplaceName}"></contact-point-list>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.contact_point_list')
      }
    )
  }

  async _saveTransportDriver() {
    let patches = this.dataGrist.exportPatchList({ flagName: 'cuFlag' })
    if (patches && patches.length) {
      patches = patches.map(patch => {
        if (patch.bizplace) {
          delete patch.bizplace.__seq__
          delete patch.bizplace.__origin__
          delete patch.bizplace.__selected__
        }
        return patch
      })
      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleTransportDriver(${gqlBuilder.buildArgs({
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

  async _deleteTransportDriver() {
    CustomAlert({
      title: i18next.t('text.are_you_sure'),
      text: i18next.t('text.you_wont_be_able_to_revert_this'),
      type: 'warning',
      confirmButton: { text: i18next.t('button.delete'), color: '#22a6a7' },
      cancelButton: { text: 'cancel', color: '#cfcfcf' },
      callback: async result => {
        if (result.value) {
          const names = this.dataGrist.selected.map(record => record.name)
          if (names && names.length > 0) {
            const response = await client.query({
              query: gql`
              mutation {
                deleteTransportDrivers(${gqlBuilder.buildArgs({ names })})
              }
            `
            })

            if (!response.errors) {
              this.dataGrist.fetch()
              document.dispatchEvent(
                new CustomEvent('notify', {
                  detail: {
                    message: i18next.t('text.data_deleted_successfully')
                  }
                })
              )
            }
          }
        }
      }
    })
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

    var headerSetting = this.dataGrist._config.columns
      .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
      .map(column => {
        return column.imex
      })

    var data = records.map(item => {
      return {
        id: item.id,
        ...this._columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .reduce((record, column) => {
            record[column.imex.key] = column.imex.key
              .split('.')
              .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
            return record
          }, {})
      }
    })

    return { header: headerSetting, data: data }
  }

  async fetchBizplace() {
    const response = await client.query({
      query: gql`
          query {
            bizplaces(${gqlBuilder.buildArgs({
              filters: []
            })}) {
              items {
                id
                name
              }
            }
          }
        `
    })
    return response.data.bizplaces.items
  }
}

window.customElements.define('transport-driver', TransportDriver)
