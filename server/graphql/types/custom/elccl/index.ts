import { ElcclInventorySummaryReport } from './elccl-inventory-summary-report'
import { ElcclInventorySummaryReportList } from './elccl-inventory-summary-report-list'
import { ElcclDailyCollectionReport } from './elccl-daily-collection-report'
import { ElcclDailyCollectionReportList } from './elccl-daily-collection-report-list'
import { ElcclInventoryReport } from './elccl-inventory-report'
import { ElcclPalletDetailReport } from './elccl-pallet-detail-report'

export const Query = `
  elcclInventoryHistorySummaryReport(filters: [Filter], pagination: Pagination, sortings: [Sorting]): ElcclInventorySummaryReportList
  elcclDailyCollectionReport(filters: [Filter], pagination: Pagination, sortings: [Sorting]): [ElcclDailyCollectionReport]
  elcclInventoryHistoryReport(filters: [Filter], pagination: Pagination, sortings: [Sorting]): [ElcclInventoryReport]
  elcclInventoryHistoryPalletDetailReport(filters: [Filter], pagination: Pagination, sortings: [Sorting]): [ElcclPalletDetailReport]
  elcclOnhandInventoryCounter(filters: [Filter]): Int
`

export const Types = [
  ElcclInventorySummaryReport,
  ElcclInventorySummaryReportList,
  ElcclDailyCollectionReport,
  ElcclDailyCollectionReportList,
  ElcclInventoryReport,
  ElcclPalletDetailReport
]
