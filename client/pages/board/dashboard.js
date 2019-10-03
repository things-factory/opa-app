import { html, css } from 'lit-element'
import { BoardViewerPage } from '@things-factory/board-ui'
import { HOME_DASHBOARD_SETTING_KEY } from '../../setting-constants'

class Dashboard extends BoardViewerPage {
  static get styles() {
    return [
      css`
        oops-note {
          display: block;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
      `
    ].concat(BoardViewerPage.styles)
  }

  get context() {
    return {
      title: super.context.title
    }
  }

  get oopsNote() {
    return {
      icon: 'insert_chart',
      title: 'HOME DASHBOARD',
      description: 'There are no home dashboard setting. Pls, ask system administrator to register home dashboard.'
    }
  }

  stateChanged(state) {
    super.stateChanged(state)

    this._boardId = (state.dashboard[HOME_DASHBOARD_SETTING_KEY] || { board: {} }).board.id
  }
}

customElements.define('home-dashboard', Dashboard)
