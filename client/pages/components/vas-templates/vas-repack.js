import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import '../image-viewer'
import { VasTemplate } from './vas-template'

class VasRepack extends localize(i18next)(VasTemplate) {
  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        .container {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      record: Object,
      packingTypes: Array
    }
  }

  render() {
    return html`
      <div class="container">
        <form id="product-info-form" class="single-column-form" @submit="${e => e.preventDefault()}">
          <fieldset>
            <legend>${i18next.t('title.repack')}</legend>

            <label>${i18next.t('label.packing_type')}</label>
            <input
              readonly
              ?hidden="${!this.record || !this.record.batchId}"
              value="${(this.record && this.record.batchId) || ''}"
            />

            <label>${i18next.t('label.product')}</label>
            <input
              readonly
              ?hidden="${!this.record || !this.record.product}"
              value="${(this.record && this.record.batchId) || ''}"
            />
          </fieldset>
        </form>
      </div>
    `
  }

  async firstUpdated() {
    const response = await client.query({
      query: gql`
        query {
          commonCodes(${gqlBuilder.buildArgs({
            name: 'PACKING_TYPES'
          })}) {
            details {
              name
              description
              rank
            }
          }
        }
      `
    })

    if (response && !response.errors) {
      this.packingTypes = response.data.commonCodes.details
    }
  }
}

window.customElements.define('vas-repack', VasRepack)
