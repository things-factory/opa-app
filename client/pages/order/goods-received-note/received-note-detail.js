import { i18next, localize } from '@things-factory/i18n-base'
import { navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { getPathInfo } from '@things-factory/utils'
import { css, html } from 'lit-element'

class ReceivedNoteDetail extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _grnNo: String
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        #container {
          flex: 1;
          padding: 0;
          margin: 0;
          border: 0;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.goods_received_note_details'),
      actions: this._actions
    }
  }

  render() {
    return html` <iframe id="container"></iframe> `
  }

  async pageUpdated(changes) {
    if (this.active) {
      if (changes.resourceId) {
        this._grnNo = changes.resourceId
      }

      if (this._grnNo) {
        await this._fetchGRNTemplate()
      }

      this._updateContext()
    }
  }

  _fetchGRNTemplate() {
    var { domain } = getPathInfo(location.pathname) // find out better way later.

    if (domain === 'elccl') {
      this.shadowRoot.querySelector('#container').src = `/view_elccl_grn/${domain}/${this._grnNo}`
    } else {
      this.shadowRoot.querySelector('#container').src = `/view_kimeda_grn/${domain}/${this._grnNo}`
    }
  }

  _updateContext() {
    this._actions = [
      {
        title: i18next.t('button.print'),
        action: () => {
          this.renderRoot.querySelector('iframe').contentWindow.print()
        }
      },
      { title: i18next.t('button.back'), action: () => navigate(`received_note_list`) }
    ]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
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

window.customElements.define('received-note-detail', ReceivedNoteDetail)
