import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

class TransportVehicle extends localize(i18next)(PageView) {
  static get properties() {
    return {
      vehiclesConfig: Object,
      vehiclesData: Object
    }
  }

  static get styles() {
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow-x: auto;
        }
        .grist {
          background-color: var(--main-section-background-color);
          display: flex;
          flex-direction: column;
          flex: 1;
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
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.create_truck_detail'),
      actions: [
        {
          title: i18next.t('button.submit'),
          action: this.createTransportVehicle.bind(this)
        }
      ]
    }
  }

  render() {
    return html`
      <form class="multi-column-form">
        <fieldset>
          <legend>${i18next.t('title.transport_vehicle')}</legend>
        </fieldset>
      </form>
      <div class="grist">
        <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.transport_vehicle_detail')}</h2>

        <data-grist
          id="vehicles"
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.vehiclesConfig}
          .data=${this.vehiclesData}
          @record-change="${this._onVehicleChangeHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  firstUpdated() {
    this.vehiclesData = { records: [] }

    this.vehiclesConfig = {
      pagination: {
        infinite: true
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'delete_outline',
          handlers: {
            click: (columns, data, column, record, rowIndex) => {
              this.vehiclesData.records.splice(rowIndex, 1)

              this.vehiclesData = {
                ...this.vehiclesData,
                records: [...this.vehiclesData.records]
              }
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            editable: true,
            align: 'center'
          },
          width: 250
        },
        {
          type: 'string',
          name: 'regNumber',
          header: i18next.t('field.registration_no'),
          record: {
            align: 'left',
            editable: true
          },
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left',
            editable: true
          },
          width: 250
        },
        {
          type: 'string',
          name: 'brand',
          header: i18next.t('field.brand'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'model',
          header: i18next.t('field.model'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'color',
          header: i18next.t('field.color'),
          record: {
            align: 'center',
            editable: true
          },
          width: 120
        },
        {
          type: 'string',
          name: 'size',
          header: i18next.t('field.size'),
          record: {
            align: 'right',
            editable: true
          },
          width: 80
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            align: 'right',
            editable: true
          },
          width: 250
        }
      ]
    }
  }

  async _onVehicleChangeHandler(e) {
    const before = e.detail.before || {}
    const after = e.detail.after
    let record = this.vehiclesData.records[e.detail.row]
    if (!record) {
      record = { ...after }
      this.vehiclesData.records.push(record)
    } else if (record !== after) {
      record = Object.assign(record, after)
    }
  }

  async createTransportVehicle() {
    try {
      const vehicles = this._getVehicles()

      await client.query({
        query: gql`
          mutation {
            createTransportVehicle(${gqlBuilder.buildArgs({
              transportVehicle: vehicles[0]
            })}) {
              name
              regNumber
              brand
              model
              color
              size
              status
              description
            }
          }
        `
      })

      navigate('transport-vehicle')
    } catch (e) {
      this._notify(e.message)
    }
  }

  _getVehicles() {
    const vehicles = this.shadowRoot.querySelector('#vehicles').dirtyRecords
    if (vehicles.length === 0) {
      throw new Error(i18next.t('text.list_is_not_completed'))
    } else {
      return vehicles.map(vehicle => {
        delete vehicle.__dirty__
        return vehicle
      })
    }
  }

  _notify(message, level = '') {
    document.dispatchEvent(
      new CustomEvent('notify', {
        detail: {
          level,
          message
        }
      })
    )
  }
}

window.customElements.define('transport-vehicle', TransportVehicle)
