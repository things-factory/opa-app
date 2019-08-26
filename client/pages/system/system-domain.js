import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, isMobileDevice, PageView } from '@things-factory/shell'
import { openPopup } from '@things-factory/layout-base'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class SystemDomain extends localize(i18next)(PageView) {
  static get properties() {
    return {
      config: Object,
      data: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          height: 100%;
        }
        .grist {
          background-color: var(--main-section-background-color);
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

  get context() {
    return {
      title: i18next.t('title.system_domain'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._saveSystemDomain.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('label.name')}</legend>
          <label>${i18next.t('label.name')}</label>
          <input name="name" />

          <label>${i18next.t('label.subdomain')}</label>
          <input name="subdomain" />

          <label>${i18next.t('label.brand_name')}</label>
          <input name="brand_name" />

          <label>${i18next.t('label.system_flag')}</label>
          <input type="checkbox" name="system_flag" />
        </fieldset>
      </form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>
      </div>
    `
  }

  async firstUpdated() {
    this.config = {
      pagination: {
        infinite: true
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'delete_outline',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this._deleteSystemDomain(record.name)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 100
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 100
        },
        {
          type: 'string',
          name: 'timezone',
          header: i18next.t('field.timezone'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 100
        },
        {
          type: 'boolean',
          name: 'system_flag',
          header: i18next.t('field.system_flag'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 100
        },
        {
          type: 'string',
          name: 'subdomain',
          header: i18next.t('field.subdomain'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 100
        },
        {
          type: 'string',
          name: 'brand_name',
          header: i18next.t('field.brand_name'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 100
        },
        {
          type: 'string',
          name: 'brand_image',
          header: i18next.t('field.brand_image'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 100
        },
        {
          type: 'string',
          name: 'content_image',
          header: i18next.t('field.content_image'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 100
        },
        {
          type: 'string',
          name: 'theme',
          header: i18next.t('field.theme'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 100
        }
      ],
      rows: {
        selectable: {
          multiple: false
        },
        handlers: {
          click: 'select-row'
        }
      }
    }

    this.data = await this._getDomainData()
  }

  async _getDomainData() {
    const response = await client.query({
      query: gql`
        query {
          domains {
            items {
              name
              description
              timezone
              subdomain
              theme
            }
            total
          }
        }
      `
    })

    this.rawDomainrData = response.data.domains.items || []

    return {
      records: response.data.domains.items.map(item => {
        // const domainInfo = JSON.parse(item.description)
        return {
          ...item
        }
      }),
      total: response.data.domains.total
    }
  }

  async _saveSystemDomain() {
    try {
      //그리드 데이터  update / create
    } catch (e) {
      this._notify(e.message)
    }
  }

  async _updateSystemDomain() {}
  async _deleteSystemDomain() {}

  _notify(message, level = '') {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          level,
          message
        }
      })
    )
  }
}

window.customElements.define('system-domain', SystemDomain)
