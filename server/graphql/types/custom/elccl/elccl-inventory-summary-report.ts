import gql from 'graphql-tag'

export const ElcclInventorySummaryReport = gql`
  type ElcclInventorySummaryReport {
    batchId: String
    product: Product
    weight: Float
    openingWeight: Float
    zone: String
    packingType: String
    otherRef: String
    qty: Float
    openingQty: Float
    unit: String
    status: String
    transactionType: String
    description: String
    transactionFlow: String
    orderName: String
    orderRefNo: String
    orderNo: String
    refOrderId: String
    creator: User
    updater: User
    createdAt: String
    updatedAt: String
    openingBalance: Float
    inBalance: Float
    outBalance: Float
    closingBalance: Float
    arrivalNoticeName: String
    jsonDateMovement: String
    containerSize: String
  }
`
