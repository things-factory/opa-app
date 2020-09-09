import { Attachment, createAttachments } from '@things-factory/attachment-base'
import { User } from '@things-factory/auth-base'
import { Bizplace, getMyBizplace } from '@things-factory/biz-base'
import { Product } from '@things-factory/product-base'
import { Inventory } from '@things-factory/warehouse-base'
import { Worksheet, WorksheetDetail, WORKSHEET_TYPE, WORKSHEET_STATUS } from '@things-factory/worksheet-base'
import { getManager } from 'typeorm'
import {
  ORDER_STATUS,
  ORDER_INVENTORY_STATUS,
  OrderInventory,
  ReleaseGood,
  OrderNoGenerator
} from '@things-factory/sales-base'

export const addReleaseGoodProducts = {
  async addReleaseGoodProducts(_: any, { name, orderInventories }, context: any) {
    return await getManager().transaction(async trxMgr => {
      const domain = context.state.domain
      const user: User = context.state.user
      const bizplace: Bizplace = await getMyBizplace(user)

      let releaseGood: ReleaseGood = await trxMgr.getRepository(ReleaseGood).findOne({
        where: { domain, bizplace, name: name }
      })

      let worksheet: Worksheet = await trxMgr.getRepository(Worksheet).findOne({
        where: { releaseGood }
      })

      for (let oi of orderInventories) {
        let newOrderInv: OrderInventory = Object.assign({}, oi)
        newOrderInv.domain = domain
        newOrderInv.bizplace = bizplace
        newOrderInv.status = ORDER_INVENTORY_STATUS.PENDING
        newOrderInv.name = OrderNoGenerator.orderInventory()
        newOrderInv.releaseGood = releaseGood
        newOrderInv.product = await trxMgr.getRepository(Product).findOne(oi.product.id)
        newOrderInv.creator = user
        newOrderInv.updater = user

        let existingOrderInv: OrderInventory

        if (newOrderInv.inventory?.id) {
          const foundInv: Inventory = await trxMgr.getRepository(Inventory).findOne(newOrderInv.inventory.id)
          newOrderInv.inventory = foundInv

          existingOrderInv = await trxMgr.getRepository(OrderInventory).findOne({
            where: {
              releaseGood,
              product: newOrderInv.product,
              batchId: newOrderInv.batchId,
              packingType: newOrderInv.packingType,
              inventory: foundInv
            }
          })

          foundInv.lockedQty = Number(foundInv.lockedQty) + newOrderInv.releaseQty
          foundInv.lockedWeight = Number(foundInv.lockedWeight) + newOrderInv.releaseWeight
          foundInv.updater = user

          await trxMgr.getRepository(Inventory).save(foundInv)
        } else {
          existingOrderInv = await trxMgr.getRepository(OrderInventory).findOne({
            where: {
              releaseGood,
              product: newOrderInv.product,
              batchId: newOrderInv.batchId,
              packingType: newOrderInv.packingType
            }
          })
        }

        if (existingOrderInv) {
          newOrderInv = {
            ...existingOrderInv,
            releaseQty: existingOrderInv.releaseQty + newOrderInv.releaseQty,
            releaseWeight: existingOrderInv.releaseWeight + newOrderInv.releaseWeight
          }

          let existingWorksheetDetail: WorksheetDetail = await trxMgr.getRepository(WorksheetDetail).findOne({
            where: {
              worksheet,
              type: WORKSHEET_TYPE.PICKING,
              targetInventory: existingOrderInv
            }
          })

          if (existingWorksheetDetail) {
            existingWorksheetDetail = {
              ...existingWorksheetDetail,
              status: WORKSHEET_STATUS.EXECUTING
            }

            await trxMgr.getRepository(WorksheetDetail).save(existingWorksheetDetail)
          }
        }

        await trxMgr.getRepository(OrderInventory).save(newOrderInv)
      }

      releaseGood = {
        ...releaseGood,
        status: releaseGood.status == ORDER_STATUS.PENDING ? ORDER_STATUS.PENDING : ORDER_STATUS.PENDING_RECEIVE
      }

      await trxMgr.getRepository(ReleaseGood).save(releaseGood)

      if (worksheet) {
        worksheet = {
          ...worksheet,
          status: WORKSHEET_STATUS.PENDING_ADJUSTMENT
        }

        await trxMgr.getRepository(Worksheet).save(worksheet)
      }
    })
  }
}
