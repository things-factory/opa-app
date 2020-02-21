import { client } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'

const LOCATION_SORTING_RULE_KEY = 'location-sorting-rule'

export async function fetchLocationSortingRule() {
  const response = await client.query({
    query: gql`
      query {
        setting(${gqlBuilder.buildArgs({ name: LOCATION_SORTING_RULE_KEY })}) {
          value
        }
      }
    `
  })

  if (!response.errors) {
    const sortingRule = JSON.parse(response.data.setting.value)
    const fields = Object.keys(sortingRule)
    if (fields.length > 0) {
      return fields.map(field => {
        return { name: field, desc: sortingRule[field] === 'DESC' ? true : false }
      })
    } else {
      return []
    }
  }
}
