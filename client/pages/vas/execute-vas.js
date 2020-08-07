import '@things-factory/barcode-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { PageView, store } from '@things-factory/shell'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { ARRIVAL_NOTICE, RELEASE_OF_GOODS, VAS_ORDER } from '../order/constants'
import './execute-pure-vas'
import './execute-ref-vas'

const AVAIL_ORDER_TYPES = { ARRIVAL_NOTICE, RELEASE_OF_GOODS, VAS_ORDER }

class ExecuteVas extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      refOrderType: String
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          overflow: auto;
          display: flex;
          flex-direction: column;
        }
        .container {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
      `
    ]
  }

  render() {
    return html`
      <form class="multi-column-form" id="info-form">
        <fieldset>
          <legend>${i18next.t('title.scan_area')}</legend>
          <label>${i18next.t('label.order_type')}</label>
          <select name="orderType" @change="${this.orderTypeChangeHandler.bind(this)}">
            ${Object.keys(AVAIL_ORDER_TYPES).map(
              key => html`
                <option value="${AVAIL_ORDER_TYPES[key].value}"
                  >${i18next.t(`label.${AVAIL_ORDER_TYPES[key].name}`)}</option
                >
              `
            )}
          </select>

          <label>${i18next.t('label.order_no')}</label>
          <barcode-scanable-input
            name="orderNo"
            custom-input
            @keypress="${this.orderNoKeypressHandler.bind(this)}"
          ></barcode-scanable-input>
        </fieldset>
      </form>

      <!-- Showing proper component based on type of reference order -->
      <div class="container">
        ${this.refOrderType === VAS_ORDER.value
          ? html` <execute-pure-vas id="execute-vas" .orderType="${this.refOrderType}"></execute-pure-vas> `
          : html` <execute-ref-vas id="execute-vas" .orderType="${this.refOrderType}"></execute-ref-vas> `}
      </div>
    `
  }

  get context() {
    return { title: i18next.t('title.vas') }
  }

  get orderNoInput() {
    return this.shadowRoot.querySelector('barcode-scanable-input[name=orderNo]').shadowRoot.querySelector('input')
  }

  get orderTypeSelector() {
    return this.shadowRoot.querySelector('select[name=orderType]')
  }

  get childComp() {
    return this.shadowRoot.querySelector('#execute-vas')
  }

  async pageInitialized(changes) {
    if (this.active && changes.params) {
      const { orderNo, orderType } = changes.params
      if (orderNo && orderType) {
        this.refOrderType = orderType
        await this.updateComplete

        this.orderNoInput.value = orderNo
        this.orderTypeSelector.value = orderType

        this.fetchVas()
      }
    }
    await this.updateComplete
    this.orderNoInput.focus()
    this.refOrderType = this.orderTypeSelector.value
  }

  orderTypeChangeHandler(e) {
    this.refOrderType = e.currentTarget.value
    this.orderNoInput.select()
  }

  orderNoKeypressHandler(e) {
    if (e.keyCode === 13) {
      e.preventDefault()

      this.fetchVas()
    }
  }

  fetchVas() {
    const orderNo = this.orderNoInput.value
    if (!orderNo) return

    this.childComp.orderNo = orderNo
    this.childComp.fetchVas()
  }
}

window.customElements.define('execute-vas', ExecuteVas)
