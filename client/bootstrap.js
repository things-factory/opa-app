import { addRoutingType, updateMenuProvider } from '@things-factory/menu-base'
import { ADD_SETTING } from '@things-factory/setting-base'
import { client, store, UPDATE_BASE_URL } from '@things-factory/shell'
import gql from 'graphql-tag'
import { html } from 'lit-html'
import { UPDATE_LABEL_SETTINGS } from './actions/label-settings'
import { LOCATION_LABEL_SETTING_KEY, PALLET_LABEL_SETTING_KEY } from './label-setting-constants'
import reducerLabelSettings from './reducers/label-settings'
import { fetchLabelSettings } from './viewparts/fetch-label-settings'
import { auth } from '@things-factory/auth-base'

import './viewparts/label-setting-let'

export default function bootstrap() {
  store.addReducers({
    labelSettings: reducerLabelSettings
  })

  /* 사용자 signin/signout 에 따라서, labelSetting 변경 */
  auth.on('signin', async () => {
    // fetch labelSettings
    var labelSettings = await fetchLabelSettings()
    var labels = {}
    labelSettings.forEach(setting => {
      if (setting.name == LOCATION_LABEL_SETTING_KEY) {
        labels.locationLabel = setting.board
      } else if (setting.name == PALLET_LABEL_SETTING_KEY) {
        labels.palletLabel = setting.board
      }
    })

    store.dispatch({
      type: UPDATE_LABEL_SETTINGS,
      locationLabel: labels.locationLabel,
      palletLabel: labels.palletLabel
    })
  })

  auth.on('signout', async () => {
    // clear labelSettings
    store.dispatch({
      type: UPDATE_LABEL_SETTINGS,
      locationLabel: null,
      palletLabel: null
    })
  })

  /*
   * things-board 기능을 메뉴에서 지원하기 위해서, VIEWER, PLAYER routing type을 추가함.
   */
  store.dispatch(addRoutingType('VIEWER', 'board-viewer', 'bar_chart'))
  store.dispatch(addRoutingType('PLAYER', 'board-player', 'play_arrow'))

  /*
   * server endpoint를 설정할 수 있음. (기본은 client가 패포된 서버를 사용함.)
   */
  store.dispatch({
    type: UPDATE_BASE_URL
    // baseUrl: 'http://opaone.com'
  })

  store.dispatch({
    type: ADD_SETTING,
    setting: {
      seq: 100,
      template: html`
        <label-setting-let></label-setting-let>
      `
    }
  })

  store.dispatch(
    updateMenuProvider(async () => {
      const response = await client.query({
        query: gql`
          query {
            menus: opaMenus {
              id
              name
              childrens {
                id
                name
                routingType
                idField
                titleField
                resourceName
                resourceUrl
                template
              }
            }
          }
        `
      })

      return response.data.menus
    })
  )
}
