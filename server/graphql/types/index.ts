import * as OpaMenu from './opa-menu'
import * as BoardSetting from './board-setting'

export const queries = [OpaMenu.Query, BoardSetting.Query]

export const types = [...OpaMenu.Types, ...BoardSetting.Types]
