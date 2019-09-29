import { UPDATE_OPA_APP_SETTINGS, CLEAR_OPA_APP_SETTINGS } from '../actions/opa-app-settings'

const INITIAL_STATE = {}

const opaApp = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_OPA_APP_SETTINGS:
      return {
        ...state,
        ...action.settings
      }

    case CLEAR_OPA_APP_SETTINGS:
      return {}

    default:
      return state
  }
}

export default opaApp
