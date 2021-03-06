import gql from 'graphql-tag'

export const ElcclInventorySummaryReport = gql`
  type ElcclInventorySummaryReport {
    batchId: String
    packingType: String
    product: Product
    openingQty: Float
    adjustmentQty: Float
    closingQty: Float
    totalInQty: Float
    totalOutQty: Float
    totalReturnQty: Float
    initialQty: Float
    initialDate: String
  }
`
