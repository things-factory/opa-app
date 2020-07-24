import gql from 'graphql-tag'

export const ElcclDailyCollectionReportList = gql`
  type DailyCollectionReportList {
    items: [DailyCollectionReport]
    total: Int
  }
`
