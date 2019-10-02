import { LitElement, html, css } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'

import '@material/mwc-icon'

import { store } from '@things-factory/shell'

export class DashboardTool extends connect(store)(LitElement) {
  static get properties() {
    return {
      page: String,
      whiteList: Array
    }
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
        vertical-align: middle;
        line-height: 0;
      }
    `
  }

  render() {
    var renderable = (this.whiteList || []).indexOf(this.page) !== -1

    return renderable
      ? html`
          <mwc-icon @click=${e => navigate('dashboard')} .whiteList=${['menu-list']}>insert_chart</mwc-icon>
        `
      : html``
  }

  stateChanged(state) {
    this.page = state.route.page
  }
}

customElements.define('dashboard-tool', DashboardTool)
