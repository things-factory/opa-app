import gql from 'graphql-tag'

export const ElcclDailyOrderInventoryReportList = gql`
  type ElcclDailyOrderInventoryReportList {
    items: [ElcclDailyOrderInventoryReport]
    total: Int
  }
`
