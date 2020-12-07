import { ListParam } from '@things-factory/shell'
import { getManager, EntityManager, getRepository } from 'typeorm'
import { User } from '@things-factory/auth-base'
import { Bizplace, BizplaceUser } from '@things-factory/biz-base'
import { InventoryHistory } from '@things-factory/warehouse-base'

export const elcclInventoryHistorySummaryReport = {
  async elcclInventoryHistorySummaryReport(_: any, params: ListParam, context: any) {
    try {
      let userFilter = params.filters.find(data => data.name === 'user')

      let balanceOnlyFilter = params.filters.find(data => data.name === 'balanceOnly')

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

      let fromDate = params.filters.find(data => data.name === 'fromDate')
      let toDate = params.filters.find(data => data.name === 'toDate')

      if (!bizplaceFilter || !fromDate || !toDate) throw 'Invalid input'

      const bizplace: Bizplace = await getRepository(Bizplace).findOne({
        id: bizplaceFilter.value
      })

      let balanceOnlyQuery = ''
      if (balanceOnlyFilter && balanceOnlyFilter.value) {
        balanceOnlyQuery = 'and (opening_qty + adjustment_qty + total_in_qty + total_out_qty) > 0 '
      }

      return await getManager().transaction(async (trxMgr: EntityManager) => {
        await trxMgr.query(
          `
          create temp table temp_inv_history as (
            select i2.pallet_id, i2.product_id, i2.packing_type, i2.batch_id,
            ih.id as inventory_history_id, ih.seq, ih.status, ih.transaction_type, ih.qty, ih.opening_qty, ih.uom_value, ih.opening_uom_value, ih.created_at,
            ih.ref_order_id::uuid as ref_order_id
            from inventories i2 
            inner join (
              select ih.* from reduced_inventory_histories ih
              where exists (
                select i2.pallet_id, i2.created_at 
                  from inventories i2 
                  where 
                  i2.domain_id = $1
                  and i2.bizplace_id = $2
                  and i2.id = ih.inventory_id
              )
              and ih.created_at < $3
              and ih.qty <> 0
            ) ih on ih.inventory_id  = i2.id
          )
        `,
          [context.state.domain.id, bizplace.id, toDate.value]
        )

        await trxMgr.query(
          `
          create temp table temp_elccl_inventory_summary as (
            select src.*,
            opening_qty + adjustment_qty + total_in_qty + total_out_qty + total_return_qty as closing_qty,
            prd.name as product_name, prd.description as product_description 
            from (
              select ih.batch_id, ih.packing_type,
              min(ih.created_at) as initial_date,
              sum(case when (ih.transaction_type = 'UNLOADING' or ih.transaction_type = 'NEW') and rtn.id is null then qty else 0 end) as initial_qty,
              sum(case when ih.created_at > $1 and ih.transaction_type = 'ADJUSTMENT' then ih.qty else 0 end) as adjustment_qty,
              sum(case when ih.created_at < $1 then ih.qty else 0 end) as opening_qty,
              sum(case when ih.created_at > $1 then case when ih.qty > 0 and ih.transaction_type <> 'ADJUSTMENT' and rtn.id is null then ih.qty else 0 end else 0 end) as total_in_qty,
              sum(case when ih.created_at > $1 then case when ih.qty < 0 and ih.transaction_type <> 'ADJUSTMENT' then ih.qty else 0 end else 0 end) as total_out_qty,
              ih.product_id,
              sum(case when rtn.id is not null then qty else 0 end) as total_return_qty
              from temp_inv_history ih
              left join return_orders rtn on rtn.id = ih.ref_order_id
              group by ih.batch_id, ih.product_id, ih.packing_type
              order by batch_id
            ) src
            inner join products prd on prd.id = src.product_id
            where (opening_qty > 0 or total_in_qty > 0)
            ${balanceOnlyQuery}
          )
        `,
          [fromDate.value]
        )

        const total: any = await trxMgr.query(`select count(*) from temp_elccl_inventory_summary`)

        const result: any = await trxMgr.query(
          ` 
          select * from temp_elccl_inventory_summary ORDER BY initial_date OFFSET $1 LIMIT $2
        `,
          [(params.pagination.page - 1) * params.pagination.limit, params.pagination.limit]
        )

        trxMgr.query(`
          drop table temp_inv_history, temp_elccl_inventory_summary
        `)

        let items = result.map(itm => {
          return {
            ...itm,
            batchId: itm.batch_id,
            packingType: itm.packing_type,
            openingQty: itm.opening_qty,
            adjustmentQty: itm.adjustment_qty,
            closingQty: itm.closing_qty,
            totalInQty: itm.total_in_qty,
            totalOutQty: itm.total_out_qty,
            totalReturnQty: itm.total_return_qty,
            initialQty: itm.initial_qty,
            initialDate: itm.initial_date,
            product: {
              id: itm.product_id,
              name: itm.product_name,
              description: itm.product_description
            }
          }
        })

        return { items, total: total[0].count }
      })
    } catch (error) {
      throw error
    }
  }
}
