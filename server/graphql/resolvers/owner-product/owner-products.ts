import { Product } from '@things-factory/product-base'
import { buildQuery, ListParam } from '@things-factory/shell'
import { getRepository } from 'typeorm'

export const ownerProductsResolver = {
  async ownerProducts(_: any, params: ListParam, context: any) {
    const queryBuilder = getRepository(Product).createQueryBuilder()
    buildQuery(queryBuilder, params)
    const [items, total] = await queryBuilder
      .leftJoinAndSelect('Product.company', 'Company')
      .leftJoinAndSelect('Product.refTo', 'RefTo')
      .leftJoinAndSelect('Product.aliases', 'Aliases')
      .leftJoinAndSelect('Product.options', 'Options')
      .leftJoinAndSelect('Product.creator', 'Creator')
      .leftJoinAndSelect('Product.updater', 'Updater')
      .where({ domain: context.domain, type: 'service' })
      .getManyAndCount()

    return { items, total }
  }
}
