import '@things-factory/form-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, PageView } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

const LOC_SORTING_RULE_SETTING_KEY = 'location-sorting-rule'

class LocationSortingRule extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _locationColumns: Array,
      _orderTypes: Array,
      config: Object,
      data: Object,
      sortingRule: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex: 1;
        }
        data-grist {
          flex: 1;
        }
        mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
          margin: auto;
        }
      `
    ]
  }

  constructor() {
    super()
    this._locationColumns = [
      { name: i18next.t('field.name'), value: 'name' },
      { name: i18next.t('field.description'), value: 'description' },
      { name: i18next.t('field.zone'), value: 'zone' },
      { name: i18next.t('field.row'), value: 'row' },
      { name: i18next.t('field.column'), value: 'column' },
      { name: i18next.t('field.shelf'), value: 'shelf' }
    ]
    this._orderTypes = [
      { name: i18next.t('label.asc'), value: 'ASC' },
      { name: i18next.t('label.desc'), value: 'DESC' }
    ]
    this.sortingRule = {}
  }

  get context() {
    return {
      title: i18next.t('title.location_sorting_rule'),
      actions: [
        {
          title: i18next.t('button.preview'),
          action: this._getPreviewData.bind(this)
        },
        {
          title: i18next.t('button.save'),
          action: this._saveSetting.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.location_sorting_rule')}</legend>

          ${Object.keys(this.sortingRule).map(
            key => html`
              <label>${i18next.t(`field.${key}`)}</label>
              <select name="${key}" @change="${this._adjustValue.bind(this)}">
                <option value=""></option>
                ${this._orderTypes.map(
                  orderType => html`
                    <option value="${orderType.value}" ?selected="${this.sortingRule[key] === orderType.value}"
                      >${orderType.name}</option
                    >
                  `
                )}
              </select>
            `
          )}
        </fieldset>
      </form>

      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.add_rule_field')}</legend>

          <select id="rule-column" @change="${this._addRule.bind(this)}">
            <option value=""></option>
            ${this._locationColumns
              .filter(column => Object.keys(this.sortingRule).indexOf(column.value) < 0)
              .map(
                column => html`
                  <option value="${column.value}">${i18next.t(`field.${column.name}`)}</option>
                `
              )}
          </select>
        </fieldset>
      </form>

      <data-grist .mode=${isMobileDevice() ? 'LIST' : 'GRID'} .config=${this.config} .data="${this.data}"></data-grist>
    `
  }

  get selectField() {
    return this.shadowRoot.querySelector('select#rule-column')
  }

  async pageInitialized() {
    this.config = {
      pagination: { infinite: true },
      list: { fields: ['name', 'type', 'status'] },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'string', name: 'name', header: i18next.t('field.name'), record: { align: 'center' }, width: 150 },
        { type: 'string', name: 'type', header: i18next.t('field.type'), record: { align: 'center' }, width: 150 },
        { type: 'string', name: 'zone', header: i18next.t('field.zone'), record: { align: 'center' }, width: 80 },
        { type: 'string', name: 'row', header: i18next.t('field.row'), record: { align: 'center' }, width: 80 },
        { type: 'string', name: 'column', header: i18next.t('field.column'), record: { align: 'center' }, width: 80 },
        { type: 'string', name: 'shelf', header: i18next.t('field.shelf'), record: { align: 'center' }, width: 80 }
      ]
    }

    await this._getCurrentSortingRule()
  }

  async _getCurrentSortingRule() {
    const response = await client.query({
      query: gql`
        query {
          setting(${gqlBuilder.buildArgs({
            name: LOC_SORTING_RULE_SETTING_KEY
          })}) {
            id
            value
          }
        }
      `
    })

    if (!response.errors) {
      this.settingId = (response.data.setting && response.data.setting.id) || null
      this.sortingRule =
        response.data.setting && response.data.setting.value ? JSON.parse(response.data.setting.value) : {}
    }
  }

  _addRule() {
    const column = this.selectField.value
    this.sortingRule = {
      ...this.sortingRule,
      [column]: ''
    }
    this.selectField.value = null
  }

  _adjustValue(e) {
    if (!e.currentTarget.value) {
      delete this.sortingRule[e.currentTarget.name]
      this.requestUpdate()
    } else {
      this.sortingRule = {
        ...this.sortingRule,
        [e.currentTarget.name]: e.currentTarget.value
      }
    }
  }

  async _getPreviewData() {
    try {
      Object.keys(this.sortingRule).forEach(key => {
        if (!this.sortingRule[key]) throw new Error(i18next.t('text.there_is_no_selected_value'))
      })

      const sortings = Object.keys(this.sortingRule).map(key => {
        return {
          name: key,
          desc: this.sortingRule[key] === 'DESC'
        }
      })

      const response = await client.query({
        query: gql`
        query {
          locations(${gqlBuilder.buildArgs({
            filters: [],
            pagination: { page: 1, limit: 100 },
            sortings
          })}) {
            items {
              name
              type
              zone
              row
              column
              shelf
            }
          }
        }
      `
      })

      if (!response.errors) {
        this.data = {
          ...this.data,
          records: response.data.locations.items
        }
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  async _saveSetting() {
    let response = null
    if (!this.settingId) {
      response = await client.query({
        query: gql`
          mutation {
            createSetting(${gqlBuilder.buildArgs({
              setting: {
                name: LOC_SORTING_RULE_SETTING_KEY,
                category: 'Location',
                description: 'Location sorting rules',
                value: JSON.stringify(this.sortingRule)
              }
            })}) {
              value
            }
          }
        `
      })
    } else {
      response = await client.query({
        query: gql`
          mutation {
            updateSetting(${gqlBuilder.buildArgs({
              name: LOC_SORTING_RULE_SETTING_KEY,
              patch: {
                value: JSON.stringify(this.sortingRule)
              }
            })}) {
              value
            }
          }
        `
      })
    }

    if (!response.errors) {
      this._showToast({ message: i18next.t('text.data_updated_successfully') })
      await this._getCurrentSortingRule()
    }
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

window.customElements.define('location-sorting-rule', LocationSortingRule)
