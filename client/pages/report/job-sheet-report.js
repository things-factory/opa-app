import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, navigate, PageView } from '@things-factory/shell'
import { ScrollbarStyles } from '@things-factory/styles'
import { getPathInfo, gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import './job-sheet-popup'

class JobSheetReport extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _ganNo: String,
      _ata: String,
      _jobSheetNo: String,
      _containerNo: String,
      _looseItem: Boolean,
      _containerSize: String,
      _containerMtDate: String,
      _adviseMtDate: String,
      _sumPalletQty: Number
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
      title: i18next.t('title.job_sheet_report'),
      actions: [
        {
          title: i18next.t('button.edit'),
          action: this._editJobSheet.bind(this)
        },
        {
          title: i18next.t('button.print'),
          action: () => {
            this.renderRoot.querySelector('iframe').contentWindow.print()
          }
        },
        {
          title: i18next.t('button.back'),
          action: () => navigate(`job_sheets`)
        }
      ]
    }
  }

  render() {
    return html` <iframe id="container"></iframe> `
  }

  async pageUpdated(changes) {
    if (this.active) {
      if (changes.resourceId) {
        this._ganNo = changes.resourceId
      }

      if (this._ganNo) {
        await this._fetchJobSheet(this._ganNo)
      }
    }
  }

  async _fetchJobSheet(name) {
    const response = await client.query({
      query: gql`
        query {
          arrivalNotice(${gqlBuilder.buildArgs({
            name
          })}) {
            containerNo
            looseItem
            ata
            bizplace {
                id
                name
            }
            jobSheet {
              name
              containerSize
              containerMtDate
              adviseMtDate
              sumPalletQty
            }
          }
        }
      `
    })

    if (!response.errors) {
      const arrivalNoticeInfo = response.data.arrivalNotice

      var { domain } = getPathInfo(location.pathname) // find out better way later.
      this.shadowRoot.querySelector('#container').src = `/view_job_sheet/${domain}/${this._ganNo}`

      this._ata = arrivalNoticeInfo.ata
      this._containerNo = arrivalNoticeInfo.containerNo
      this._looseItem = arrivalNoticeInfo.looseItem
      this._containerSize = arrivalNoticeInfo.jobSheet.containerSize || null
      this._mtDate = arrivalNoticeInfo.jobSheet.containerMtDate
      this._adviseMtDate = arrivalNoticeInfo.jobSheet.adviseMtDate
      this._jobSheetNo = arrivalNoticeInfo.jobSheet.name
      this._sumPalletQty = arrivalNoticeInfo.jobSheet.sumPalletQty
    }
  }

  _editJobSheet() {
    openPopup(
      html`
        <job-sheet-popup
          .containerMtDate="${this._mtDate}"
          .ata="${this._ata}"
          .adviseMtDate="${this._adviseMtDate}"
          .containerSize="${this._containerSize}"
          .containerNo="${this._containerNo}"
          .sumPalletQty="${this._sumPalletQty}"
          .looseItem="${this._looseItem}"
          .jobSheetNo="${this._jobSheetNo}"
          @job-sheet-updated="${() => {
            this.pageReset()
          }}"
        ></job-sheet-popup>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.edit_job_sheet')
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

window.customElements.define('job-sheet-report', JobSheetReport)
