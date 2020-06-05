import { DailyCollectionReport } from './daily-collection-report'
import { DailyCollectionReportList } from './daily-collection-report-list'

export const Query = `
  dailyCollectionReports(filters: [Filter], pagination: Pagination, sortings: [Sorting]): [DailyCollectionReport]
  dailyCollectionReport(name: String!): DailyCollectionReport
`

export const Types = [DailyCollectionReport, DailyCollectionReportList]
