import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, CustomAlert, PageView, ScrollbarStyles } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import './system-create-role'
import './system-role-detail'

class SystemRole extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      config: Object,
      active: String,
      data: Object
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

        data-grist {
          overflow-y: auto;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="name"
        @submit=${e => this.dataGrist.fetch()}
      ></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.role_management'),
      actions: [
        {
          title: i18next.t('button.add'),
          action: this._createRole.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteRoles.bind(this)
        }
      ]
    }
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
        label: i18next.t('field.name'),
        type: 'text',
        props: {
          searchOper: 'i_like'
        }
      },
      {
        name: 'description',
        label: i18next.t('field.description'),
        type: 'text',
        props: {
          searchOper: 'i_like'
        }
      }
    ]

    this.config = {
      list: { fields: ['name', 'description'] },
      rows: { appendable: false, selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              openPopup(
                html`
                  <system-role-detail
                    @role-updated="${() => {
                      document.dispatchEvent(
                        new CustomEvent('notify', {
                          detail: {
                            message: i18next.t('text.info_update_successfully')
                          }
                        })
                      )
                      this.dataGrist.fetch()
                    }}"
                    .roleId="${record.id}"
                    .name="${record.name}"
                    .description="${record.description}"
                  ></system-role-detail>
                `,
                {
                  backdrop: true,
                  size: 'large',
                  title: `${i18next.t('title.system_role_detail')} - ${record.name}`
                }
              )
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { align: 'center' },
          width: 180
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { align: 'center' },
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

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          roles(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              domain{
                id
                name
              }
              name
              description
              updater {
                id
                name
                description
              }
              updatedAt
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      return {
        total: response.data.roles.total || 0,
        records: response.data.roles.items || []
      }
    } else {
      return {
        total: 0,
        records: []
      }
    }
  }

  _createRole() {
    this._currentPopupName = openPopup(
      html`
        <system-create-role
          @role-created="${() => {
            this.dataGrist.fetch()
            document.dispatchEvent(
              new CustomEvent('notify', {
                detail: {
                  message: i18next.t('text.info_created_successfully')
                }
              })
            )
          }}"
        >
        </system-create-role>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.system_create_role')
      }
    ).name
  }

  async _deleteRoles() {
    CustomAlert({
      title: i18next.t('text.are_you_sure'),
      text: i18next.t('text.you_wont_be_able_to_revert_this'),
      type: 'warning',
      confirmButton: { text: i18next.t('button.delete'), color: '#22a6a7' },
      cancelButton: { text: 'cancel', color: '#cfcfcf' },
      callback: async result => {
        if (result.value) {
          const ids = this.dataGrist.selected.map(record => record.id)
          if (ids && ids.length > 0) {
            const response = await client.query({
              query: gql`
              mutation {
                deleteRoles(${gqlBuilder.buildArgs({ ids })})
              }
            `
            })

            if (!response.errors) this.dataGrist.fetch()
            await document.dispatchEvent(
              new CustomEvent('notify', {
                detail: {
                  message: i18next.t('text.info_delete_successfully')
                }
              })
            )
          }
        }
      }
    })
  }
}

window.customElements.define('system-role', SystemRole)
