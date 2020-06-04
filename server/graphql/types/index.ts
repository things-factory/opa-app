import { Filter, ObjectRef, Pagination, Sorting } from '@things-factory/shell'
import * as OpaMenu from './opa-menu'
import * as BoardSetting from './board-setting'
import * as DailyCollectionReport from './daily-collection-report'

export const queries = [OpaMenu.Query, BoardSetting.Query, DailyCollectionReport.Query]

export const types = [
  Pagination,
  Sorting,
  Filter,
  ObjectRef,
  ...OpaMenu.Types,
  ...BoardSetting.Types,
  ...DailyCollectionReport.Types
]
