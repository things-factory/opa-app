import { ElcclInventorySummaryReport } from './elccl-inventory-summary-report'
import { ElcclInventorySummaryReportList } from './elccl-inventory-summary-report-list'
import { ElcclDailyCollectionReport } from './elccl-daily-collection-report'
import { ElcclDailyCollectionReportList } from './elccl-daily-collection-report-list'
import { ElcclInventoryReport } from './elccl-inventory-report'

export const Query = `
  elcclInventoryHistorySummaryReport(filters: [Filter], pagination: Pagination, sortings: [Sorting]): ElcclInventorySummaryReportList
  elcclDailyCollectionReport(filters: [Filter], pagination: Pagination, sortings: [Sorting]): [DailyCollectionReport]
  elcclInventoryHistoryReport(filters: [Filter], pagination: Pagination, sortings: [Sorting]): [ElcclInventoryReport]
`

export const Types = [
  ElcclInventorySummaryReport,
  ElcclInventorySummaryReportList,
  ElcclDailyCollectionReport,
  ElcclDailyCollectionReportList,
  ElcclInventoryReport
]
