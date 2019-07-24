import { registMenuProvider } from '@things-factory/menu-base'
import { store, client, gqlBuilder } from '@things-factory/shell'
import gql from 'graphql-tag'

export default function bootstrap() {
  store.dispatch(
    registMenuProvider(async () => {
      const response = await client.query({
        query: gql`
        query {
          menus(${gqlBuilder.buildArgs({
            filters: [
              {
                name: 'category',
                operator: 'like',
                value: 'client'
              }
            ]
          })}) {
            items {
              id
              name
              childrens {
                id
                name
                routingType
                idField
                resourceName
                template
              }
            }
          }
        }
      `
      })

      return response.data.menus.items
    })
  )
}
