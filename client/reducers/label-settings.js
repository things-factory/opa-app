import { UPDATE_LABEL_SETTINGS } from '../actions/label-settings'

const INITIAL_STATE = {
  locationLabel: {},
  palletLabel: {}
}

const labelSettings = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_LABEL_SETTINGS:
      return {
        ...state,
        locationLabel: action.locationLabel,
        palletLabel: action.palletLabel
      }

    default:
      return state
  }
}

export default labelSettings
