import gql from 'graphql-tag'

export const ElcclDailyCollectionReportList = gql`
  type ElcclDailyCollectionReportList {
    items: [ElcclDailyCollectionReport]
    total: Int
  }
`
