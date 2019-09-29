import { client, PageView, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { provider } from '@things-factory/board-ui'
import { HOME_BOARD_SETTING_KEY } from '../setting-constants'
import './things-scene-components.import'

class Dashboard extends connect(store)(PageView) {
  static get properties() {
    return {
      _board: Object,
      _boardId: String,
      _baseUrl: String,
      _license: Object
    }
  }

  static get styles() {
    return [
      css`
        :host {
          display: flex;
          flex-direction: column;

          width: 100%; /* 전체화면보기를 위해서 필요함. */
          height: 100%;

          overflow: hidden;
        }

        board-viewer {
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: this._board && this._board.name
    }
  }

  render() {
    return html`
      <board-viewer .board=${this._board} .provider=${provider}></board-viewer>
    `
  }

  updated(changes) {
    if (changes.has('_boardId')) {
      this.shadowRoot.querySelector('board-viewer').closeScene()
      this.refresh()
    }

    if (changes.has('_license')) {
      if (scene && scene.license) scene.license(this._license.key)
    }
  }

  pageUpdated(changes, lifecycle) {
    if (this.active) {
      this._boardId = lifecycle.resourceId
    } else {
      this._boardId = null
      this.shadowRoot.querySelector('board-viewer').closeScene()
    }
  }

  stateChanged(state) {
    this._baseUrl = state.app.baseUrl
    this._license = state.license
    this._boardId = (state.opaApp[HOME_BOARD_SETTING_KEY] || { board: {} }).board.id
  }

  async refresh() {
    if (!this._boardId) {
      return
    }
    var response = await client.query({
      query: gql`
        query FetchBoardById($id: String!) {
          board(id: $id) {
            id
            name
            model
          }
        }
      `,
      variables: { id: this._boardId }
    })

    var board = response.data.board

    this._board = {
      ...board,
      model: JSON.parse(board.model)
    }

    this.updateContext()
  }
}

customElements.define('opa-dashboard', Dashboard)
