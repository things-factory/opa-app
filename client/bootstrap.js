import { APPEND_APP_TOOL } from '@things-factory/apptool-base'
import { auth } from '@things-factory/auth-base'
import { TOOL_POSITION } from '@things-factory/layout-base'
import { addRoutingType, updateMenuProvider } from '@things-factory/menu-base'
import { ADD_SETTING } from '@things-factory/setting-base'
import '@things-factory/setting-ui/client/setting-lets/domain-switch-let'
import { client, store, UPDATE_BASE_URL } from '@things-factory/shell'
import { isMobileDevice } from '@things-factory/utils'
import gql from 'graphql-tag'
import { html } from 'lit-element'
import { UPDATE_DASHBOARD_SETTINGS } from './actions/dashboard-settings'
import { fetchBoardSettings } from './fetch-board-settings'
import dashboard from './reducers/dashboard-settings'

console.log(`
 ▄▄  ▄▄▄  ▄▄▄ ▄▄▄   ▄▄  ▄▄▄  ▄▄
▓  ▓ ▓  ▓ ▓   ▓  ▓ ▓  ▓  ▓  ▓  ▓
▓  ▓ ▓▀▀  ▓▀▀ ▓▀▀▄ ▓▀▀▓  ▓  ▓  ▓ 
▓  ▓ ▓    ▓   ▓  ▓ ▓  ▓  ▓  ▓  ▓  
 ▀▀  ▀    ▀▀▀ ▀  ▀ ▀  ▀  ▀   ▀▀ 
`)

export default function bootstrap() {
  store.addReducers({
    dashboard
  })

  /* 사용자가 로그인 된 경우에 setting 변경 */
  auth.on('profile', async () => {
    // fetch dashboard settings
    var settings = await fetchBoardSettings()

    store.dispatch({
      type: UPDATE_DASHBOARD_SETTINGS,
      settings: settings.reduce((settings, setting) => {
        settings[setting.name] = setting
        return settings
      }, {})
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

  if (isMobileDevice()) {
    import('./apptools/dashboard-tool').then(({ DashboardTool }) => {
      var dashboardTool = new DashboardTool()
      /* menu-list page에서만 dashboard tool 이 보이도록 한다. */
      dashboardTool.whiteList = ['menu-list']

      store.dispatch({
        type: APPEND_APP_TOOL,
        tool: {
          template: dashboardTool,
          position: TOOL_POSITION.REAR
        }
      })
    })
  }

  /* add domain-switch-let into settings */
  store.dispatch({
    type: ADD_SETTING,
    setting: {
      seq: 30,
      template: html` <domain-switch-let></domain-switch-let> `
    }
  })
}
