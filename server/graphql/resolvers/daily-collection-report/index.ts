import { dailyCollectionReportResolver } from './daily-collection-report'
import { dailyCollectionReportsResolver } from './daily-collection-reports'

export const Query = {
  ...dailyCollectionReportsResolver,
  ...dailyCollectionReportResolver
}
