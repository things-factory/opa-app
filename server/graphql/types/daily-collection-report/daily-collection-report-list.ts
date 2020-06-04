import gql from 'graphql-tag'

export const DailyCollectionReportList = gql`
  type DailyCollectionReportList {
    items: [DailyCollectionReport]
    total: Int
  }
`
