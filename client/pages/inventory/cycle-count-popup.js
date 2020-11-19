import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

class CycleCountPopup extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      config: Object,
      data: Object,
      selectedInventory: Array
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
        }
        .grist {
          background-color: var(--main-section-background-color);
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
        .button-container button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  render() {
    return html`
      <form id="input-form" name="cycleCount" class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.cycle_count_information')}</legend>
          <label>${i18next.t('label.execute_date')}</label>
          <input name="executionDate" type="date" min="${this._getStdDate()}" required />
        </fieldset>
      </form>

      <div class="grist">
        <data-grist
          id="grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data="${this.data}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click="${this.generateCycleCountWorksheet.bind(this)}">${i18next.t('button.create')}</button>
      </div>
    `
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  get date() {
    return this.shadowRoot.querySelector('input[name=executionDate]')
  }

  get cycleCountForm() {
    return this.shadowRoot.querySelector('form[name=cycleCount]')
  }

  async firstUpdated() {
    this.config = {
      list: { fields: ['palletId', 'product', 'location', 'qty'] },
      pagination: { infinite: true },
      rows: { appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        {
          type: 'string',
          name: 'palletId',
          header: i18next.t('field.pallet_id'),
          record: { align: 'left' },
          width: 130
        },
        {
          type: 'string',
          name: 'batchId',
          header: i18next.t('field.batch_no'),
          record: { align: 'left' },
          width: 100
        },
        {
          type: 'object',
          name: 'product',
          header: i18next.t('field.product'),
          record: { align: 'left' },
          width: 250
        },
        {
          type: 'object',
          name: 'location',
          header: i18next.t('field.location'),
          record: { align: 'center' },
          width: 120
        },
        {
          type: 'integer',
          name: 'qty',
          header: i18next.t('field.available_qty'),
          record: { align: 'center' },
          width: 100
        },
        {
          type: 'float',
          name: 'uomValue',
          header: i18next.t('field.available_uom_value'),
          record: { align: 'center' },
          width: 100
        }
      ]
    }

    this.fetchHandler()
  }

  fetchHandler() {
    if (this.selectedInventory && this.selectedInventory.length) {
      this.data = {
        total: this.selectedInventory.length || 0,
        records: this.selectedInventory.map(item => {
          return {
            ...item
          }
        })
      }
    }
  }

  _getStdDate() {
    let date = new Date()
    date.setDate(date.getDate())
    return date.toISOString().split('T')[0]
  }

  async generateCycleCountWorksheet() {
    const _selectedPallet = this.selectedInventory.map(inv => {
      return {
        palletId: inv.palletId,
        batchId: inv.batchId
      }
    })
    try {
      this._validateDate()
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.create_cycle_count'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
          mutation {
            generateCycleCountWorksheet(${gqlBuilder.buildArgs({
              selectedInventory: _selectedPallet,
              executionDate: this.date.value
            })}) {
              cycleCountWorksheet {
                name
              }
            }
          }
        `
      })

      if (!response.errors) {
        this._showToast({ message: i18next.t('text.cycle_count_worksheet_created') })
        this.dispatchEvent(new CustomEvent('completed'))
      }
    } catch (e) {
      this._showToast(e)
    }
  }

  _validateDate() {
    if (!this.cycleCountForm.checkValidity()) throw new Error(i18next.t('text.cycle_count_date_invalid'))
  }

  _compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0
      }

      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key]
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key]

      let comparison = 0
      if (varA > varB) {
        comparison = 1
      } else if (varA < varB) {
        comparison = -1
      }
      return order === 'desc' ? comparison * -1 : comparison
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

window.customElements.define('cycle-count-popup', CycleCountPopup)
