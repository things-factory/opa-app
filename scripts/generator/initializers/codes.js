const codes = [
  {
    name: 'COUNTRY_CODE',
    description: 'country code',
    details: [
      { name: 'MY', description: 'Malaysia' },
      { name: 'ZH', description: 'China' }
    ]
  },
  {
    name: 'CURRENCY_TYPES',
    description: 'currency types',
    details: [
      {
        name: 'RM',
        description: 'Malaysia Ringgit'
      },
      { name: 'RMB', description: 'Renmimbi' },
      { name: 'SGD', description: 'Singapore Dollar' },
      { name: 'IDR', description: 'Indonesia Rupiah' }
    ]
  },
  {
    name: 'LOCATION_TYPE',
    description: 'Location type',
    details: [
      { name: 'BUFFER', description: 'buffer_location' },
      { name: 'SHELF', description: 'shelf' }
    ]
  },
  {
    name: 'ORDER_PRODUCT_STATUS',
    description: 'Order Product status',
    details: [
      { name: 'PENDING', description: 'product_status_pending' },
      { name: 'INTRANSIT', description: 'product_status_intransit' },
      { name: 'ARRIVED', description: 'product_status_arrived' },
      { name: 'UNLOADING', description: 'product_status_unloading' },
      { name: 'UNLOADED', description: 'product_status_unloaded' },
      { name: 'PUTTING AWAY', description: 'product_status_putting_away' },
      { name: 'STORED', description: 'product_status_stored' }
    ]
  },
  {
    name: 'ORDER_STATUS',
    description: 'Order status',
    details: [
      { name: 'PENDING', description: 'order_status_pending' },
      { name: 'EDITING', description: 'order_status_editing' },
      { name: 'PENDING_RECEIVE', description: 'order_status_pending_receive' },
      { name: 'INTRANSIT', description: 'order_status_intransit' },
      { name: 'ARRIVED', description: 'order_status_arrived' },
      { name: 'PROCESSING', description: 'order_status_processing' },
      { name: 'DONE', description: 'order_status_done' }
    ]
  },
  {
    name: 'PACKING_TYPES',
    description: 'Types of packing',
    details: [
      { name: 'CORRUGATED_BOX', description: 'Corrugated box packing' },
      { name: 'CARTON', description: 'Carton packing' },
      { name: 'DRUM', description: 'Drum packing' },
      { name: 'BOTTLE', description: 'Bottle packing' },
      { name: 'BAG', description: 'Bag packing' },
      { name: 'SACK', description: 'Sack packing' },
      { name: 'BOXBOARD', description: 'Boxboard packing' },
      { name: 'CAN', description: 'Can packing' }
    ]
  },
  {
    name: 'SETTING_CATEGORIES',
    description: 'setting categories',
    details: [
      {
        name: 'board',
        description: 'board id'
      }
    ]
  },
  {
    name: 'TRANSPORT_TYPES',
    description: 'Types of transport',
    details: [
      { name: 'DELIVERY', description: 'Provide delivery service' },
      { name: 'COLLECTION', description: 'Provide collection service' }
    ]
  },
  {
    name: 'USER_TYPES',
    description: 'user types',
    details: [
      { name: 'SYSTEM ADMIN', description: 'System Administrator' },
      { name: 'W/H MANAGER', description: 'Warehouse Manager' },
      { name: 'OFFICE ADMIN', description: 'Office Administrator' },
      { name: 'CUSTOMER', description: 'Customer' },
      { name: 'OWNER', description: 'Business Owner' },
      { name: 'W/H SUPERVISOR', description: 'Warehouse Supervisor' },
      { name: 'ADMIN', description: 'Admin' }
    ]
  },
  {
    name: 'WAREHOUSE_TYPES',
    description: 'warehouse types',
    details: [
      { name: 'BUFFER', description: 'Buffer location' },
      { name: 'SHELF', description: 'Shelf location' }
    ]
  },
  {
    name: 'WEIGHT_UNITS',
    description: 'Unit for weight',
    details: [
      { name: 'kg', description: 'kilogram' },
      { name: 't', description: 'ton' }
    ]
  },
  {
    name: 'WORKSHEET_STATUS',
    description: 'worksheet status',
    details: [
      { name: 'DEACTIVATED', description: 'deactivated' },
      { name: 'EXECUTING', description: 'executing' },
      { name: 'DONE', description: 'done' }
    ]
  }
]

module.exports = async function initCodes(trxMgr, domain) {
  const { CommonCode, CommonCodeDetail } = require('@things-factory/code-base')
  const codeRepo = trxMgr.getRepository(CommonCode)
  const codeDetailRepo = trxMgr.getRepository(CommonCodeDetail)

  await Promise.all(
    codes.map(async code => {
      const commonCode = await codeRepo.save({
        ...code,
        domain
      })

      await codeDetailRepo.save(
        commonCode.details.map((detail, idx) => {
          return {
            ...detail,
            domain,
            commonCode,
            rank: (idx + 1) * 10
          }
        })
      )
    })
  )
}
