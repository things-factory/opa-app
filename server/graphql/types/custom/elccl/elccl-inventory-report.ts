import gql from 'graphql-tag'

export const ElcclInventoryReport = gql`
  type ElcclInventoryReport {
    batchId: String
    packingType: String
    product: Product
    refNo: String
    openingQty: Float
    openingWeight: Float
    qty: Float
    weight: Float
    orderName: String
    createdAt: String
  }
`
