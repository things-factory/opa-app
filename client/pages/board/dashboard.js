import { BoardViewerPage } from '@things-factory/board-ui'
import { HOME_DASHBOARD_SETTING_KEY } from '../constants'

class Dashboard extends BoardViewerPage {
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
