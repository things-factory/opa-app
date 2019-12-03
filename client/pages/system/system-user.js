import { getCodeByName } from '@things-factory/code-base'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import { CustomAlert } from '../../utils/custom-alert'
import '@things-factory/grist-ui'
import './system-create-user'
import './system-user-detail'

class SystemUser extends connect(store)(localize(i18next)(PageView)) {
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

        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.user_management'),
      actions: [
        {
          title: i18next.t('button.add'),
          action: this._createUser.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteUsers.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <search-form id="search-form" .fields=${this._searchFields} @submit=${() => this.dataGrist.fetch()}></search-form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async pageInitialized() {
    this.userTypes = await getCodeByName('USER_TYPES')

    this._searchFields = [
      {
        name: 'domain',
        label: i18next.t('field.domain'),
        type: 'text',
        props: {
          searchOper: 'i_like'
        }
      },
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
      },
      {
        name: 'email',
        name: i18next.t('field.email'),
        type: 'text',
        props: {
          searchOper: 'i_like'
        }
      },
      {
        name: 'user_type',
        label: i18next.t('field.user_type'),
        type: 'select',
        options: [
          { value: '' },
          ...this.userTypes.map(userType => {
            return {
              name: userType.name,
              value: userType.name
            }
          })
        ],
        props: { searchOper: 'eq' }
      }
    ]

    this.config = {
      rows: { appendable: false, selectable: { multiple: true } },
      columns: [
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
                  <system-user-detail
                    @user-updated="${() => {
                      document.dispatchEvent(
                        new CustomEvent('notify', {
                          detail: {
                            message: i18next.t('text.info_update_successfully')
                          }
                        })
                      )
                      this.dataGrist.fetch()
                    }}"
                    .userId="${record.id}"
                    .email="${record.email}"
                  ></system-user-detail>
                `,
                {
                  backdrop: true,
                  size: 'large',
                  title: `${i18next.t('title.user_detail')} - ${record.name}`
                }
              )
            }
          }
        },
        {
          type: 'object',
          name: 'domain',
          header: i18next.t('field.domain'),
          record: {
            editable: false,
            align: 'center'
          },
          width: 150
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: false
          },
          width: 250
        },
        {
          type: 'string',
          name: 'email',
          header: i18next.t('field.email'),
          record: {
            editable: false
          },
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: false
          },
          width: 200
        },
        {
          type: 'string',
          name: 'userType',
          header: i18next.t('field.user_type'),
          record: {
            editable: false,
            align: 'center'
          },
          width: 200
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: {
            editable: false
          },
          width: 180
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
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

  async fetchHandler({ page, limit, sorters = [] }) {
    console.log(this.searchForm.queryFilters)
    const response = await client.query({
      query: gql`
        query {
          users(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              domain {
                id
                name
                description
              }
              name
              description
              email
              userType
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
        total: response.data.users.total || 0,
        records: response.data.users.items || []
      }
    } else {
      return {
        total: 0,
        records: []
      }
    }
  }

  _createUser() {
    openPopup(
      html`
        <system-create-user
          @user-created="${() => {
            this.dataGrist.fetch()
            document.dispatchEvent(
              new CustomEvent('notify', {
                detail: {
                  message: i18next.t('text.info_created_successfully')
                }
              })
            )
          }}"
        ></system-create-user>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.create_user')
      }
    )
  }

  async _deleteUsers() {
    CustomAlert({
      title: i18next.t('text.are_you_sure'),
      text: i18next.t('text.you_wont_be_able_to_revert_this'),
      type: 'warning',
      confirmButton: { text: i18next.t('button.delete'), color: '#22a6a7' },
      cancelButton: { text: 'cancel', color: '#cfcfcf' },
      callback: async result => {
        if (result.value) {
          const emails = this.dataGrist.selected.map(record => record.email)
          if (emails && emails.length > 0) {
            const response = await client.query({
              query: gql`
                mutation {
                  deleteUsers(${gqlBuilder.buildArgs({ emails })})
                }
              `
            })

            if (!response.errors) {
              this.dataGrist.fetch()
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
    })
  }
}

window.customElements.define('system-user', SystemUser)
