import gql from 'graphql-tag'

export const ElcclInventoryReport = gql`
  type ElcclInventoryReport {
    batchId: String
    packingType: String
    product: Product
    refNo: String
    openingQty: Float
    openingUomValue: Float
    uomValue: Float
    qty: Float
    orderName: String
    createdAt: String
  }
`
