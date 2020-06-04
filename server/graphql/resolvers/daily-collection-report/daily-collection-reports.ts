import { ListParam, convertListParams } from '@things-factory/shell'
import { getRepository } from 'typeorm'

export const dailyCollectionReportsResolver = {
  async dailyCollectionReports(_: any, params: ListParam, context: any) {
    const convertedParams = convertListParams(params)
    // const [items, total] = await getRepository(DailyCollectionReport).findAndCount({
    //   ...convertedParams,
    //   relations: ['domain', 'creator', 'updater']
    // })
    const [items, total] = [[], 0]
    return { items, total }
  }
}
