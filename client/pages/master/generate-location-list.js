import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

export class GenerateLocationList extends localize(i18next)(LitElement) {
  constructor() {
    super()
    this.locationList = []
    this.tempLocationList = []
    this.zoneName = ''
    this.rowSuffix = ''
    this.columnSuffix = ''
    this.caseSensitive = false
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
        h2 {
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
        }
        .grist h2 {
          margin: var(--grist-title-margin);
          border: var(--grist-title-border);
          color: var(--secondary-color);
        }
        .grist h2 mwc-icon {
          vertical-align: middle;
          margin: var(--grist-title-icon-margin);
          font-size: var(--grist-title-icon-size);
          color: var(--grist-title-icon-color);
        }
        h2 + data-grist {
          padding-top: var(--grist-title-with-grid-padding);
        }
        .button-container {
          display: flex;
          margin-left: auto;
        }
        .button-container > mwc-button {
          padding: 10px;
        }
      `
    ]
  }

  static get properties() {
    return {
      warehouseId: String,
      _searchFields: Array,
      config: Object,
      previewConfig: Object
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.generate_location_list')}</legend>
          <label>${i18next.t('label.zone_name')}</label>
          <input
            placeholder="${i18next.t('text.enter_zone_name')}"
            @input="${event => {
              const input = event.currentTarget
              this.zoneName = input.value
            }}"
            @keypress="${event => {
              if (event.keyCode === 13) {
                event.preventDefault()
                return false
              }
            }}"
          />
          <label>${i18next.t('label.row_suffix')}</label>
          <input
            placeholder="${i18next.t('text.enter_row_suffix_if_any')}"
            @input="${event => {
              const input = event.currentTarget
              this.rowSuffix = input.value
            }}"
            @keypress="${event => {
              if (event.keyCode === 13) {
                event.preventDefault()
                return false
              }
            }}"
          />
          <label>${i18next.t('label.column_suffix')}</label>
          <input
            placeholder="${i18next.t('text.enter_column_suffix_if_any')}"
            @input="${event => {
              const input = event.currentTarget
              this.columnSuffix = input.value
            }}"
            @keypress="${event => {
              if (event.keyCode === 13) {
                event.preventDefault()
                return false
              }
            }}"
          />
          <label>${i18next.t('label.case_sensitive')}</label>
          <input
            type="checkbox"
            @input="${event => {
              const field = event.currentTarget
              this.caseSensitive = field.checked
            }}"
            @keypress="${event => {
              if (event.keyCode === 13) {
                event.preventDefault()
                return false
              }
            }}"
          />
        </fieldset>
      </form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .data=${this.data}
          @record-change="${this._onChangeHandler.bind(this)}"
        ></data-grist>

        <data-grist
          id="preview_grist"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.previewConfig}
          .fetchHandler="${this.fetchHandler.bind(this)}"
          @limit-changed=${e => {
            this.limit = e.detail
          }}
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click=${this._validateGenerator}>${i18next.t('button.preview')}</mwc-button>
        <mwc-button @click=${this._saveGeneratedLocation}>${i18next.t('button.save')}</mwc-button>
        <mwc-button @click=${this._deleteFromList}>${i18next.t('button.delete')}</mwc-button>
      </div>
    `
  }

  get context() {
    return {
      title: i18next.t('title.generate_location'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: this._generateLocationList.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.generate_location'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: () => {}
      }
    }
  }

  async firstUpdated() {
    this.data = { records: [] }
    this.config = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'number',
          name: 'start',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.row_start'),
          width: 250
        },
        {
          type: 'number',
          name: 'end',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.row_end'),
          width: 250
        },
        {
          type: 'string',
          name: 'column',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.number_of_column'),
          width: 250
        },
        {
          type: 'string',
          name: 'cell',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.number_of_cell'),
          width: 250
        }
      ]
    }

    this.previewConfig = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.name'),
          width: 250
        },
        {
          type: 'string',
          name: 'zone',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.zone'),
          width: 250
        },
        {
          type: 'string',
          name: 'row',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.row'),
          width: 250
        },
        {
          type: 'string',
          name: 'column',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.column'),
          width: 250
        },
        {
          type: 'string',
          name: 'shelf',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.shelf'),
          width: 250
        },
        {
          type: 'string',
          name: 'status',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.status'),
          width: 250
        }
      ]
    }
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('#preview_grist')
  }

  async _onChangeHandler(e) {
    const before = e.detail.before || {}
    const after = e.detail.after

    let record = this.data.records[e.detail.row]
    if (!record) {
      record = { ...after }
      this.data.records.push(record)
    } else if (record !== after) {
      record = Object.assign(record, after)
    }
  }

  _validateGenerator() {
    let dataFromGrist = this.data.records
    let validationError = false
    for (let x = 1; x < dataFromGrist.length; x++) {
      if (dataFromGrist[x].start <= dataFromGrist[x - 1].end) {
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              level: 'error',
              message: i18next.t('text.already_existed', {
                state: {
                  text: dataFromGrist[x].start
                }
              })
            }
          })
        )
        validationError = true
      }
    }

    if (this.zoneName === '') {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: i18next.t('text.zone_name_cannot_be_empty')
          }
        })
      )
      validationError = true
    }

    if (!validationError) this._generateLocationList()
  }

  _generateLocationList() {
    let locationData = this.data.records
    let validationError = false

    if (locationData && locationData.length) {
      locationData = locationData.forEach(locations => {
        if (locations.start <= locations.end) {
          for (let i = locations.start; i <= locations.end; i++) {
            for (let j = 1; j <= locations.column; j++) {
              for (let k = 1; k <= locations.cell; k++) {
                const locationObj = {}
                const row = this.caseSensitive ? this.rowSuffix : this.rowSuffix.toUpperCase()
                const column = this.caseSensitive ? this.columnSuffix : this.columnSuffix.toUpperCase()

                locationObj['row'] =
                  this.rowSuffix === '' ? (locationObj['row'] = i.toString().padStart(2, '0')) : i.toString() + row

                locationObj['column'] =
                  this.columnSuffix === ''
                    ? (locationObj['column'] = j.toString().padStart(2, '0'))
                    : j.toString() + column

                locationObj['shelf'] = this._getCellInstance(k)
                locationObj['zone'] = this.caseSensitive ? this.zoneName : this.zoneName.toString().toUpperCase()

                locationObj['name'] =
                  locationObj.zone + '-' + locationObj.row + '-' + locationObj.column + '-' + locationObj.shelf

                locationObj['status'] = 'empty'
                locationObj['warehouse'] = { id: this.warehouseId }
                locationObj['cuFlag'] = '+'

                this.tempLocationList.push(locationObj)
              }
            }
          }
        } else {
          validationError = true
          document.dispatchEvent(
            new CustomEvent('notify', {
              detail: {
                level: 'error',
                message: i18next.t('text.row_end_must_greater_than_row_start')
              }
            })
          )
        }
      })

      if (!validationError) {
        this.locationList = this.tempLocationList
        this.tempLocationList = []
        this.dataGrist.fetch()
      }
    }
  }

  _getCellInstance(column) {
    var cellInstance = ''
    switch (column) {
      case 1:
        cellInstance = 'A'
        break
      case 2:
        cellInstance = 'B'
        break
      case 3:
        cellInstance = 'C'
        break
      case 4:
        cellInstance = 'D'
        break
      case 5:
        cellInstance = 'E'
        break
      case 6:
        cellInstance = 'F'
        break
      case 7:
        cellInstance = 'G'
        break
      case 8:
        cellInstance = 'H'
        break
      case 9:
        cellInstance = 'I'
        break
      case 10:
        cellInstance = 'J'
        break
      case 11:
        cellInstance = 'K'
        break
      case 12:
        cellInstance = 'L'
        break
      case 13:
        cellInstance = 'M'
        break
      case 14:
        cellInstance = 'N'
        break
      case 15:
        cellInstance = 'O'
        break
      case 16:
        cellInstance = 'P'
        break
      case 17:
        cellInstance = 'Q'
        break
      case 18:
        cellInstance = 'R'
        break
      case 19:
        cellInstance = 'S'
        break
      case 20:
        cellInstance = 'T'
        break
      case 21:
        cellInstance = 'U'
        break
      case 22:
        cellInstance = 'V'
        break
      case 23:
        cellInstance = 'W'
        break
      case 24:
        cellInstance = 'X'
        break
      case 25:
        cellInstance = 'Y'
        break
      case 26:
        cellInstance = 'Z'
        break
      case 14:
        cellInstance = 'N'
        break
      default:
        cellInstance = column.toString()
    }
    return cellInstance
  }

  async _saveGeneratedLocation() {
    let patches = this.locationList
    try {
      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleLocation(${gqlBuilder.buildArgs({
              patches
            })}) {
              name
            }
          }
        `
      })

      if (!response.errors) location.replace(`locations/${this.warehouseId}`)
    } catch (e) {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: e.message
          }
        })
      )
    }
  }

  fetchHandler() {
    return {
      total: this.locationList.length || 0,
      records: this.locationList || []
    }
  }

  _deleteFromList() {
    const selections = []
    this.dataGrist.selected.forEach(selection => {
      selections.push(selection.__seq__ - 1)
    })

    for (let i = selections.length - 1; i >= 0; i--) {
      this.locationList.splice(selections[i], 1)
    }
    this.dataGrist.fetch()
  }
}

window.customElements.define('generate-location-list', GenerateLocationList)
