import { convertListParams, ListParam } from '@things-factory/shell'
import { getManager, EntityManager, getRepository } from 'typeorm'
import { User } from '@things-factory/auth-base'
import { Bizplace, BizplaceUser } from '@things-factory/biz-base'
import { InventoryHistory } from '@things-factory/warehouse-base'
export const elcclInventoryHistoryReport = {
  async elcclInventoryHistoryReport(_: any, params: ListParam, context: any) {
    try {
      // const convertedParams = convertListParams(params)
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

      let fromDate = params.filters.find(data => data.name === 'fromDate')
      let toDate = params.filters.find(data => data.name === 'toDate')
      let batchNo = params.filters.find(data => data.name === 'batch_no')
      let product = params.filters.find(data => data.name === 'product')

      if (!bizplaceFilter || !fromDate || !toDate) throw 'Invalid input'

      const bizplace: Bizplace = await getRepository(Bizplace).findOne({
        id: bizplaceFilter.value
      })

      let batchNoQuery = ''
      if (batchNo) {
        batchNoQuery =
          'AND invh.batch_id ILIKE ANY(ARRAY[' +
          batchNo.value
            .split(',')
            .map(prod => {
              return "'%" + prod.trim().replace(/'/g, "''") + "%'"
            })
            .join(',') +
          '])'
      }

      let productQuery = ''
      if (product) {
        let productValue =
          product.value
            .split(',')
            .map(prod => {
              return "'%" + prod.trim().replace(/'/g, "''") + "%'"
            })
            .join(',') + ']) '
        productQuery =
          'AND prd.name ILIKE ANY(ARRAY[' +
          productValue +
          'OR prd.sku ILIKE ANY(ARRAY[' +
          productValue +
          'OR prd.description ILIKE ANY(ARRAY[' +
          productValue
      }

      return await getManager().transaction(async (trxMgr: EntityManager) => {
        await trxMgr.query(
          `
          create temp table temp_data_src AS
          (
            SELECT prd.name AS product_name, prd.description AS product_description, trim(invh.batch_id) as batch_id, invh.product_id,
            invh.packing_type, invh.bizplace_id, invh.domain_id,
            invh.ref_order_id, invh.order_no, invh.order_ref_no, invh.transaction_type, invh.created_at,
            invh.qty, invh.opening_qty, invh.weight, invh.opening_weight
            FROM reduced_inventory_histories invh
            INNER JOIN products prd ON cast(prd.id AS VARCHAR) = invh.product_id
            WHERE invh.domain_id = $1
            AND invh.bizplace_id = $2
            AND invh.created_at <= $3
            ${batchNoQuery}
            ${productQuery}
          ) 
        `,
          [context.state.domain.id, bizplace.id, toDate.value]
        )

        await trxMgr.query(
          `
          create temp table temp_inv_history as (
            SELECT src.product_name, src.product_description, src.batch_id, src.product_id, src.packing_type, 
            src.bizplace_id, src.domain_id,
            SUM(COALESCE(invh.qty,0)) AS qty,
            0 AS opening_qty,
            SUM(COALESCE(invh.weight,0)) AS weight,
            0 AS opening_weight,
            'Opening Balance' AS order_name,
            '-' AS ref_no,
            0 AS rn,
            $1 AS created_at
            FROM (
              SELECT src.product_name, src.product_description, src.batch_id, src.product_id, src.packing_type, src.bizplace_id, 
              src.domain_id
              FROM temp_data_src src
              GROUP BY src.product_name, src.product_description, src.batch_id, src.product_id, src.packing_type, src.bizplace_id, 
              src.domain_id
            ) AS src 
            LEFT JOIN inventory_histories invh ON src.batch_id = trim(invh.batch_id) AND 
            src.product_id = invh.product_id AND 
            src.packing_type = invh.packing_type AND 
            src.bizplace_id = invh.bizplace_id AND 
            src.domain_id = invh.domain_id AND
            invh.created_at < $1::timestamp AND
            invh.transaction_type IN ('NEW', 'ADJUSTMENT', 'UNLOADING', 'PICKING', 'LOADING', 'UNDO_UNLOADING', 'CANCEL_ORDER', 'RETURN')
            GROUP BY src.product_name, src.product_description, src.batch_id, src.product_id, src.packing_type, src.bizplace_id, 
            src.domain_id
            UNION ALL
            SELECT product_name, product_description, batch_id, product_id, packing_type, bizplace_id, 
            domain_id, sum(qty) as qty, sum(opening_qty) as qty, sum(weight) as qty, sum(opening_weight) as qty, order_name, ref_no, rn, MIN(created_at) as created_at
            FROM (
              SELECT invh.product_name, invh.product_description, invh.batch_id, invh.product_id, invh.packing_type, invh.bizplace_id, 
              invh.domain_id,
              invh.qty, invh.opening_qty,	invh.weight, invh.opening_weight,
              CASE WHEN invh.transaction_type = 'ADJUSTMENT' THEN 'ADJUSTMENT'
                WHEN invh.transaction_type = 'NEW' THEN 'NEW'
                ELSE COALESCE(order_no, '-') END AS order_name,
              CASE WHEN invh.transaction_type = 'ADJUSTMENT' THEN 'ADJUSTMENT' 
                WHEN invh.transaction_type = 'NEW' THEN 'NEW'
                ELSE COALESCE(order_ref_no, '-') END AS ref_no,
              1 AS rn, invh.created_at
              FROM temp_data_src invh
              LEFT JOIN arrival_notices arrNo ON cast(arrNo.id AS VARCHAR) = invh.ref_order_id AND (invh.transaction_type = 'UNLOADING' OR 
                invh.transaction_type = 'UNDO_UNLOADING')
              LEFT JOIN worksheets wks ON cast(wks.id AS VARCHAR) = invh.ref_order_id AND invh.transaction_type = 'PICKING'
              LEFT JOIN release_goods rel ON cast(rel.id AS VARCHAR) = cast(wks.release_good_id AS VARCHAR) AND 
                invh.transaction_type = 'PICKING'
              WHERE (invh.qty <> 0 OR invh.weight <> 0)
              AND invh.created_at BETWEEN $1::timestamp AND $2::timestamp
            ) AS inv_movement 
            GROUP BY product_name, product_description, batch_id, product_id, packing_type, bizplace_id, 
            domain_id, order_name, ref_no, rn
          )`,
          [fromDate.value, toDate.value]
        )

        const result: any = await trxMgr.query(
          ` 
          select product_name, product_description, batch_id, product_id, packing_type, bizplace_id, 
          domain_id, qty, opening_qty, weight, opening_weight, order_name, ref_no, created_at::date
          from temp_inv_history invh where
          exists (
            select * from (
              select batch_id, product_name, packing_type, sum(qty) as totalQty, count(*) as totalRow from temp_inv_history ih2 group by batch_id, product_name, packing_type
              ) src where src.batch_id = invh.batch_id and src.product_name = invh.product_name and src.packing_type = invh.packing_type and (src.totalRow > 1 or src.totalQty <> 0)
          )
          ORDER BY invh.batch_id asc, invh.product_name asc, invh.product_description asc, invh.packing_type asc, invh.rn asc, invh.created_at asc
        `
        )

        trxMgr.query(
          `
          drop table temp_data_src, temp_inv_history
        `
        )

        let items = result.map(itm => {
          return {
            batchId: itm.batch_id,
            packingType: itm.packing_type,
            product: {
              id: itm.product_id,
              name: itm.product_name,
              description: itm.product_description
            },
            refNo: itm.ref_no,
            qty: itm.qty,
            weight: itm.weight,
            openingQty: itm.opening_qty,
            openingWeight: itm.opening_weight,
            orderName: itm.order_name,
            createdAt: itm.created_at
          }
        })

        return items
      })
    } catch (error) {
      throw error
    }
  }
}
