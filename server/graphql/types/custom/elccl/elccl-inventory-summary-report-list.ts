import gql from 'graphql-tag'

export const ElcclInventorySummaryReportList = gql`
  type ElcclInventorySummaryReportList {
    items: [ElcclInventorySummaryReport]
    total: Int
  }
`
