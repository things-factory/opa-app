import { addRoutingType, updateMenuProvider } from '@things-factory/menu-base'
import { store, UPDATE_BASE_URL } from '@things-factory/shell'

import { menuProvider } from './providers/menu-provider'

export default function bootstrap() {
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

  /*
   * menuProvider를 등록함. (임시, 데모용임)
   */
  store.dispatch(updateMenuProvider(menuProvider))
}
