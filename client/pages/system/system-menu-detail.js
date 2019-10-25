import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import './system-menu-detail'

class SystemMenuDetail extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      menuName: String,
      menuId: String,
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          padding: 0 15px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
        }
        h2 {
          margin: var(--subtitle-margin);
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
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
        .button-container {
          padding: var(--button-container-padding);
          margin: var(--button-container-margin);
          text-align: var(--button-container-align);
          background-color: var(--button-container-background);
          height: var(--button-container-height);
        }
        .button-container button {
          background-color: var(--button-container-button-background-color);
          border-radius: var(--button-container-button-border-radius);
          height: var(--button-container-button-height);
          border: var(--button-container-button-border);
          margin: var(--button-container-button-margin);

          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container button:hover,
        .button-container button:active,
        .button-container button[ok] {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  render() {
    return html`
      <h2>${i18next.t('title.menu')}</h2>
      <search-form id="search-form" .fields=${this._searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <h2>${i18next.t('title.submenus')}</h2>
      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click=${this._deleteMenus}>${i18next.t('button.delete')}</button>
        <button ok @click=${this._saveMenus}>${i18next.t('button.save')}</button>
      </div>
    `
  }

  async firstUpdated() {
    this._searchFields = [
      {
        name: 'name',
        label: i18next.t('field.name'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'description',
        label: i18next.t('field.description'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'template',
        label: i18next.t('field.template'),
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        name: 'resourceUrl',
        label: i18next.t('field.resource_url'),
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      pagination: { infinite: true },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'object',
          name: 'parent',
          header: i18next.t('field.group_menu'),
          record: {
            options: {
              queryName: 'menus',
              basicArgs: {
                filters: [
                  {
                    name: 'menuType',
                    value: 'MENU',
                    operator: 'eq'
                  }
                ]
              }
            },
            editable: true
          },
          sortable: true,
          width: 180
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'integer',
          name: 'rank',
          header: i18next.t('field.rank'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 80
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
          type: 'string',
          name: 'category',
          header: i18next.t('field.category'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'template',
          header: i18next.t('field.template'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'resourceUrl',
          header: i18next.t('field.resource_url'),
          record: { editable: true, align: 'left' },
          sortable: true,
          width: 160
        },
        {
          type: 'boolean',
          name: 'hiddenFlag',
          header: i18next.t('field.hidden_flag'),
          record: { editable: true, align: 'center' },
          sortable: true,
          width: 80
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

  async fetchHandler({ page, limit, sorters = [{ name: 'rank' }, { name: 'name' }] }) {
    const response = await client.query({
      query: gql`
        query {
          menus(${gqlBuilder.buildArgs({
            filters: [...this.searchForm.queryFilters, { name: 'parent', operator: 'eq', value: this.menuId }],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              rank
              description
              category
              template
              resourceUrl
              parent {
                id
                name
                description
              }
              hiddenFlag
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
      total: response.data.menus.total || 0,
      records: response.data.menus.items || []
    }
  }

  async _saveMenus() {
    let patches = this.dataGrist.dirtyRecords
    if (patches && patches.length) {
      patches = patches.map(menu => {
        let patchField = menu.id ? { id: menu.id } : {}
        if (!patchField.parent) {
          patchField.parent = { id: this.menuId }
          delete menu.parent.__selected__
          delete menu.parent.__origin__
          delete menu.parent.__seq__
        }
        const dirtyFields = menu.__dirtyfields__
        for (let key in dirtyFields) {
          patchField[key] = dirtyFields[key].after
        }
        patchField.cuFlag = menu.__dirty__
        patchField.routingType = patchField.routingType ? patchField.routingType : 'STATIC'

        return patchField
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleMenu(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }

  async _deleteMenus() {
    const names = this.dataGrist.selected.map(record => record.name)
    if (names && names.length > 0) {
      const response = await client.query({
        query: gql`
              mutation {
                deleteMenus(${gqlBuilder.buildArgs({ names })})
              }
            `
      })

      if (!response.errors) this.dataGrist.fetch()
    }
  }
}

window.customElements.define('system-menu-detail', SystemMenuDetail)
