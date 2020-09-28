import { ListParam } from '@things-factory/shell'
import { getPermittedBizplaceIds } from '@things-factory/biz-base'
import { getRepository } from 'typeorm'
import { Inventory } from '@things-factory/warehouse-base'

export const kimedaOnhandInventoryCounterResolver = {
  async kimedaOnhandInventoryCounter(_: any, params: ListParam, context: any) {
    let bizplaces = await getPermittedBizplaceIds(context.state.domain, context.state.user)
    bizplaces = bizplaces.map(bizplace => {
                  return "'" + bizplace.trim() + "'"
                }).join(',')

    const result = await getRepository(Inventory).query(`
      select sum(qty) as total from (
        select l2.name, count(distinct i2.location_id) as qty, string_agg(i2.pallet_id, ', ')
        from inventories i2
        inner join locations l2 on i2.location_id = l2.id
        and i2.domain_id = l2.domain_id
        where i2.status not in ('INTRANSIT', 'TERMINATED', 'DELETED')
        and i2.domain_id = '${context.state.domain.id}'
        and i2.bizplace_id in (${bizplaces})
        and l2.type = 'SHELF'
        group by l2.name
        union all
        select l2.name, count(i2.pallet_id) as qty, string_agg(i2.pallet_id, ', ')
        from inventories i2
        inner join locations l2 on i2.location_id = l2.id
        and i2.domain_id = l2.domain_id
        where i2.status not in ('INTRANSIT', 'TERMINATED', 'DELETED')
        and i2.domain_id = '${context.state.domain.id}'
        and i2.bizplace_id in (${bizplaces})
        and l2.type = 'FLOOR'
        group by l2.name
      ) as foo
    `
    )
    
    const total = parseInt(result[0].total)

    return total
  }
}
