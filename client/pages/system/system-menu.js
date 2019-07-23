import { localize, i18next } from '@things-factory/i18n-base'
import { PageView, isMobileDevice, client, gqlBuilder } from '@things-factory/shell'
import { openPopup } from '@things-factory/layout-base'
import gql from 'graphql-tag'
import { html, css } from 'lit-element'
import '@things-factory/simple-ui'

class SystemMenu extends localize(i18next)(PageView) {
  static get properties() {
    return {
      groupMenuConfig: Object,
      screenConfig: Object,
      groupMenus: Object,
      screens: Object
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        overflow-x: overlay;
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
      .button-container {
        margin-left: auto;
      }
    `
  }

  get context() {
    return {
      title: i18next.t('title.menu')
    }
  }

  firstUpdated() {
    this.groupMenuConfig = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'edit',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const textarea = document.createElement('textarea')
              textarea.style.width = '600px'
              textarea.style.height = '400px'
              delete record.__typename
              textarea.value = JSON.stringify(record, null, 2)
              const isCreate = !record.name
              openPopup(
                html`
                  <div style="background-color: white; display: flex; flex-direction: column; padding: 10px;">
                    ${textarea}
                    <div style="margin-left: auto;">
                      <mwc-button
                        @click="${() => {
                          if (isCreate) {
                            this._createGroup(JSON.parse(textarea.value))
                          } else {
                            this._updateMenu(JSON.parse(textarea.value))
                          }
                        }}"
                        >save</mwc-button
                      >
                    </div>
                  </div>
                `,
                {
                  backdrop: true
                }
              )
            }
          }
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'delete',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._deleteMenu(record.name)
            }
          }
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'info',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._groupName = record.name
              this._getScreens()
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            align: 'left'
          },
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'int',
          name: 'rank',
          header: i18next.t('field.rank'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'boolean',
          name: 'hiddenFlag',
          header: i18next.t('field.hidden_flag'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        }
      ]
    }

    this.screenConfig = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'edit',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              const textarea = document.createElement('textarea')
              textarea.style.width = '600px'
              textarea.style.height = '400px'
              const isCreate = !record.name
              delete record.__typename
              textarea.value = JSON.stringify(record, null, 2)
              openPopup(
                html`
                  <div style="background-color: white; display: flex; flex-direction: column; padding: 10px;">
                    ${textarea}
                    <div style="margin-left: auto;">
                      <mwc-button
                        @click="${() => {
                          if (isCreate) {
                            this._createScreen(JSON.parse(textarea.value))
                          } else {
                            this._updateMenu(JSON.parse(textarea.value))
                          }
                        }}"
                        >save</mwc-button
                      >
                    </div>
                  </div>
                `,
                {
                  backdrop: true
                }
              )
            }
          }
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'delete',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._deleteMenu(record.name)
            }
          }
        },
        {
          type: 'gutter',
          name: 'button',
          icon: 'info',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              if (!record || !record.name) return
              location.href = `system-menu-column/${record.name}`
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            align: 'left'
          },
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 200
        },
        {
          type: 'string',
          name: 'template',
          header: i18next.t('field.template'),
          record: {
            align: 'left',
            editable: true
          },
          width: 200
        },
        {
          type: 'int',
          name: 'rank',
          header: i18next.t('field.rank'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'boolean',
          name: 'hiddenFlag',
          header: i18next.t('field.hidden_flag'),
          record: {
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'string',
          name: 'routing',
          header: i18next.t('field.routing'),
          record: {
            align: 'left',
            editable: true
          },
          width: 200
        },
        {
          type: 'select',
          name: 'routingType',
          header: i18next.t('field.routing_type'),
          record: {
            align: 'center',
            options: ['STATIC', 'RESOURCE'],
            editable: true
          },
          width: 100
        },
        {
          type: 'select',
          name: 'resourceType',
          header: i18next.t('field.resource_type'),
          record: {
            align: 'center',
            options: ['MENU', 'ENTITY'],
            editable: true
          },
          width: 100
        },
        {
          type: 'string',
          name: 'resourceName',
          header: i18next.t('field.resource_name'),
          record: {
            align: 'left',
            editable: true
          },
          width: 150
        },
        {
          type: 'string',
          name: 'resourceUrl',
          header: i18next.t('field.resource_url'),
          record: {
            align: 'left',
            editable: true
          },
          width: 200
        },
        {
          type: 'string',
          name: 'idField',
          header: i18next.t('field.id_field'),
          record: {
            align: 'left',
            editable: true
          },
          width: 80
        },
        {
          type: 'string',
          name: 'titleField',
          header: i18next.t('field.title_field'),
          record: {
            align: 'left',
            editable: true
          },
          width: 80
        }
      ]
    }
  }

  activated(state) {
    this._getGroupMenus()
  }

  render() {
    return html`
      <div>
        <form>
          <input name="name" />
          <input name="description" />
        </form>
      </div>

      <div class="grist">
        <label>${i18next.t('title.group_menu')}</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.groupMenuConfig}
          .data=${this.groupMenus}
        ></data-grist>

        <div class="button-container">
          <mwc-button
            @click="${() => {
              this.groupMenus = {
                ...this.groupMenus,
                records: [
                  ...this.groupMenus.records,
                  {
                    name: '',
                    description: '',
                    hiddenFlag: false,
                    rank: ''
                  }
                ]
              }
            }}"
            >${i18next.t('button.add')}</mwc-button
          >
        </div>
      </div>

      <div class="grist">
        <label>${i18next.t('title.screen')}</label>

        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.screenConfig}
          .data=${this.screens}
        ></data-grist>

        <div class="button-container">
          <mwc-button
            @click="${() => {
              this.screens = {
                ...this.screens,
                records: [
                  ...this.screens.records,
                  {
                    name: '',
                    description: '',
                    template: '',
                    rank: '',
                    hiddenFlag: false,
                    routing: '',
                    routingType: '',
                    resourceType: '',
                    resourceName: '',
                    resourceUrl: '',
                    idField: '',
                    titleField: ''
                  }
                ]
              }
            }}"
            >${i18next.t('button.add')}</mwc-button
          >
        </div>
      </div>
    `
  }

  async _getGroupMenus() {
    const response = await client.query({
      query: gql`
        query {
          groupMenus: menus (${gqlBuilder.buildArgs({
            filters: [{ name: 'menu_type', value: 'MENU', operator: 'eq' }]
          })}) {
            items {
              name
              description
              hiddenFlag
              rank
            }
            total
          }
        }
      `
    })

    this.groupMenus = {
      records: response.data.groupMenus.items,
      total: response.data.groupMenus.total
    }
  }

  async _getScreens() {
    if (!this._groupName) return
    const response = await client.query({
      query: gql`
        query {
          screens: menu(${gqlBuilder.buildArgs({
            name: this._groupName
          })}) {
            childrens {
              name
              description
              template
              rank
              hiddenFlag
              routing
              routingType
              resourceType
              resourceName
              resourceUrl
              idField
              titleField
            }
          }
        }
      `
    })

    this.screens = {
      records: response.data.screens.childrens,
      total: response.data.screens.childrens.length
    }
  }

  async _createGroup(record) {
    record.menuType = 'MENU'
    await client.query({
      query: gql`
        mutation {
          createMenu(${gqlBuilder.buildArgs({
            menu: record
          })}) {
            name
          }
        }
      `
    })

    history.back()
    this._getGroupMenus()
    this._getScreens()
  }

  async _createScreen(record) {
    record.parent = this._groupName
    record.menuType = 'SCREEN'
    await client.query({
      query: gql`
        mutation {
          createMenu(${gqlBuilder.buildArgs({
            menu: record
          })}) {
            name
          }
        }
      `
    })

    history.back()
    this._getGroupMenus()
    this._getScreens()
  }

  async _updateMenu(record) {
    await client.query({
      query: gql`
        mutation {
          updateMenu(${gqlBuilder.buildArgs({
            name: record.name,
            patch: record
          })}) {
            name
          }
        }
      `
    })

    history.back()
    this._getGroupMenus()
    this._getScreens()
  }

  async _deleteMenu(menuName) {
    let deleteConfirm = confirm('Are you sure?')
    if (deleteConfirm) {
      await client.query({
        query: gql`
          mutation {
            deleteMenu(${gqlBuilder.buildArgs({
              name: menuName
            })}) {
              name
            }
          }
        `
      })
    }
    this._getGroupMenus()
    this._getScreens()
  }
}

window.customElements.define('system-menu', SystemMenu)
