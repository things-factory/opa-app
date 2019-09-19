import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
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

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="name"
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
      title: i18next.t('title.role'),
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

  activated(active) {
    if (JSON.parse(active) && this.dataGrist) {
      this.dataGrist.fetch()
    }
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        type: 'text',
        props: {
          placeholder: i18next.t('field.name'),
          searchOper: 'like'
        }
      },
      {
        name: 'description',
        type: 'text',
        props: {
          placeholder: i18next.t('field.description'),
          searchOper: 'like'
        }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
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
                  ></system-role-detail>
                `
              )
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 200
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: {
            editable: false,
            align: 'center'
          },
          width: 180
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: {
            editable: false,
            align: 'center'
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

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          roles(${gqlBuilder.buildArgs({
            filters: this._conditionParser(),
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
      `
    ).name
  }

  async _deleteRoles() {
    if (confirm(i18next.t('text.sure_to_delete'))) {
      const names = this.dataGrist.selected.map(record => record.name)
      if (names && names.length > 0) {
        const response = await client.query({
          query: gql`
              mutation {
                deleteRoles(${gqlBuilder.buildArgs({ names })})
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
}

window.customElements.define('system-role', SystemRole)
