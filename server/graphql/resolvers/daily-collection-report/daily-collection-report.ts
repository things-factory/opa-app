import { getRepository } from 'typeorm'

export const dailyCollectionReportResolver = {
  async dailyCollectionReport(_: any, { name }, context: any) {
    // const repository = getRepository(DailyCollectionReport)
    // return await getRepository(DailyCollectionReport).findOne({
    //   where: { domain: context.state.domain, name },
    //   relations: ['domain', 'creator', 'updater']
    // })
  }
}
