import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, ScrollbarStyles, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

export class GenerateList extends localize(i18next)(LitElement) {
  constructor() {
    super()
    this.locationList = []
    this.tempLocationList = []
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
      config: Object
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.generate_location_list')}</legend>
          <label>${i18next.t('label.zone_name')}</label>
          <input
            id="zone_name"
            name="zone_name"
            @input="${event => {
              const input = event.currentTarget
              this.zoneName = input.value
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
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click=${this._generateLocationList}>${i18next.t('button.generate')}</mwc-button>
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
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'dirty'
        },
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: true
        },
        {
          type: 'string',
          name: 'start',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.row_start'),
          width: 250
        },
        {
          type: 'string',
          name: 'end',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.row_end'),
          width: 250
        },
        {
          type: 'string',
          name: 'column',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.number_of_column'),
          width: 250
        },
        {
          type: 'string',
          name: 'cell',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.number_of_cell'),
          width: 250
        }
      ]
    }

    this.previewConfig = {
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'dirty'
        },
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: true
        },
        {
          type: 'string',
          name: 'name',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.name'),
          width: 250
        },
        {
          type: 'string',
          name: 'zone',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.zone'),
          width: 250
        },
        {
          type: 'string',
          name: 'row',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.row'),
          width: 250
        },
        {
          type: 'string',
          name: 'column',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.column'),
          width: 250
        },
        {
          type: 'string',
          name: 'shelf',
          record: {
            align: 'left',
            editable: true
          },
          header: i18next.t('field.shelf'),
          width: 250
        },
        {
          type: 'string',
          name: 'status',
          record: {
            align: 'left',
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

  _generateLocationList() {
    let locationData = this.data.records

    if (locationData && locationData.length) {
      locationData = locationData.map(locations => {
        locations['zone'] = this.zoneName.toUpperCase()

        for (let i = locations.start; i <= locations.end; i++) {
          for (let j = 1; j <= locations.column; j++) {
            for (let k = 1; k <= locations.cell; k++) {
              switch (k) {
                case 1:
                  locations['cellInstance'] = 'A'
                  break
                case 2:
                  locations['cellInstance'] = 'B'
                  break
                case 3:
                  locations['cellInstance'] = 'C'
                  break
                case 4:
                  locations['cellInstance'] = 'D'
                  break
                case 5:
                  locations['cellInstance'] = 'E'
                  break
                case 6:
                  locations['cellInstance'] = 'F'
                  break
                case 7:
                  locations['cellInstance'] = 'G'
                  break
                case 8:
                  locations['cellInstance'] = 'H'
                  break
                case 9:
                  locations['cellInstance'] = 'I'
                  break
                case 10:
                  locations['cellInstance'] = 'J'
                  break
                case 11:
                  locations['cellInstance'] = 'K'
                  break
                case 12:
                  locations['cellInstance'] = 'L'
                  break
                case 13:
                  locations['cellInstance'] = 'M'
                  break
                case 14:
                  locations['cellInstance'] = 'N'
                  break
                default:
                  locations['cellInstance'] = 'NULL'
              }

              locations['name'] =
                this.zoneName.toUpperCase() +
                '' +
                i.toString().padStart(2, '0') +
                '-' +
                j.toString().padStart(2, '0') +
                '-' +
                locations.cellInstance

              const locationObj = {}
              locationObj['name'] = locations.name.toString()
              locationObj['zone'] = locations.zone.toString()
              locationObj['row'] = i.toString().padStart(2, '0')
              locationObj['column'] = j.toString().padStart(2, '0')
              locationObj['shelf'] = locations.cellInstance.toString()
              locationObj['status'] = 'Empty'
              locationObj['warehouse'] = { id: this.warehouseId }
              locationObj['cuFlag'] = '+'

              this.tempLocationList.push(locationObj)
            }
          }
        }
        return locations
      })
      this.locationList = this.tempLocationList
      this.tempLocationList = []
      console.log(this.locationList)
      this.dataGrist.fetch()
    }
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

      if (!response.errors) history.back()
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
    let state = window.history.state
    console.log(this.warehouseId)
    // const selections = []
    // this.dataGrist.selected.forEach(selection => {
    //   selections.push(selection.__seq__ - 1)
    // })

    // for (let i = selections.length - 1; i >= 0; i--) {
    //   this.locationList.splice(selections[i], 1)
    // }
    // this.dataGrist.fetch()
  }
}

window.customElements.define('generate-list', GenerateList)
