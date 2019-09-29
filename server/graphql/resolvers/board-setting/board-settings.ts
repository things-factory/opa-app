import { Board } from '@things-factory/board-service'
import { Setting } from '@things-factory/setting-base'
import { getRepository } from 'typeorm'
import {
  HOME_BOARD_PREFIX,
  LOCATION_LABEL_SETTING_KEY,
  PALLET_LABEL_SETTING_KEY
} from '../../../opa-app-setting-constants'

export const boardSettingsResolver = {
  async boardSettings(_: any, params: any, context: any) {
    const HOME_BOARD = `${HOME_BOARD_PREFIX}:${context.state.user.userType}`

    const queryBuilder = getRepository(Setting).createQueryBuilder()
    const names = [LOCATION_LABEL_SETTING_KEY, PALLET_LABEL_SETTING_KEY, HOME_BOARD]

    var qb = queryBuilder
      // .innerJoin(Board, 'Board', 'Board.id = CAST(Setting.value AS uuid)')
      .innerJoin(Board, 'Board', 'Setting.value = CAST(Board.id AS char(36))')
      // .innerJoin(Board, 'Board', 'Board.id = Setting.value')
      .select([
        'Setting.id as id',
        'Setting.name as name',
        'Setting.value as value',
        'Board.id as boardId',
        'Board.name as boardName',
        'Board.description as boardDescription',
        'Board.thumbnail as boardThumbnail'
      ])
      .where('Setting.domain_id = :domain', { domain: context.state.domain.id })

    if (names && names.length) qb.andWhere('Setting.name IN (:...names)', { names })

    var boardSettingList = await qb.getRawMany()

    return boardSettingList.map(boardSetting => {
      var setting: any = {
        board: {}
      }

      for (let key in boardSetting) {
        if (key.includes('board')) {
          let originKey = key
          key = key.replace('board', '').toLowerCase()
          setting.board[key] = boardSetting[originKey]
        } else {
          setting[key] = boardSetting[key]
        }
      }

      if (setting.name.indexOf(HOME_BOARD_PREFIX) == 0) {
        setting.name = HOME_BOARD_PREFIX
      }

      return setting
    })
  }
}
