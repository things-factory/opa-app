import gql from 'graphql-tag'

export const BoardSetting = gql`
  type BoardSetting {
    id: String
    name: String
    value: String
    board: Board
  }
`
