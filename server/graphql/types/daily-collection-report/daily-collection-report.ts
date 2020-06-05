import gql from 'graphql-tag'

export const DailyCollectionReport = gql`
  type DailyCollectionReport {
    id: String
    name: String
    domain: Domain
    description: String
    updater: User
    creator: User
    updatedAt: String
    createdAt: String
    arrival_notice_name: String
    bizplace_name: String
    ended_at: String
    self_collect: String
    delivery: String
  }
`
