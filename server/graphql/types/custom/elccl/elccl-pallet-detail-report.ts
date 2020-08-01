import gql from 'graphql-tag'

export const ElcclPalletDetailReport = gql`
  type ElcclPalletDetailReport {
    product: Product
    bizplace: Bizplace
    batchId: String
    openingBalance: Float
    inBalance: Float
    outBalance: Float
    closingBalance: Float
    jsonDateMovement: String
    containerSize: String
    jobSheet: String
  }
`
