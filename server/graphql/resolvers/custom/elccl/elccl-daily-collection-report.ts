import { convertListParams, ListParam } from '@things-factory/shell'
import { getRepository } from 'typeorm'
import { User } from '@things-factory/auth-base'
import { Bizplace, BizplaceUser } from '@things-factory/biz-base'
import { InventoryHistory } from '@things-factory/warehouse-base'

export const elcclDailyCollectionReport = {
  async elcclDailyCollectionReport(_: any, params: ListParam, context: any) {
    try {
      let bizplaceQuery = ''
      if (params.filters.find((filter: any) => filter.name === 'bizplace')) {
        const bizplace: Bizplace = await getRepository(Bizplace).findOne({
          id: params.filters.find(data => data.name === 'bizplace').value
        })
        bizplaceQuery = "AND rg.bizplace_id = '" + bizplace.id + "'"
      }

      let fromDate = params.filters.find(data => data.name === 'fromDate')
      let toDate = params.filters.find(data => data.name === 'toDate')
      let arrivalNotice = params.filters.find(data => data.name === 'arrivalNotice')
      let tzoffset = params.filters.find(data => data.name === 'tzoffset').value + ' seconds'

      if (!fromDate || !toDate) throw 'Invalid input'

      let arrivalNoticeQuery = ''
      if (arrivalNotice) {
        arrivalNoticeQuery =
          'AND arrival_notice_name ILIKE ANY(ARRAY[' +
          arrivalNotice.value
            .split(',')
            .map(an => {
              return "'%" + an.trim().replace(/'/g, "''") + "%'"
            })
            .join(',') +
          '])'
      }

      const result = await getRepository(InventoryHistory).query(`
        with src as (
          select ar.name as release_good_name, COALESCE(ar.name, 'MIGRATE') as arrival_notice_name, bz.name as bizplace_name, 
          ws.ended_at::date, delord.own_collection, delord.name as delivery_order_name, inv.pallet_id, inv.batch_id
          from release_goods rg
          inner join bizplaces bz on bz.id = rg.bizplace_id
          inner join worksheets ws on ws.release_good_id = rg.id and ws.type = 'LOADING'
          inner join order_inventories oi on oi.release_good_id = rg.id
          inner join inventories inv on inv.id = oi.inventory_id
          inner join delivery_orders delord on delord.id = oi.delivery_order_id 
          left join order_inventories inbound_oi on inbound_oi.inventory_id = inv.id and inbound_oi.type = 'ARRIVAL_NOTICE'
          left join arrival_notices ar on ar.id = inbound_oi.arrival_notice_id
          where rg.domain_id = $1
          and ws.ended_at >= $2::timestamp + $4::interval
          and ws.ended_at <= $3::timestamp + $4::interval
          ${bizplaceQuery}
        )
        select bizplace_name, arrival_notice_name, ended_at, batch_id, 
        trim(trailing ', ' from self_collect) as self_collect, trim(trailing ', ' from delivery) as delivery,
          trim(trailing ', ' from self_collect_summary) as self_collect_summary, trim(trailing ', ' from delivery_summary) as delivery_summary,
          total_self_collect, total_delivery
          from(
            select bizplace_name, arrival_notice_name, ended_at, batch_id,
            string_agg(self_collect, '') as self_collect,
            string_agg(delivery, '') delivery,
            string_agg(self_collect_summary, '') as self_collect_summary,
            string_agg(delivery_summary, '') delivery_summary,
            COUNT(case when own_collection = true then 1 end) as total_self_collect,
            COUNT(case when own_collection = false then 1 end) as total_delivery
            from (
              select arrival_notice_name, delivery_order_name, bizplace_name, ended_at::varchar, own_collection, batch_id,
                case when own_collection = 'true' then concat(delivery_order_name, ' (', string_agg(pallet_id, ', ' ORDER BY pallet_id), '), ') else '' end as self_collect,
                case when own_collection = 'false' then concat(delivery_order_name, ' (', string_agg(pallet_id, ', ' ORDER BY pallet_id), '), ') else '' end as delivery,
                case when own_collection = 'true' then concat(delivery_order_name, ' (', count(*), '), ') else '' end as self_collect_summary,
                case when own_collection = 'false' then concat(delivery_order_name, ' (', count(*), '), ') else '' end as delivery_summary
              from src
              where 1 = 1
            ${arrivalNoticeQuery}
            group by bizplace_name, arrival_notice_name, ended_at, delivery_order_name, own_collection, batch_id
          ) src
          group by bizplace_name, arrival_notice_name, ended_at, batch_id
          order by bizplace_name, ended_at, arrival_notice_name
        ) src
        `, [context.state.domain.id, fromDate.value, toDate.value, tzoffset])
        
      let items = result as any

      return items
    } catch (error) {
      throw error
    }
  }
}
