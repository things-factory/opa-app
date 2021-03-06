import { elcclInventoryHistorySummaryReport } from './elccl-inventory-history-summary-report'
import { elcclDailyCollectionReport } from './elccl-daily-collection-report'
import { elcclInventoryHistoryReport } from './elccl-inventory-history-report'
import { elcclInventoryHistoryPalletDetailReport } from './elccl-inventory-history-pallet-detail-report'
import { elcclOnhandInventoryCounterResolver } from './elccl-onhand-inventory-counter'
import { elcclDailyOrderInventoryReport } from './elccl-daily-order-inventory-report'

export const Query = {
  ...elcclInventoryHistorySummaryReport,
  ...elcclDailyCollectionReport,
  ...elcclInventoryHistoryReport,
  ...elcclInventoryHistoryPalletDetailReport,
  ...elcclOnhandInventoryCounterResolver,
  ...elcclDailyOrderInventoryReport
}
