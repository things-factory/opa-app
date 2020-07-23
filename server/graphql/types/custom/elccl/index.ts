import { ElcclInventorySummaryReport } from './elccl-inventory-summary-report'
import { ElcclInventorySummaryReportList } from './elccl-inventory-summary-report-list'

export const Query = `
  elcclInventoryHistorySummaryReport(filters: [Filter], pagination: Pagination, sortings: [Sorting]): ElcclInventorySummaryReportList
`

export const Types = [ElcclInventorySummaryReport, ElcclInventorySummaryReportList]
