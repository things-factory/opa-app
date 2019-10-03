import { addRoutingType, updateMenuProvider } from '@things-factory/menu-base'
import { client, store, isMobileDevice, UPDATE_BASE_URL } from '@things-factory/shell'
import gql from 'graphql-tag'
import { UPDATE_DASHBOARD_SETTINGS, CLEAR_DASHBOARD_SETTINGS } from './actions/dashboard-settings'
import dashboard from './reducers/dashboard-settings'
import { fetchBoardSettings } from './fetch-board-settings'
import { auth } from '@things-factory/auth-base'
import { TOOL_POSITION } from '@things-factory/layout-base'
import { APPEND_APP_TOOL } from '@things-factory/apptool-base'

export default function bootstrap() {
  store.addReducers({
    dashboard
  })

  /* 사용자 signin/signout 에 따라서, setting 변경 */
  auth.on('signin', async () => {
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

  auth.on('signout', async () => {
    // clear dashboard settings
    store.dispatch({
      type: CLEAR_DASHBOARD_SETTINGS
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
}
