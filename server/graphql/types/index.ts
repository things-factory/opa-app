import { Filter, ObjectRef, Pagination, Sorting } from '@things-factory/shell'
import * as OpaMenu from './opa-menu'
import * as BoardSetting from './board-setting'
import * as CustomElccl from './custom/elccl'
import * as Extra from './extra'

export const queries = [OpaMenu.Query, BoardSetting.Query, CustomElccl.Query]

export const mutations = [Extra.Mutation]

export const types = [
  Pagination,
  Sorting,
  Filter,
  ObjectRef,
  ...OpaMenu.Types,
  ...BoardSetting.Types,
  ...CustomElccl.Types
]
