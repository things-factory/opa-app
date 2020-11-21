import { Attachment, createAttachments } from '@things-factory/attachment-base'
import { Domain } from '@things-factory/shell'
import { User } from '@things-factory/auth-base'
import { Bizplace, getMyBizplace } from '@things-factory/biz-base'
import { Product } from '@things-factory/product-base'
import { Inventory, InventoryHistory, INVENTORY_TRANSACTION_TYPE } from '@things-factory/warehouse-base'
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
  async addReleaseGoodProducts(_: any, { name, orderInventories, existingOrderInventories }, context: any) {
    try {
      return await getManager().transaction(async trxMgr => {
        const domain = context.state.domain
        const user: User = context.state.user

        let releaseGood: ReleaseGood = await trxMgr.getRepository(ReleaseGood).findOne({
          where: { domain, name: name },
          relations: ['bizplace']
        })

        const bizplace: Bizplace = releaseGood.bizplace

        let pickingWorksheet: Worksheet = await trxMgr.getRepository(Worksheet).findOne({
          where: { releaseGood, type: WORKSHEET_TYPE.PICKING }
        })

        let loadingWorksheet: Worksheet = await trxMgr.getRepository(Worksheet).findOne({
          where: { releaseGood, type: WORKSHEET_TYPE.LOADING }
        })

        if (existingOrderInventories) {
          for (let oi of existingOrderInventories) {
            // map input to OrderInventory Object
            let curOrderInv: OrderInventory = Object.assign({}, oi)
            curOrderInv.domain = domain
            curOrderInv.bizplace = bizplace
            curOrderInv.releaseGood = releaseGood
            curOrderInv.product = await trxMgr.getRepository(Product).findOne(oi.product.id)

            let existingOrderInv: OrderInventory

            if (curOrderInv?.inventory?.id) {
              const foundInv: Inventory = await trxMgr.getRepository(Inventory).findOne(curOrderInv.inventory.id)
              curOrderInv.inventory = foundInv

              let foundPickingHistory: InventoryHistory = await trxMgr.getRepository(InventoryHistory).findOne({
                where: {
                  refOrderId: releaseGood.id,
                  palletId: foundInv.palletId,
                  transactionType: INVENTORY_TRANSACTION_TYPE.PICKING
                }
              })

              if (foundPickingHistory) {
                let pickedQty = Number(foundPickingHistory.qty.toString().replace('-', ''))

                if (curOrderInv.releaseQty < pickedQty)
                  throw new Error(`${foundPickingHistory.palletId} has picked ${pickedQty}`)
              }

              existingOrderInv = await trxMgr.getRepository(OrderInventory).findOne({
                where: {
                  releaseGood,
                  product: curOrderInv.product,
                  batchId: curOrderInv.batchId,
                  packingType: curOrderInv.packingType,
                  inventory: foundInv
                }
              })

              if (curOrderInv.releaseQty === 0) {
                foundInv.lockedQty = Number(foundInv.lockedQty) - Number(existingOrderInv.releaseQty)
                foundInv.lockedUomValue = Number(foundInv.lockedUomValue) - Number(existingOrderInv.releaseUomValue)

                await trxMgr.getRepository(Inventory).save(foundInv)

                if (existingOrderInv) {
                  // if found existing OrderInventory and worksheetDetail then qty, uomValue, and status are updated
                  curOrderInv = {
                    ...existingOrderInv,
                    releaseQty: curOrderInv.releaseQty,
                    lockedUomValue: curOrderInv.lockedUomValue,
                    status: ORDER_INVENTORY_STATUS.CANCELLED
                  }

                  let existingWorksheetDetail: WorksheetDetail = await trxMgr.getRepository(WorksheetDetail).findOne({
                    where: {
                      pickingWorksheet,
                      type: WORKSHEET_TYPE.PICKING,
                      targetInventory: curOrderInv
                    }
                  })

                  existingWorksheetDetail = {
                    ...existingWorksheetDetail,
                    status: WORKSHEET_STATUS.CANCELLED
                  }
                  await trxMgr.getRepository(WorksheetDetail).save(existingWorksheetDetail)
                  await trxMgr.getRepository(OrderInventory).save(curOrderInv)
                }
              } else {
                foundInv.lockedQty = Number(curOrderInv.releaseQty)
                foundInv.lockedUomValue = Number(curOrderInv.releaseUomValue)
                foundInv.updater = user

                await trxMgr.getRepository(Inventory).save(foundInv)

                if (existingOrderInv) {
                  // if found existing OrderInventory and worksheetDetail then qty, uomValue, and status are updated
                  curOrderInv = {
                    ...existingOrderInv,
                    releaseQty: curOrderInv.releaseQty,
                    releaseUomValue: curOrderInv.releaseUomValue
                  }

                  let existingWorksheetDetail: WorksheetDetail = await trxMgr.getRepository(WorksheetDetail).findOne({
                    where: {
                      pickingWorksheet,
                      type: WORKSHEET_TYPE.PICKING,
                      targetInventory: existingOrderInv
                    }
                  })

                  if (existingWorksheetDetail) {
                    if (curOrderInv.releaseQty != existingOrderInv.releaseQty) {
                      existingWorksheetDetail = {
                        ...existingWorksheetDetail,
                        status: WORKSHEET_STATUS.DEACTIVATED
                      }

                      await trxMgr.getRepository(WorksheetDetail).save(existingWorksheetDetail)
                    }
                  }

                  await trxMgr.getRepository(OrderInventory).save(curOrderInv)
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
            }
          }
        }

        if (orderInventories) {
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
              // if release by inventory, then quantity and uomValue values are updated
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
              foundInv.lockedUomValue = Number(foundInv.lockedUomValue) + newOrderInv.releaseUomValue
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
              // if found existing OrderInventory and worksheetDetail then qty, uomValue, and status are updated
              newOrderInv = {
                ...existingOrderInv,
                releaseQty: existingOrderInv.releaseQty + newOrderInv.releaseQty,
                releaseUomValue: existingOrderInv.releaseUomValue + newOrderInv.releaseUomValue,
                status:
                  existingOrderInv.status === ORDER_INVENTORY_STATUS.CANCELLED
                    ? pickingWorksheet
                      ? ORDER_INVENTORY_STATUS.PICKING
                      : ORDER_INVENTORY_STATUS.PENDING
                    : existingOrderInv.status
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

            if (pickingWorksheet) {
              // if has picking worksheet, status will be deactivated to prevent any action from warehouse operator until office admin has confirmation
              pickingWorksheet = {
                ...pickingWorksheet,
                status: WORKSHEET_STATUS.DEACTIVATED
              }

              let savedOrderInv: OrderInventory = new OrderInventory()
              savedOrderInv.name = newOrderInv.name
              savedOrderInv.type = newOrderInv.type
              savedOrderInv.releaseQty = newOrderInv.releaseQty
              savedOrderInv.releaseUomValue = newOrderInv.releaseUomValue
              savedOrderInv.inventory = newOrderInv.inventory
              savedOrderInv.status = newOrderInv.status
              savedOrderInv.releaseGood = newOrderInv.releaseGood
              savedOrderInv.bizplace = newOrderInv.bizplace
              savedOrderInv.domain = domain
              savedOrderInv.creator = user
              savedOrderInv.updater = user
              savedOrderInv = await trxMgr.getRepository(OrderInventory).save(savedOrderInv)

              if (!existingOrderInv && pickingWorksheet) {
                // if this is a new orderInventory and has existing worksheet then generate a new worksheet detail for it
                await generatePickingWorksheetDetail(trxMgr, domain, user, pickingWorksheet, savedOrderInv)
              }
            }
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
