export const Mutation = /* GraphQL */ `
  addReleaseGoodProducts (
    name: String!
    orderInventories: [NewOrderInventory]
    existingOrderInventories: [NewOrderInventory]
  ): Boolean @priviledge(category: "order_customer", priviledge: "mutation")
`
