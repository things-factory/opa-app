import gql from 'graphql-tag'

export const OpaMenu = gql`
  type OpaMenu {
    id: String
    domain: Domain
    name: String
    description: String
    category: String
    menuType: String
    rank: Int
    routing: String
    routingType: String
    resourceType: String
    resourceUrl: String
    resourceName: String
    idField: String
    titleField: String
    gridSaveUrl: String
    pagination: Boolean
    detailFormId: String
    detailLayout: String
    template: String
    hiddenFlag: Boolean
    itemsProp: String
    totalProp: String
    fixedColumns: Int
    iconPath: String
    parent: Menu
    childrens: [Menu]
    buttons: [MenuButton]
    columns: [MenuColumn]
    creator: User
    updater: User
    createdAt: String
    updatedAt: String
  }
`
