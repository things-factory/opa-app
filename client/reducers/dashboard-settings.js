import { UPDATE_DASHBOARD_SETTINGS, CLEAR_DASHBOARD_SETTINGS } from '../actions/dashboard-settings'

const INITIAL_STATE = {}

const dashboard = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_DASHBOARD_SETTINGS:
      return {
        ...state,
        ...action.settings
      }

    case CLEAR_DASHBOARD_SETTINGS:
      return {}

    default:
      return state
  }
}

export default dashboard
