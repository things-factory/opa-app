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
    bizplace: Bizplace
    openingBalance: Float
    inBalance: Float
    outBalance: Float
    closingBalance: Float
    arrivalNoticeName: String
    jsonDateMovement: String
    containerSize: String
  }
`
