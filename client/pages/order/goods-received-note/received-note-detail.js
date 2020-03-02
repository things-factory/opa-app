import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { getPathInfo } from '@things-factory/utils'
import { css, html } from 'lit-element'
import './upload-document-popup'

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
    return html`
      <iframe id="container"></iframe>
    `
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
    this.shadowRoot.querySelector('#container').src = `/view_document_grn/${domain}/${this._grnNo}`
  }

  _updateContext() {
    this._actions = [
      {
        title: i18next.t('button.print'),
        action: () => {
          this.renderRoot.querySelector('iframe').contentWindow.print()
        }
      },
      {
        title: i18next.t('button.upload'),
        action: this._editGRN.bind(this)
      },
      { title: i18next.t('button.back'), action: () => navigate(`received_note_list`) }
    ]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  _editGRN() {
    openPopup(
      html`
        <upload-document-popup
          .grnNo="${this._grnNo}"
          @document-uploaded="${() => {
            this._showToast({ message: i18next.t('text.document_has_been_uploaded') })
          }}"
        ></upload-document-popup>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.upload_grn')
      }
    )
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
