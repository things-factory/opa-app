import gql from 'graphql-tag'

export const ElcclDailyOrderInventoryReport = gql`
  type ElcclDailyOrderInventoryReport {
    bizplace: Bizplace
    bag: Float
    bagRunningTotal: Float
    basket: Float
    basketRunningTotal: Float
    carton: Float
    cartonRunningTotal: Float
    createdAt: String
    doRefNo: String
    orderNo: String
    orderRefNo: String
    pallet:Float
    palletRunningTotal: Float
  }
`
