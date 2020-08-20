import { client } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'

export async function fetchLocationSortingRule(sortingRule) {
  const response = await client.query({
    query: gql`
      query {
        setting(${gqlBuilder.buildArgs({ name: sortingRule })}) {
          value
        }
      }
    `
  })

  if (!response.errors) {
    let filters = []

    if (response.data.setting?.value) {
      const sortingRule = JSON.parse(response.data.setting.value)
      filters = Object.keys(sortingRule).map(field => {
        return { name: field, desc: sortingRule[field] === 'DESC' }
      })
    }

    return filters
  }
}
