import { Attachment, createAttachments } from '@things-factory/attachment-base'
import { Domain } from '@things-factory/shell'
import { User } from '@things-factory/auth-base'
import { Bizplace, getMyBizplace } from '@things-factory/biz-base'
import { Product } from '@things-factory/product-base'
import { Inventory } from '@things-factory/warehouse-base'
import {
  Worksheet,
  WorksheetDetail,
  WORKSHEET_TYPE,
  WORKSHEET_STATUS,
  generatePickingWorksheetDetail
} from '@things-factory/worksheet-base'
import { getManager, In } from 'typeorm'
import {
  ORDER_STATUS,
  ORDER_INVENTORY_STATUS,
  OrderInventory,
  ReleaseGood,
  OrderNoGenerator
} from '@things-factory/sales-base'

export const addReleaseGoodProducts = {
  async addReleaseGoodProducts(_: any, { name, orderInventories }, context: any) {
    try {
      return await getManager().transaction(async trxMgr => {
        const { domain, user }: { domain: Domain; user: User } = context.state

        let releaseGood: ReleaseGood = await trxMgr.getRepository(ReleaseGood).findOne({
          where: {
            domain,
            name: name,
            status: In([ORDER_STATUS.READY_TO_PICK, ORDER_STATUS.PICKING, ORDER_STATUS.LOADING])
          },
          relations: ['bizplace']
        })
        if (!releaseGood) throw new Error('Order not found.')

        const bizplace: Bizplace = releaseGood.bizplace

        let pickingWorksheet: Worksheet = await trxMgr.getRepository(Worksheet).findOne({
          where: { releaseGood, type: WORKSHEET_TYPE.PICKING }
        })

        let loadingWorksheet: Worksheet = await trxMgr.getRepository(Worksheet).findOne({
          where: { releaseGood, type: WORKSHEET_TYPE.LOADING }
        })

        for (let oi of orderInventories) {
          // map input to OrderInventory Object
          let newOrderInv: OrderInventory = Object.assign({}, oi)
          newOrderInv.domain = domain
          newOrderInv.bizplace = bizplace
          newOrderInv.status = pickingWorksheet ? ORDER_INVENTORY_STATUS.PICKING : ORDER_INVENTORY_STATUS.PENDING
          newOrderInv.name = OrderNoGenerator.orderInventory()
          newOrderInv.releaseGood = releaseGood
          newOrderInv.product = await trxMgr.getRepository(Product).findOne(oi.product.id)
          newOrderInv.creator = user
          newOrderInv.updater = user

          let existingOrderInv: OrderInventory

          // check if it is release by inventory (has inventory value) or product
          if (newOrderInv.inventory?.id) {
            // if release by inventory, then quantity and weight values are updated
            const foundInv: Inventory = await trxMgr.getRepository(Inventory).findOne(newOrderInv.inventory.id)
            newOrderInv.inventory = foundInv

            // check for existing released OrderInventory specifying product, batchId, packingType, and inventory
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
            // check for existing released OrderInventory specifying product, batchId and packingType
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
            // if found exisiting OrderInventory and worksheetDetail then qty, weight, and status are updated
            newOrderInv = {
              ...existingOrderInv,
              releaseQty: existingOrderInv.releaseQty + newOrderInv.releaseQty,
              releaseWeight: existingOrderInv.releaseWeight + newOrderInv.releaseWeight
            }

            let existingWorksheetDetail: WorksheetDetail = await trxMgr.getRepository(WorksheetDetail).findOne({
              where: {
                pickingWorksheet,
                type: WORKSHEET_TYPE.PICKING,
                targetInventory: existingOrderInv
              }
            })

            if (existingWorksheetDetail) {
              existingWorksheetDetail = {
                ...existingWorksheetDetail,
                status: WORKSHEET_STATUS.DEACTIVATED
              }

              await trxMgr.getRepository(WorksheetDetail).save(existingWorksheetDetail)
            }
          }

          newOrderInv = await trxMgr.getRepository(OrderInventory).save(newOrderInv)

          let curOrderInventories: OrderInventory[] = await trxMgr.getRepository(OrderInventory).find({
            where: {
              releaseGood
            },
            relations: ['bizplace']
          })

          let savedOrderInv: OrderInventory = curOrderInventories
            .filter(curOrderInventory => curOrderInventory.name == newOrderInv.name)
            .map((curOrderInventory: OrderInventory) => {
              return curOrderInventory
            })

          if (!existingOrderInv && pickingWorksheet) {
            // if this is a new orderInventory and has existing worksheet then generate a new worksheet detail for it
            await generatePickingWorksheetDetail(trxMgr, domain, user, pickingWorksheet, savedOrderInv[0])
          }
        }

        if (pickingWorksheet) {
          // if has picking worksheet, status will be deactivated to prevent any action from warehouse operator until office admin has confirmation
          pickingWorksheet = {
            ...pickingWorksheet,
            status: WORKSHEET_STATUS.DEACTIVATED
          }

          await trxMgr.getRepository(Worksheet).save(pickingWorksheet)
        }

        if (loadingWorksheet) {
          // if has loading worksheet, status will be deactivated to prevent any action from warehouse operator until office admin has confirmation
          loadingWorksheet = {
            ...loadingWorksheet,
            status: WORKSHEET_STATUS.DEACTIVATED
          }

          await trxMgr.getRepository(Worksheet).save(loadingWorksheet)
        }
      })
    } catch (error) {
      throw error
    }
  }
}
