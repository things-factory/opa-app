import { BoardViewerPage } from '@things-factory/board-ui'
import { HOME_BOARD_SETTING_KEY } from '../../setting-constants'

class Dashboard extends BoardViewerPage {
  get context() {
    return {
      title: this._board && this._board.name
    }
  }

  stateChanged(state) {
    super.stateChanged(state)

    this._boardId = (state.opaApp[HOME_BOARD_SETTING_KEY] || { board: {} }).board.id
  }
}

customElements.define('opa-dashboard', Dashboard)
