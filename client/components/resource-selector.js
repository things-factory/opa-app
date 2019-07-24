import { css, html, LitElement } from 'lit-element'
import { client, gqlBuilder, isMobileDevice } from '@things-factory/shell'
import gql from 'graphql-tag'

class ResourceSelector extends LitElement {
  static get properties() {
    return {
      config: Object,
      data: Object,
      resource: String
    }
  }

  static get styles() {
    return css``
  }

  render() {
    return html`
      <data-grist .mode="${isMobileDevice() ? 'LIST' : 'GRID'}" .config="${this.config}" .data="${this.data}">
      </data-grist>
    `
  }

  async updated(changeProps) {
    if (changeProps.has('resource')) {
      this.config = await this._getMeta()
      this.data = await this._getData()
    }
  }

  async _getMeta() {
    const response = await client.query({
      query: gql`
        query {
          menu(name: "${this.resource}") {
            columns {
              name
              term
              colType
              colSize
              nullable
              refType
              refName
              refUrl
              refRelated
              searchRank
              sortRank
              reverseSort
              searchEditor
              searchOper
              searchInitVal
              gridRank
              gridEditor
              gridFormat
              gridValidator
              gridWidth
              gridAlign
              formEditor
              formValidator
              formFormat
              defVal
              rangeVal
              ignoreOnSave
            }
          }
        }
      `
    })
  }
}

window.customElements.define('resource-selector', ResourceSelector)
