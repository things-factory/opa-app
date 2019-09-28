import { Board } from '@things-factory/board-service'
import { Setting } from '@things-factory/setting-base'
import { getRepository } from 'typeorm'

export const labelSettingsResolver = {
  async labelSettings(_: any, params: any, context: any) {
    var { names } = params
    const queryBuilder = getRepository(Setting).createQueryBuilder()

    var qb = queryBuilder
      .innerJoin(Board, 'Board', 'Board.id = CAST(Setting.value AS uuid)')
      .select([
        'Setting.id',
        'Setting.name',
        'Setting.value',
        'Board.id as boardId',
        'Board.name as boardName',
        'Board.description as boardDescription',
        'Board.thumbnail as boardThumbnail'
      ])
      .where('Setting.domain_id = :domain', { domain: context.state.domain.id })

    if (names && names.length) qb.andWhere('Setting.name IN (:...names)', { names })

    var labelSettingList = await qb.getRawMany()

    return labelSettingList.map(ls => {
      var obj: any = {
        board: {}
      }

      for (let key in ls) {
        var originKey = key
        var targetObj = obj
        if (key.includes('board')) {
          key = key.replace('board', '').toLowerCase()
          targetObj = obj.board
        }
        targetObj[key] = ls[originKey]
      }

      return obj
    })
  }
}
