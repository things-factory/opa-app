import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { isMobileDevice } from '@things-factory/utils'
import { ScrollbarStyles } from '@things-factory/styles'
import { css, html, LitElement } from 'lit-element'

export class GenerateLocationList extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      _locationList: Array,
      _formatsFromCode: Array,
      _generatorConfig: Object,
      _previewConfig: Object,
      callback: Object,
      _selectedFormat: String
    }
  }

  constructor() {
    super()
    this._locationList = []
    this._zoneName = ''
    this._rowExtension = ''
    this._columnExtension = ''
    this._shelfExtension = ''
    this._caseSensitive = false
    this._useAlphabet = false
    this._rowLeadingZeroes = false
    this._columnLeadingZeroes = false
    this._shelfLeadingZeroes = false
    this._generatorConfig = {}
    this._formatsFromCode = []
    this._selectedFormat = ''
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      ScrollbarStyles,
      css`
        :host {
          padding: 0 15px;
          display: flex;
          flex-direction: column;
          overflow-x: overlay;
          background-color: var(--main-section-background-color);
        }
        h2 {
          margin: var(--subtitle-margin);
          padding: var(--subtitle-padding);
          font: var(--subtitle-font);
          color: var(--subtitle-text-color);
          border-bottom: var(--subtitle-border-bottom);
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
        .button-container {
          padding: var(--button-container-padding);
          margin: var(--button-container-margin);
          text-align: var(--button-container-align);
          background-color: var(--button-container-background);
          height: var(--button-container-height);
        }
        .button-container button {
          background-color: var(--button-container-button-background-color);
          border-radius: var(--button-container-button-border-radius);
          height: var(--button-container-button-height);
          border: var(--button-container-button-border);
          margin: var(--button-container-button-margin);

          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container button:hover,
        .button-container button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  render() {
    return html`
      <div>
        <h2>${i18next.t('title.format_settings')}</h2>
        <form class="multi-column-form">
          <fieldset>
            <label>${i18next.t('label.location_format')}</label>
            <select name="locationFormat" @change="${e => this._validateForm(e.currentTarget.value)}">
              <option value="">-- ${i18next.t('text.select_location_format')} --</option>
              ${(this._formatsFromCode || []).map(
                format =>
                  html`
                    <option value="${format && format.name}"
                      >${format && format.name}
                      ${format && format.description ? ` ${format && format.description}` : ''}</option
                    >
                  `
              )}
            </select>

            <label>${i18next.t('label.zone_name')}</label>
            <input
              placeholder="${i18next.t('text.enter_zone_name')}"
              @input="${event => {
                const input = event.currentTarget
                this._zoneName = input.value
              }}"
              @keypress="${event => {
                if (event.keyCode === 13) {
                  event.preventDefault()
                  return false
                }
              }}"
            />

            <input
              type="checkbox"
              @input="${event => {
                this._caseSensitive = event.currentTarget.checked
              }}"
              @keypress="${this._keyPressHandler.bind(this)}"
            />
            <label>${i18next.t('label.case_sensitive')}</label>
          </fieldset>
        </form>
      </div>

      <div>
        <h2>${i18next.t('title.extension_settings')}</h2>
        <form class="multi-column-form" ?hidden="${this._selectedFormat === ''}">
          <fieldset>
            <label>${this._rowInstance}:</label>
            <input
              placeholder="${i18next.t('label.enter_extension')}"
              @input="${event => {
                this._rowExtension = event.currentTarget.value
              }}"
              @keypress="${this._keyPressHandler.bind(this)}"
            />

            <label>${this._columnInstance}:</label>
            <input
              placeholder="${i18next.t('label.enter_extension')}"
              @input="${event => {
                this._columnExtension = event.currentTarget.value
              }}"
              @keypress="${this._keyPressHandler.bind(this)}"
            />

            <label>${this._shelfInstance}:</label>
            <input
              placeholder="${i18next.t('label.enter_extension')}"
              @input="${event => {
                this._shelfExtension = event.currentTarget.value
              }}"
              @keypress="${this._keyPressHandler.bind(this)}"
            />

            <input
              type="checkbox"
              @input="${event => {
                this._rowLeadingZeroes = event.currentTarget.checked
              }}"
              @keypress="${this._keyPressHandler.bind(this)}"
            />
            <label>${i18next.t('label.add_leading_zero')}</label>

            <input
              type="checkbox"
              @input="${event => {
                this._columnLeadingZeroes = event.currentTarget.checked
              }}"
              @keypress="${this._keyPressHandler.bind(this)}"
            />
            <label>${i18next.t('label.add_leading_zero')}</label>

            <input
              type="checkbox"
              @input="${event => {
                this._shelfLeadingZeroes = event.currentTarget.checked
              }}"
              @keypress="${this._keyPressHandler.bind(this)}"
              ?disabled="${this._useAlphabet === true}"
            />
            <label>${i18next.t('label.add_leading_zero')}</label>
          </fieldset>
        </form>
      </div>

      <div class="grist">
        <h2>${i18next.t('title.generator')}</h2>
        <data-grist
          mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this._generatorConfig}
          .data=${this.data}
          @record-change="${this._onChangeHandler.bind(this)}"
        ></data-grist>
      </div>

      <div class="button-container">
        <button @click="${this._generatedLocation.bind(this)}">
          ${i18next.t('button.preview')}
        </button>
      </div>
    `
  }

  async firstUpdated() {
    this._formatsFromCode = await getCodeByName('LOCATION_FORMAT')
    this.data = { records: [] }
    this._generatorConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        {
          type: 'integer',
          name: 'start',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.row_start'),
          width: 250
        },
        {
          type: 'integer',
          name: 'end',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.row_end'),
          width: 250
        },
        {
          type: 'integer',
          name: 'column',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.number_of_column'),
          width: 250
        },
        {
          type: 'integer',
          name: 'shelf',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.number_of_shelf'),
          width: 250
        }
      ]
    }
  }

  _onChangeHandler(e) {
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

  _keyPressHandler(event) {
    if (event.keyCode === 13) {
      event.preventDefault()
      return false
    }
  }

  _validateForm(selectedFormat) {
    this._selectedFormat = selectedFormat

    const instances = selectedFormat.split('-')
    this._zoneInstance = instances[0]
    this._rowInstance = instances[1]
    this._columnInstance = instances[2]
    this._shelfInstance = instances[3]

    this._formatsFromCode.map(formatFromCode => {
      if (formatFromCode.name === selectedFormat) {
        this._locationFormat = formatFromCode.description
      }
    })

    const namePortions = this._locationFormat.split('-')
    const rowPortion = namePortions[1].match(/[a-zA-Z]+/g)
    const columnPortion = namePortions[2].match(/[a-zA-Z]+/g)
    const shelfPortion = namePortions[3].match(/[a-zA-Z]+/g)

    const useAlphabet = this._locationFormat.match(/@/g)
    this._useAlphabet = useAlphabet == '@' ? true : false

    this._rowLabel = rowPortion ? rowPortion[0] : ''
    this._columnLabel = columnPortion ? columnPortion[0] : ''
    this._shelfLabel = shelfPortion ? shelfPortion[0] : ''

    this._generatorConfig = {
      ...this._generatorConfig,
      columns: this._generatorConfig.columns.map(column => {
        switch (column.name) {
          case 'start':
            column.header = (this._rowInstance || '') + ' start'
            break
          case 'end':
            column.header = (this._rowInstance || '') + ' end'
            break
          case 'column':
            column.header = 'number of ' + (this._columnInstance || '')
            break
          case 'shelf':
            column.header = 'number of ' + (this._shelfInstance || '')
            break
        }
        return column
      })
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

    if (this._zoneName === '') {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: i18next.t('text.missing_zone_name')
          }
        })
      )
      validationError = true
    }

    if (!validationError) this._generateLocationList()
  }

  async _generateLocationList() {
    let locations = this.data.records
    let validationError = false
    let tempLocationList = []

    if (locations && locations.length) {
      locations = locations.forEach(location => {
        if (location.start <= location.end) {
          if (location.column && location.shelf) {
            for (let i = location.start; i <= location.end; i++) {
              for (let j = 1; j <= location.column; j++) {
                for (let k = 1; k <= location.shelf; k++) {
                  let locationObj = {}
                  const rowExtension = this._caseSensitive ? this._rowExtension : this._rowExtension.toUpperCase()
                  const columnExtension = this._caseSensitive
                    ? this._columnExtension
                    : this._columnExtension.toUpperCase()

                  const shelfExtension = this._caseSensitive ? this._shelfExtension : this._shelfExtension.toUpperCase()

                  const row = this._rowLeadingZeroes ? i.toString().padStart(2, '0') : i.toString()
                  const column = this._columnLeadingZeroes ? j.toString().padStart(2, '0') : j.toString()
                  const shelf = this._shelfLeadingZeroes ? k.toString().padStart(2, '0') : k.toString()

                  locationObj.row =
                    this._rowExtension === '' ? this._rowLabel + row : this._rowLabel + row + rowExtension
                  locationObj.column =
                    this._columnExtension === ''
                      ? this._columnLabel + column
                      : this._columnLabel + column + columnExtension

                  if (this._useAlphabet) locationObj.shelf = this._getCellInstance(k)
                  else
                    locationObj.shelf =
                      this._shelfExtension === '' ? this._shelfLabel + shelf : this._shelfLabel + shelf + shelfExtension

                  locationObj.zone = this._caseSensitive ? this._zoneName : this._zoneName.toString().toUpperCase()

                  locationObj.name =
                    locationObj.zone + '-' + locationObj.row + '-' + locationObj.column + '-' + locationObj.shelf

                  locationObj.status = 'EMPTY'
                  locationObj.type = 'SHELF'
                  locationObj.__dirty__ = '+'

                  const dirtyfields = {
                    name: { before: null, after: locationObj.name },
                    row: { before: null, after: locationObj.row },
                    column: { before: null, after: locationObj.column },
                    shelf: { before: null, after: locationObj.shelf },
                    zone: { before: null, after: locationObj.zone },
                    status: { before: null, after: locationObj.status },
                    type: { before: null, after: locationObj.type }
                  }

                  locationObj.__dirtyfields__ = dirtyfields

                  tempLocationList.push(locationObj)
                }
              }
            }
          }
        }
      })

      if (!validationError) {
        this._locationList = tempLocationList
        tempLocationList = []
      }
    }
  }

  _getCellInstance(column) {
    var shelfInstance = ''
    switch (column) {
      case 1:
        shelfInstance = 'A'
        break
      case 2:
        shelfInstance = 'B'
        break
      case 3:
        shelfInstance = 'C'
        break
      case 4:
        shelfInstance = 'D'
        break
      case 5:
        shelfInstance = 'E'
        break
      case 6:
        shelfInstance = 'F'
        break
      case 7:
        shelfInstance = 'G'
        break
      case 8:
        shelfInstance = 'H'
        break
      case 9:
        shelfInstance = 'I'
        break
      case 10:
        shelfInstance = 'J'
        break
      case 11:
        shelfInstance = 'K'
        break
      case 12:
        shelfInstance = 'L'
        break
      case 13:
        shelfInstance = 'M'
        break
      case 14:
        shelfInstance = 'N'
        break
      case 15:
        shelfInstance = 'O'
        break
      case 16:
        shelfInstance = 'P'
        break
      case 17:
        shelfInstance = 'Q'
        break
      case 18:
        shelfInstance = 'R'
        break
      case 19:
        shelfInstance = 'S'
        break
      case 20:
        shelfInstance = 'T'
        break
      case 21:
        shelfInstance = 'U'
        break
      case 22:
        shelfInstance = 'V'
        break
      case 23:
        shelfInstance = 'W'
        break
      case 24:
        shelfInstance = 'X'
        break
      case 25:
        shelfInstance = 'Y'
        break
      case 26:
        shelfInstance = 'Z'
        break
      default:
        shelfInstance = column.toString()
    }
    return shelfInstance
  }

  _generatedLocation() {
    this._validateGenerator()
    if (this._locationList.length > 0) {
      this.dispatchEvent(new CustomEvent('generated', { detail: this._locationList }))
      history.back()
    } else return
  }

  _chunkLocationList(locationArray, chunk_size) {
    let tempArray = []
    let locationChunk = []

    for (let i = 0; i < locationArray.length; i += chunk_size) {
      locationChunk = locationArray.slice(i, i + chunk_size)
      tempArray.push(locationChunk)
    }
    return tempArray
  }
}

window.customElements.define('generate-location-list', GenerateLocationList)
