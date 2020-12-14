import { ListParam } from '@things-factory/shell'
import { getManager, EntityManager, getRepository } from 'typeorm'
import { User } from '@things-factory/auth-base'
import { Bizplace, BizplaceUser } from '@things-factory/biz-base'

export const elcclDailyOrderInventoryReport = {
  async elcclDailyOrderInventoryReport(_: any, params: ListParam, context: any) {
    try {
      let userFilter = params.filters.find(data => data.name === 'user')

      let bizplaceFilter = { name: '', operator: '', value: '' }

      if (userFilter) {
        const user: User = await getRepository(User).findOne({
          domain: context.state.domain,
          id: userFilter.value
        })

        const bizplaceUser: any = await getRepository(BizplaceUser).findOne({
          where: {
            user,
            domain: context.state.domain,
            mainBizplace: true
          },
          relations: ['bizplace']
        })

        if (!bizplaceUser.bizplace) throw 'Invalid input'

        bizplaceFilter = { name: 'bizplace', operator: 'eq', value: bizplaceUser.bizplace.id }
      } else {
        bizplaceFilter = params.filters.find(data => data.name === 'bizplace')
      }

      let month = params.filters.find(data => data.name === 'month').value + '-01'
      let tzoffset = params.filters.find(data => data.name === 'tzoffset').value + ' seconds'

      if (!bizplaceFilter || !month ) throw 'Invalid input'

      const bizplace: Bizplace = await getRepository(Bizplace).findOne({
        id: bizplaceFilter.value
      })

      return await getManager().transaction(async (trxMgr: EntityManager) => {
        await trxMgr.query(
          `
          create temp table temp_invHistory as (
            select rih.pallet_id, rih.seq, 
            coalesce(grn.name, do2.name, rih.order_no) as order_no , rih.order_ref_no , an.delivery_order_no as do_ref_no, rih.bizplace_id, rih.ref_order_id, 
            coalesce(grn.created_at, rg.created_at, rih.created_at) as created_at, 
            rih.qty, inv.packing_type, inv.reusable_pallet_id, rih.transaction_type, 
            case when rih.status = 'TERMINATED' then rih.status else 'STORED' end as status,
            (case when lag(case when rih.status = 'TERMINATED' then 0 else 1 end) over (partition by rih.pallet_id order by rih.seq) = (case when rih.status = 'TERMINATED' then 0 else 1 end) 
              then 0 else 1 end) as startflag
            from reduced_inventory_histories rih
            inner join inventories inv on inv.domain_id =rih.domain_id and inv.pallet_id =rih.pallet_id 
            left join arrival_notices an on an.id = rih.ref_order_id::uuid and an.domain_id =rih.domain_id 
            left join goods_receival_notes grn on grn.arrival_notice_id = an.id
            left join release_goods rg on rg.id = rih.ref_order_id::uuid and rg.domain_id =rih.domain_id 
            left join delivery_orders do2 on do2.release_good_id = rg.id
            where ((rih.transaction_type <> 'PUTAWAY' and rih.transaction_type <> 'ADJUSTMENT' and rih.transaction_type <> 'RELOCATE') or rih.qty <> 0)
            and rih.domain_id =$1 and rih.bizplace_id = $2
            and coalesce(grn.created_at, rg.created_at, rih.created_at) < $3::timestamp + '1 month' + $4::interval
          )
        `,
        [context.state.domain.id, bizplace.id, month, tzoffset]
        )

        await trxMgr.query(
        `
        create temp table temp_invByPallet as (
          select grp.*, ivh.order_no, ivh.order_ref_no, ivh.do_ref_no from (
            select pallet_id, packing_type, min(created_at) as started_at, max(created_at) as ended_at, min(seq) as min_seq, max(seq) as max_seq, status from (
              select startData.*, sum(startflag) over (partition by pallet_id order by seq) as grp from (
              select * from temp_invHistory s
              ) startData
            ) endData
            group by pallet_id, grp, status, packing_type
            order by pallet_id, min_seq
          ) grp
          inner join temp_invHistory ivh on ivh.pallet_id = grp.pallet_id and ivh.seq = grp.min_seq 
        )
        `
        )

        const result: any = await trxMgr.query(
        ` 
        select monthDays.created_at, order_no, order_ref_no, do_ref_no,
        coalesce(carton,0) as carton, 
        coalesce(bag,0) as bag, 
        coalesce(basket,0) as basket, 
        coalesce(pallet,0) as pallet,
        sum(carton_running_total + carton) over (order by monthDays.created_at, src.rn) as carton_running_total, 
        sum(bag_running_total + bag) over (order by monthDays.created_at, src.rn) as bag_running_total, 
        sum(basket_running_total + basket) over (order by monthDays.created_at, src.rn) as basket_running_total, 
        sum(pallet_running_total + pallet) over (order by monthDays.created_at, src.rn) as pallet_running_total
        from (select generate_series((date '${month}')::timestamp, date_trunc('month',(date '${month}')::timestamp) + '1 month' - '1 day'::interval, interval '1 day')::date as created_at) monthDays
        left join (
          select 0 as rn, loose.*, pallet.pallet, pallet.pallet_running_total from (
            select (date '${month}')::timestamp as created_at, 'NA' as order_no, 'NA' as order_ref_no, 'NA' as do_ref_no, 
            0 as carton, 0 as bag, 0 as basket,
            coalesce(sum(case when packing_type = 'CARTON' then qty else 0 end),0) as carton_running_total, 
            coalesce(sum(case when packing_type = 'BAG' then qty else 0 end),0) as bag_running_total, 
            coalesce(sum(case when packing_type = 'BASKET' then qty else 0 end),0) as basket_running_total
            from temp_invHistory
            where created_at < (date '${month}')::timestamp and qty <> 0
          ) loose
          left join (
            select (date '${month}')::timestamp as created_at,
            0 as pallet,
            coalesce(sum(case when status = 'STORED' then 1 else -1 end),0) as pallet_running_total
            from temp_invByPallet ivp
            where started_at < (date '${month}')::timestamp
          ) pallet on pallet.created_at = loose.created_at
          union
          select row_number() over (order by loose.created_at) as rn,
          loose.*, pallet.pallet, pallet.pallet_running_total from (
            select MIN(created_at) as created_at, order_no, order_ref_no, do_ref_no,
            sum(case when packing_type = 'CARTON' then qty else 0 end) as carton, 
            sum(case when packing_type = 'BAG' then qty else 0 end) as bag, 
            sum(case when packing_type = 'BASKET' then qty else 0 end) as basket,
            0 as carton_running_total, 0 as bag_running_total, 0 as basket_running_total
            from temp_invHistory 
            where created_at >= (date '${month}')::timestamp and qty <> 0
            group by created_at::date, order_no, order_ref_no, do_ref_no
            order by created_at
          ) loose
          left join (
            select MIN(started_at) as created_at, order_no, order_ref_no, do_ref_no,
            sum(case when status = 'STORED' then 1 else -1 end) as pallet, 
            0 as pallet_running_total
            from temp_invByPallet ivp
            where started_at >= (date '${month}')::timestamp
            group by started_at::date, order_no, order_ref_no, do_ref_no
          ) pallet on pallet.created_at::date = loose.created_at::date and pallet.order_no = loose.order_no
          order by rn
        ) as src on src.created_at::date = monthDays.created_at::date 
        order by monthDays.created_at, src.rn
        `
        )

        trxMgr.query(
        `
          drop table temp_invHistory, temp_invByPallet
        `)

        let items = result.map(itm => {
          return {
            bag: itm.bag,
            bizplace: bizplace,
            bagRunningTotal: itm.bag_running_total,
            basket: itm.basket,
            basketRunningTotal: itm.basket_running_total,
            carton: itm.carton,
            cartonRunningTotal: itm.carton_running_total,
            createdAt: itm.created_at,
            doRefNo: itm.do_ref_no,
            orderNo: itm.order_no,
            orderRefNo: itm.order_ref_no,
            pallet:itm.pallet,
            palletRunningTotal: itm.pallet_running_total
          }
        })

        return { items , total: items.length}
      })
    } catch (error) {
      throw error
    }
  }
}
