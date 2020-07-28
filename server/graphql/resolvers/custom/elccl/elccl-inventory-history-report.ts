import { convertListParams, ListParam } from '@things-factory/shell'
import { getRepository } from 'typeorm'
import { User } from '@things-factory/auth-base'
import { Bizplace, BizplaceUser } from '@things-factory/biz-base'
import { InventoryHistory } from '../../../entities'
export const elcclInventoryHistoryReport = {
  async elcclInventoryHistoryReport(_: any, params: ListParam, context: any) {
    try {
      const convertedParams = convertListParams(params)
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
      let product = params.filters.find(data => data.name === 'product')

      if (!bizplaceFilter || !fromDate || !toDate) throw 'Invalid input'

      const bizplace: Bizplace = await getRepository(Bizplace).findOne({
        id: bizplaceFilter.value
      })

      let productQuery = ''
      if (product) {
        productQuery =
          'AND prd.name ILIKE ANY(ARRAY[' +
          product.value
            .split(',')
            .map(prod => {
              return "'%" + prod.trim().replace(/'/g, "''") + "%'"
            })
            .join(',') +
          '])'
      }

      const result = await getRepository(InventoryHistory).query(`
        ;WITH dataSrc AS
        (
          SELECT prd.name AS product_name, prd.description AS product_description, invh.batch_id, invh.product_id, 
          invh.packing_type, invh.bizplace_id, invh.domain_id,
          invh.ref_order_id, invh.order_no, invh.order_ref_no, invh.transaction_type, invh.created_at,
          invh.qty, invh.opening_qty, invh.weight, invh.opening_weight
          FROM inventory_histories invh
          INNER JOIN products prd ON cast(prd.id AS VARCHAR) = invh.product_id
          WHERE
          invh.transaction_type IN ('NEW', 'ADJUSTMENT', 'UNLOADING', 'PICKING', 'LOADING', 'UNDO_UNLOADING', 'CANCEL_ORDER', 'RETURN')
          AND invh.domain_id = '${context.state.domain.id}'
          AND invh.bizplace_id = '${bizplace.id}'
          AND invh.created_at < '${new Date(toDate.value).toLocaleDateString()} 23:59:59'
          ${productQuery}
        )
        SELECT * FROM (
          SELECT src.product_name, src.product_description, src.batch_id, src.product_id, src.packing_type, 
          src.bizplace_id, src.domain_id,
          SUM(COALESCE(invh.qty,0)) AS qty,
          0 AS opening_qty,
          SUM(COALESCE(invh.weight,0)) AS weight,
          0 AS opening_weight,
          'Opening Balance' AS order_name,
          '-' AS ref_no,
          0 AS rn,
          to_timestamp('${new Date(
            fromDate.value
          ).toLocaleDateString()} 00:00:00', 'MM/DD/YYYY HH24:MI:SS') AS created_at
          FROM (
            SELECT src.product_name, src.product_description, src.batch_id, src.product_id, src.packing_type, src.bizplace_id, 
            src.domain_id
            FROM dataSrc src
            GROUP BY src.product_name, src.product_description, src.batch_id, src.product_id, src.packing_type, src.bizplace_id, 
            src.domain_id
          ) AS src 
          LEFT JOIN inventory_histories invh ON src.batch_id = invh.batch_id AND 
          src.product_id = invh.product_id AND 
          src.packing_type = invh.packing_type AND 
          src.bizplace_id = invh.bizplace_id AND 
          src.domain_id = invh.domain_id AND
          invh.created_at < '${new Date(fromDate.value).toLocaleDateString()} 00:00:00' AND
          invh.transaction_type IN ('NEW', 'ADJUSTMENT', 'UNLOADING', 'PICKING', 'LOADING', 'UNDO_UNLOADING', 'CANCEL_ORDER', 'RETURN')
          GROUP BY src.product_name, src.product_description, src.batch_id, src.product_id, src.packing_type, src.bizplace_id, 
          src.domain_id
          UNION ALL
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
          FROM dataSrc invh
          LEFT JOIN arrival_notices arrNo ON cast(arrNo.id AS VARCHAR) = invh.ref_order_id AND (invh.transaction_type = 'UNLOADING' OR 
            invh.transaction_type = 'UNDO_UNLOADING')
          LEFT JOIN worksheets wks ON cast(wks.id AS VARCHAR) = invh.ref_order_id AND invh.transaction_type = 'PICKING'
          LEFT JOIN release_goods rel ON cast(rel.id AS VARCHAR) = cast(wks.release_good_id AS VARCHAR) AND 
            invh.transaction_type = 'PICKING'
          WHERE (invh.qty <> 0 OR invh.weight <> 0)
          AND invh.created_at BETWEEN '${new Date(fromDate.value).toLocaleDateString()} 00:00:00'
            AND '${new Date(toDate.value).toLocaleDateString()} 23:59:59'
        ) AS reportData ORDER BY product_name asc, product_description asc, packing_type asc, batch_id asc, rn asc, created_at asc
      `)

      let items = result as any
      items = items.map(item => {
        return {
          batchId: item.batch_id,
          bizplace: bizplace,
          packingType: item.packing_type,
          product: { name: item.product_name + ' ( ' + item.product_description + ' )' },
          qty: item.qty,
          weight: item.weight,
          orderName: item.order_name,
          orderRefNo: item.ref_no,
          createdAt: item.created_at
        }
      })

      return items
    } catch (error) {
      throw error
    }
  }
}
