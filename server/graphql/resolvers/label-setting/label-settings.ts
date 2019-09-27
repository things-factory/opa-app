import { Board } from '@things-factory/board-service'
import { Setting } from '@things-factory/setting-base'
import { getRepository } from 'typeorm'

export const labelSettingsResolver = {
  async labelSettings(_: any, params: any, context: any) {
    var { names } = params
    const queryBuilder = getRepository(Setting).createQueryBuilder()

    var qb = queryBuilder
      .innerJoin(Board, 'board', 'setting.value = board.id')
      .select([
        'setting.id',
        'setting.name',
        'setting.value',
        'board.id as boardId',
        'board.name as boardName',
        'board.description as boardDescription',
        'board.thumbnail as boardThumbnail'
      ])
      .where('setting.domain_id = :domain', { domain: context.state.domain.id })

    if (names && names.length) qb.andWhere('setting.name IN (:...names)', { names })

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
