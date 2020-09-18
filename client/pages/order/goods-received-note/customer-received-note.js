import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, navigate, PageView, store, UPDATE_CONTEXT } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { getPathInfo, gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { ORDER_STATUS } from '../../constants'

class CustomerReceivedNote extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _grnNo: String,
      _status: String
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
        await this._fetchGRN()
      }

      this._updateContext()
    }
  }

  _fetchGRNTemplate() {
    var { domain } = getPathInfo(location.pathname) // find out better way later.
    if (domain === 'elccl') {
      this.shadowRoot.querySelector('#container').src = `/view_elccl_grn/${domain}/${this._grnNo}`
    } else if (domain === 'kimeda') {
      this.shadowRoot.querySelector('#container').src = `/view_kimeda_grn/${domain}/${this._grnNo}`
    }
  }

  async _fetchGRN() {
    if (!this._grnNo) return
    const response = await client.query({
      query: gql`
        query {
          goodsReceivalNote(${gqlBuilder.buildArgs({
            name: this._grnNo
          })}) {
            id
            name
            status
          }
        }
      `
    })

    if (!response.errors) {
      const _grn = response.data.goodsReceivalNote
      this._status = _grn.status
    }
  }

  _updateContext() {
    this._actions = []

    if (this._status !== ORDER_STATUS.RECEIVED.value) {
      this._actions = [...this._actions, { title: i18next.t('button.accept'), action: this._receivedGrn.bind(this) }]
    }

    this._actions = [
      ...this._actions,
      {
        title: i18next.t('button.print'),
        action: () => {
          this.renderRoot.querySelector('iframe').contentWindow.print()
        }
      },
      { title: i18next.t('button.back'), action: () => history.back() }
    ]

    store.dispatch({
      type: UPDATE_CONTEXT,
      context: this.context
    })
  }

  async _receivedGrn() {
    try {
      const result = await CustomAlert({
        title: i18next.t('title.are_you_sure'),
        text: i18next.t('text.accept_goods_received_note'),
        confirmButton: { text: i18next.t('button.confirm') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!result.value) {
        return
      }

      const response = await client.query({
        query: gql`
        mutation {
          receivedGoodsReceivalNote(${gqlBuilder.buildArgs({
            name: this._grnNo
          })}) {
            name
          }
        }
      `
      })

      if (!response.errors) {
        navigate('received_note_list')
        this._showToast({ message: i18next.t('text.goods_received_note_has_been_received') })
      }
    } catch (e) {
      this._showToast(e)
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

window.customElements.define('customer-received-note', CustomerReceivedNote)
