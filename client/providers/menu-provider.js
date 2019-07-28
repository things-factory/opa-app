import { client, store, gqlBuilder } from '@things-factory/shell'
import gql from 'graphql-tag'

export async function menuProvider() {
  var user = store.getState().auth.user
  if (!user) {
    return
  }

  const userType = user.userType

  let argsObj = {}
  if (userType === 'admin') {
    argsObj = {
      filters: [
        {
          name: 'menuType',
          operator: 'eq',
          value: 'MENU'
        }
      ],
      sortings: [
        {
          name: 'rank'
        }
      ]
    }
  } else {
    argsObj = {
      filters: [
        {
          name: 'category',
          operator: 'like',
          value: userType
        },
        {
          name: 'menuType',
          operator: 'eq',
          value: 'MENU'
        },
        {
          name: 'hiddenFlag',
          operator: 'eq',
          value: 'false',
          dataType: 'boolean'
        }
      ],
      sortings: [
        {
          name: 'rank'
        }
      ]
    }
  }

  const response = await client.query({
    query: gql`
      query {
        menus(${gqlBuilder.buildArgs(argsObj)}) {
          items {
            id
            name
            childrens {
              id
              rank
              category
              name
              routingType
              idField
              titleField
              resourceName
              template
              hiddenFlag
            }
          }
        }
      }
    `
  })

  return response.data.menus.items.map(item => {
    return {
      ...item,
      childrens: [
        ...item.childrens
          .filter(children => {
            if (userType !== 'admin') {
              return children.category.toLowerCase().indexOf(userType) >= 0 && !children.hiddenFlag
            } else {
              return children
            }
          })
          .sort((a, b) => a.rank - b.rank)
      ]
    }
  })
}
