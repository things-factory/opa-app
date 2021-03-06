import gql from 'graphql-tag'

export const ElcclDailyCollectionReport = gql`
  type ElcclDailyCollectionReport {
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
    self_collect_summary: String
    delivery_summary: String
    total_self_collect: Float
    total_delivery: Float
    batch_id: String
  }
`
