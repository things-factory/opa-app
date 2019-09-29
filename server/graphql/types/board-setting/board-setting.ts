import { gql } from 'apollo-server-koa'

export const BoardSetting = gql`
  type BoardSetting {
    id: String
    name: String
    value: String
    board: Board
  }
`
