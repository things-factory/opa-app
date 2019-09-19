import { gql } from 'apollo-server-koa'

export const LabelSetting = gql`
  type LabelSetting {
    id: String
    name: String
    value: String
    board: Board
  }
`
