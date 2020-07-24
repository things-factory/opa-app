import { elcclInventoryHistorySummaryReport } from './elccl-inventory-history-summary-report'
import { elcclDailyCollectionReport } from './elccl-daily-collection-report'

export const Query = {
  ...elcclInventoryHistorySummaryReport,
  ...elcclDailyCollectionReport
}
