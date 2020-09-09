import * as OpaMenu from './opa-menu'
import * as BoardSetting from './board-setting'
import * as CustomElccl from './custom/elccl'
import * as Extra from './extra'

export const queries = [OpaMenu.Query, BoardSetting.Query, CustomElccl.Query]

export const mutations = [Extra.Mutation]
