import '@things-factory/form-ui'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, ScrollbarStyles, sleep } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import Swal from 'sweetalert2'

export class GenerateLocationList extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      warehouseId: String,
      _searchFields: Array,
      formatAConfig: Object,
      formatBConfig: Object,
      formatCConfig: Object,
      formatDConfig: Object,
      previewConfig: Object,
      callback: Object,
      _locationFormat: String
    }
  }

  constructor() {
    super()
    this.locationList = []
    this.zoneName = ''
    this.rowSuffix = ''
    this.columnSuffix = ''
    this.caseSensitive = false
    this._locationFormat = ''
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
        .location-formatting {
          overflow-y: auto;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 220px;
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

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.generate_location_list')}</legend>
          <label>${i18next.t('label.location_format')}</label>
          <select name="locationFormat" @change="${e => (this._locationFormat = e.currentTarget.value)}">
            <option value=""></option>
            <option value="1">Z-0#-0#-0#</option>
            <option value="2">Z-0#-0#-A</option>
            <option value="3">Z-A#-A#-0#</option>
            <option value="4">Z-A#-A#-A</option>
          </select>
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
          <!-- <label>${i18next.t('label.row_suffix')}</label>
          <input
            placeholder="${i18next.t('text.enter_row_suffix_if_any')}"
            @input="${event => {
            this.rowSuffix = event.currentTarget.value
          }}"
            @keypress="${this._keyPressHandler.bind(this)}"
          />
          <label>${i18next.t('label.column_suffix')}</label>
          <input
            placeholder="${i18next.t('text.enter_column_suffix_if_any')}"
            @input="${event => {
            this.columnSuffix = event.currentTarget.value
          }}"
            @keypress="${this._keyPressHandler.bind(this)}"
          />
          <label>${i18next.t('label.case_sensitive')}</label>
          <input
            type="checkbox"
            @input="${event => {
            this.caseSensitive = event.currentTarget.checked
          }}"
            @keypress="${this._keyPressHandler.bind(this)}"
          /> -->
        </fieldset>
      </form>

      <div class="location-formatting" ?hidden="${this._locationFormat !== '1'}">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.generator')}</h2>

          <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.formatAConfig}
            .data=${this.data}
            @record-change="${this._onChangeHandler.bind(this)}"
          ></data-grist>
        </div>

        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.preview')}</h2>

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
      </div>

      <div class="location-formatting" ?hidden="${this._locationFormat !== '2'}">
        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.generator')}</h2>

          <data-grist
            .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
            .config=${this.formatBConfig}
            .data=${this.data}
            @record-change="${this._onChangeHandler.bind(this)}"
          ></data-grist>
        </div>

        <div class="grist">
          <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.preview')}</h2>

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
      </div>

      <div class="button-container">
        <mwc-button
          @click=${async () => {
            this.dataGrist.showSpinner()
            await sleep(1)
            this._validateGenerator()
            this.dataGrist.hideSpinner()
          }}
          >${i18next.t('button.preview')}</mwc-button
        >
        <mwc-button @click=${this._saveGeneratedLocation}>${i18next.t('button.save')}</mwc-button>
        <mwc-button @click=${this._deleteFromList}>${i18next.t('button.clear_list')}</mwc-button>
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
    this.formatAConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
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

    this.formatBConfig = {
      pagination: { infinite: true },
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'integer',
          name: 'start',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.level_start'),
          width: 250
        },
        {
          type: 'integer',
          name: 'end',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.level_end'),
          width: 250
        },
        {
          type: 'integer',
          name: 'column',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.number_of_row'),
          width: 250
        },
        {
          type: 'integer',
          name: 'cell',
          record: {
            align: 'center',
            editable: true
          },
          header: i18next.t('field.number_of_depth'),
          width: 250
        }
      ]
    }

    this.previewConfig = {
      pagination: { pages: [100, 200, 500] },
      rows: { selectable: { multiple: true }, appendable: false },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.name'),
          width: 250
        },
        {
          type: 'string',
          name: 'zone',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.zone'),
          width: 250
        },
        {
          type: 'string',
          name: 'row',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.row'),
          width: 250
        },
        {
          type: 'string',
          name: 'column',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.column'),
          width: 250
        },
        {
          type: 'string',
          name: 'shelf',
          record: {
            align: 'center',
            editable: false
          },
          header: i18next.t('field.shelf'),
          width: 250
        },
        {
          type: 'string',
          name: 'status',
          record: {
            align: 'center',
            editable: false
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
            message: i18next.t('text.missing_zone_name')
          }
        })
      )
      validationError = true
    }

    if (!validationError) this._generateLocationList()
  }

  // async _generateLocationList() {
  //   let locationData = this.data.records
  //   let validationError = false
  //   let tempLocationList = []

  //   if (locationData && locationData.length) {
  //     locationData = locationData.forEach(locations => {
  //       if (locations.start <= locations.end) {
  //         if (locations.column && locations.cell) {
  //           for (let i = locations.start; i <= locations.end; i++) {
  //             for (let j = 1; j <= locations.column; j++) {
  //               for (let k = 1; k <= locations.cell; k++) {
  //                 const locationObj = {}
  //                 const row = this.caseSensitive ? this.rowSuffix : this.rowSuffix.toUpperCase()
  //                 const column = this.caseSensitive ? this.columnSuffix : this.columnSuffix.toUpperCase()

  //                 locationObj['row'] =
  //                   this.rowSuffix === '' ? i.toString().padStart(2, '0') : i.toString().padStart(2, '0') + row

  //                 locationObj['column'] =
  //                   this.columnSuffix === '' ? j.toString().padStart(2, '0') : j.toString().padStart(2, '0') + column

  //                 locationObj['shelf'] = this._getCellInstance(k)
  //                 locationObj['zone'] = this.caseSensitive ? this.zoneName : this.zoneName.toString().toUpperCase()

  //                 locationObj['name'] =
  //                   locationObj.zone + '-' + locationObj.row + '-' + locationObj.column + '-' + locationObj.shelf

  //                 locationObj['status'] = 'EMPTY'
  //                 locationObj['type'] = 'SHELF'
  //                 locationObj['warehouse'] = { id: this.warehouseId }
  //                 locationObj['cuFlag'] = '+'

  //                 tempLocationList.push(locationObj)
  //               }
  //             }
  //           }
  //         } else {
  //           validationError = true
  //           tempLocationList = []

  //           document.dispatchEvent(
  //             new CustomEvent('notify', {
  //               detail: {
  //                 level: 'error',
  //                 message: i18next.t('text.missing_input')
  //               }
  //             })
  //           )
  //           return false
  //         }
  //       } else {
  //         validationError = true
  //         tempLocationList = []

  //         document.dispatchEvent(
  //           new CustomEvent('notify', {
  //             detail: {
  //               level: 'error',
  //               message: i18next.t('text.row_end_must_greater_than_row_start')
  //             }
  //           })
  //         )
  //         return false
  //       }
  //     })

  //     if (!validationError) {
  //       this.locationList = tempLocationList
  //       tempLocationList = []
  //       this.dataGrist.fetch()
  //     }
  //   }
  // }

  async _generateLocationList() {
    let locationData = this.data.records
    let validationError = false
    let tempLocationList = []

    if (locationData && locationData.length) {
      switch (this._locationFormat) {
        case '1':
          this.generateFormatA(locationData, tempLocationList)
          break
        case '2':
          this.generateFormatB(locationData, tempLocationList)
          break
        case '3':
          // this.generateFormatC(locationData, tempLocationList)
          break
        case '4':
          // this.generateFormatD(locationData, tempLocationList)
          break
        default:
        // this.generateNormalFormat(locationData, tempLocationList)
      }

      if (!validationError) {
        this.locationList = tempLocationList
        tempLocationList = []
        this.dataGrist.fetch()
      }
    }
  }

  generateFormatA(locations, temporaryLocations) {
    locations = locations.forEach(location => {
      if (location.start <= location.end) {
        if (location.column && location.cell) {
          for (let i = location.start; i <= location.end; i++) {
            for (let j = 1; j <= location.column; j++) {
              for (let k = 1; k <= location.cell; k++) {
                let locationObj = {}
                const row = this.caseSensitive ? this.rowSuffix : this.rowSuffix.toUpperCase()
                const column = this.caseSensitive ? this.columnSuffix : this.columnSuffix.toUpperCase()

                locationObj.row =
                  this.rowSuffix === '' ? i.toString().padStart(2, '0') : i.toString().padStart(2, '0') + row

                locationObj.column =
                  this.columnSuffix === '' ? j.toString().padStart(2, '0') : j.toString().padStart(2, '0') + column

                locationObj.shelf = this._getCellInstance(k)
                locationObj.zone = this.caseSensitive ? this.zoneName : this.zoneName.toString().toUpperCase()

                locationObj.name =
                  locationObj.zone + '-' + locationObj.row + '-' + locationObj.column + '-' + locationObj.shelf

                locationObj.status = 'EMPTY'
                locationObj.type = 'SHELF'
                locationObj.warehouse = { id: this.warehouseId }
                locationObj.cuFlag = '+'

                temporaryLocations.push(locationObj)
              }
            }
          }
        }
      }
    })
  }

  generateFormatB(locations, temporaryLocations) {
    locations = locations.forEach(location => {
      if (location.start <= location.end) {
        if (location.column && location.cell) {
          for (let i = location.start; i <= location.end; i++) {
            for (let j = 1; j <= location.column; j++) {
              for (let k = 1; k <= location.cell; k++) {
                let locationObj = {}
                const row = this.caseSensitive ? this.rowSuffix : this.rowSuffix.toUpperCase()
                const column = this.caseSensitive ? this.columnSuffix : this.columnSuffix.toUpperCase()

                locationObj.row = this.rowSuffix === '' ? 'L' + i.toString() : i.toString() + row

                locationObj.column = this.columnSuffix === '' ? 'R' + j.toString() : j.toString() + column

                locationObj.shelf = k.toString()
                locationObj.zone = this.caseSensitive ? this.zoneName : this.zoneName.toString().toUpperCase()

                locationObj.name =
                  locationObj.zone + '-' + locationObj.row + '-' + locationObj.column + '-' + locationObj.shelf

                locationObj.status = 'EMPTY'
                locationObj.type = 'SHELF'
                locationObj.warehouse = { id: this.warehouseId }
                locationObj.cuFlag = '+'

                temporaryLocations.push(locationObj)
              }
            }
          }
        }
      }
    })
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

  fetchHandler() {
    return {
      total: this.locationList.length || 0,
      records: this.locationList || []
    }
  }

  async _saveGeneratedLocation() {
    let chunkPatches = this._chunkLocationList(this.locationList, 500)

    if (chunkPatches === []) {
      Swal.fire({
        type: 'warning',
        title: 'List not previewed',
        text: 'Please hit preview button first!',
        showConfirmButton: false,
        timer: 1500
      })
    } else {
      try {
        this.dataGrist.showSpinner()
        for (let x = 0; x < chunkPatches.length; x++) {
          const patches = chunkPatches[x]
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
        }

        if (this.callback && typeof this.callback === 'function') this.callback()
        history.back()
      } catch (e) {
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              level: 'error',
              message: e.message
            }
          })
        )
      } finally {
        this.dataGrist.hideSpinner()
      }
    }
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
