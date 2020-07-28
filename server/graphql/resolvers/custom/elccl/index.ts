import { elcclInventoryHistorySummaryReport } from './elccl-inventory-history-summary-report'
import { elcclDailyCollectionReport } from './elccl-daily-collection-report'
import { elcclInventoryHistoryReport } from './elccl-inventory-history-report'

export const Query = {
  ...elcclInventoryHistorySummaryReport,
  ...elcclDailyCollectionReport,
  ...elcclInventoryHistoryReport
}
