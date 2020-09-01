import { client } from '@things-factory/shell'
import { gqlBuilder } from '@things-factory/utils'
import gql from 'graphql-tag'

export async function fetchSettingRule(setting) {
  const response = await client.query({
    query: gql`
      query {
        setting(${gqlBuilder.buildArgs({ name: setting })}) {
          value
        }
      }
    `
  })

  if (!response.errors) {
    if (response.data.setting?.value) {
      return response.data.setting.value.toLowerCase() == 'true'
    }

    return false
  }
}
