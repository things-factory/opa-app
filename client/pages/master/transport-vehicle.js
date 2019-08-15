import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, navigate } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'

class TransportVehicle extends localize(i18next)(PageView) {
  static get properties() {
    return {
      _searchFields: Array,
      vehiclesConfig: Object,
      vehiclesData: Object
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        search-form {
          overflow: visible;
        }
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.vehicle_detail'),
      actions: [
        {
          title: i18next.t('button.add'),
          action: () => {
            console.log('this is save action')
          }
        },
        {
          title: i18next.t('button.save'),
          action: this.createTransportVehicle.bind(this)
        },
        {
          title: i18next.t('button.delete'),
          action: () => {
            console.log('this is delete action')
          }
        }
      ]
    }
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="name"
        @submit=${async () => {
          const { records, total } = await this._getVehicleList()
          this.data = {
            records,
            total
          }
        }}
      ></search-form>

      <div class="grist">
        <!-- <h2><mwc-icon>list_alt</mwc-icon>${i18next.t('title.transport_vehicle_detail')}</h2> -->

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
    this._searchFields = [
      {
        name: 'name',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.name')
        }
      },
      {
        name: 'regNumber',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.registration_no')
        }
      },
      {
        name: 'brand',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.brand')
        }
      },
      {
        name: 'model',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.model')
        }
      },
      {
        name: 'color',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.color')
        }
      },
      {
        name: 'size',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.size')
        }
      },
      {
        name: 'status',
        type: 'text',
        props: {
          searchOper: 'like',
          placeholder: i18next.t('field.status')
        }
      }
    ]

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
            align: 'center',
            editable: true
          },
          width: 80
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: {
            align: 'center',
            editable: true
          },
          width: 250
        }
      ]
    }
  }

  async _getVehicleList() {
    const response = await client.query({
      query: gql`
        query{
          transportVehicles(${gqlBuilder.buildArgs({
            filters: this._conditionParser()
          })}){
            items{
              name
              model
              brand
            }
            total
          }
        }
      `
    })
  }

  _conditionParser() {
    const fields = this.searchForm.getFields()
    const conditionFields = fields.filter(
      field =>
        (field.type !== 'checkbox' && field.value && field.value !== '') ||
        field.type === 'checkbox' ||
        field.type === 'select'
    )
    const conditions = []

    conditionFields.forEach(field => {
      conditions.push({
        name: field.name,
        value:
          field.type === 'text'
            ? field.value
            : field.type === 'select'
            ? field.value
            : field.type === 'checkbox'
            ? field.checked
            : field.value,
        operator: field.getAttribute('searchOper'),
        dataType:
          field.type === 'text'
            ? 'string'
            : field.type === 'select'
            ? 'string'
            : field.type === 'number'
            ? 'float'
            : 'boolean'
      })
    })
    return conditions
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
      const vehicles = this._getNewVehicles()

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

  _getNewVehicles() {
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
