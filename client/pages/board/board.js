import { BoardViewerPage } from '@things-factory/board-ui'

class BoardPage extends BoardViewerPage {
  get context() {
    return {
      title: this._board && this._board.name
    }
  }
}

customElements.define('opa-board', BoardPage)
