import { client } from '@things-factory/shell'
import gql from 'graphql-tag'
import { LOCATION_LABEL_SETTING_KEY, PALLET_LABEL_SETTING_KEY } from '../label-setting-constants'
export async function fetchLabelSettings() {
  var labelSettings = await client.query({
    query: gql`
      {
        labelSettings(names:["${LOCATION_LABEL_SETTING_KEY}", "${PALLET_LABEL_SETTING_KEY}"]) {
          name
          value
          board {
            id
            name
            description
            thumbnail
          }
        }
      }
    `
  })

  if (!labelSettings || !labelSettings.data) return
  return labelSettings.data.labelSettings
}
