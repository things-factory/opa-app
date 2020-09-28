const codes = [
  {
      name: 'WORKSHEET_STATUS',
      description: 'worksheet status',
      details: [
          { name: 'EXECUTING', description: 'executing' },
          { name: 'DEACTIVATED', description: 'deactivated' },
          { name: 'DONE', description: 'done' }
      ]
  },
  {
      name: 'WAREHOUSE_TYPES',
      description: 'warehouse types',
      details: [
          { name: 'TYPE', description: 'type' }
      ]
  },
  {
      name: 'SETTING_CATEGORIES',
      description: 'Setting categories',
      details: [
          { name: 'id-rule', description: 'ID Rule' },
          { name: 'board', description: 'board ID' }
      ]
  },
  {
      name: 'GRN_STATUS',
      description: 'grn status',
      details: [
          { name: 'PENDING_PROCESS', description: 'executing' },
          { name: 'RECEIVED', description: 'received' },
          { name: 'SUBMITTED', description: 'submitted' }
      ]
  },
  {
      name: 'PACKING_TYPES',
      description: 'type of packing',
      details: [
          { name: 'PAIL', description: 'Pail packing' },
          { name: 'CRATES', description: 'crates packing' },
          { name: 'ROLL', description: 'Roll packing' },
          { name: 'CARBOY', description: 'Carboy packing' },
          { name: 'BOTTLE', description: 'Bottle packing' },
          { name: 'CAN', description: 'Can packing' },
          { name: 'CARTON', description: 'Carton packing' },
          { name: 'DRUM', description: 'Drum packing' },
          { name: 'SACK', description: 'Sack packing' },
          { name: 'PALLET', description: 'Pallet packing' },
          { name: 'BAG', description: 'Bag packing' },
          { name: 'BOX', description: 'Box packing' },
          { name: 'IBC', description: 'IBC packing' },
          { name: 'JBAG', description: 'Jbag packing' },
          { name: 'PACKAGING MATERIAL', description: 'Packaging material' },
          { name: 'PCS', description: 'Pcs packing' },
          { name: 'TIN', description: 'Tin packing' },
          { name: 'TOTE TANK', description: 'Tote Metal packing' },
          { name: 'UNIT', description: 'Unit packing' }
      ]
  },
  {
      name: 'LOCATION_FORMAT',
      description: 'format for location name',
      details: [
          { name: 'test format', description: 'Z1-R1-C1-A' },
          { name: 'AF format', description: '1-01-01-AF' },
          { name: 'standard format', description: '01-01-01-@' }
      ]
  },
  {
      name: 'TEMPLATE_TYPES',
      description: 'template type',
      details: [
          { name: 'DO_TEMPLATE', description: 'template for delivery order' },
          { name: 'LOGO', description: 'template for logo' },
          { name: 'GRN_TEMPLATE', description: 'template for goods received note' }
      ]
  },
  {
      name: 'ORDER_PRODUCT_STATUS',
      description: 'order product status',
      details: [
          { name: 'PENDING', description: 'product_status_pending' },
          { name: 'UNLOADED', description: 'product_status_unloaded' },
          { name: 'PUTTING AWAY', description: 'product_status_putting_away' },
          { name: 'ARRIVED', description: 'product_status_arrived' },
          { name: 'INTRANSIT', description: 'product_status_intransit' },
          { name: 'UNLOADING', description: 'product_status_unloading' },
          { name: 'STORED', description: 'product_status_stored' }
      ]
  },
  {
      name: 'COUNTRY_CODE',
      description: 'country code',
      details: [
          { name: '60', description: 'Malaysia' }
      ]
  },
  {
      name: 'TRANSPORT_TYPES',
      description: 'transport type',
      details: [
          { name: 'COLLECTION', description: 'Provide collection service' },
          { name: 'DELIVERY', description: 'Provide delivery service' }
      ]
  },
  {
      name: 'DELIVERY_STATUS',
      description: 'delivery order status',
      details: [
          { name: 'READY_TO_DISPATCH', description: 'ready_to_dispatch' },
          { name: 'DELIVERING', description: 'delivering' },
          { name: 'DONE', description: 'done' }
      ]
  },
  {
      name: 'LOAD_TYPES',
      description: 'load types',
      details: [
          { name: 'FCL', description: 'full_load_container' },
          { name: 'TAG_ALONG', description: 'tag_along_load' },
          { name: 'LCL', description: 'low_load_container' }
      ]
  },
  {
      name: 'RO_REQUESTS_STATUS',
      description: 'release order status',
      details: [
          { name: 'CANCELLED', description: 'order_status_cancelled' },
          { name: 'REJECTED', description: 'order_status_rejected' },
          { name: 'READY_TO_PICK', description: 'order_status_ready_to_pick' },
          { name: 'PICKING', description: 'order_status_picking' },
          { name: 'LOADING', description: 'order_status_loading' },
          { name: 'PARTIAL_RETURN', description: 'order_status_partial_return' },
          { name: 'PENDING_RECEIVE', description: 'order_status_pending_receive' },
          { name: 'PENDING_CANCEL', description: 'order_status_pending_cancel' },
          { name: 'DONE', description: 'order_status_done' }
      ]
  },
  {
      name: 'RO_LIST_STATUS',
      description: 'release order status',
      details: [
          { name: 'PENDING', description: 'order_status_pending' },
          { name: 'PENDING_CANCEL', description: 'order_status_pending_cancel' },
          { name: 'PENDING_RECEIVE', description: 'order_status_pending_receive' },
          { name: 'READY_TO_PICK', description: 'order_status_ready_to_pick' },
          { name: 'PICKING', description: 'order_status_picking' },
          { name: 'LOADING', description: 'order_status_loading' },
          { name: 'PARTIAL_RETURN', description: 'order_status_partial_return' },
          { name: 'CANCELLED', description: 'order_status_cancelled' },
          { name: 'DONE', description: 'order_status_done' },
          { name: 'REJECTED', description: 'order_status_rejected' }
      ]
  },
  {
      name: 'ORDER_STATUS',
      description: 'order status',
      details: [
          { name: 'ARRIVED', description: 'order_status_arrived' },
          { name: 'PROCESSING', description: 'order_status_processing' },
          { name: 'DONE', description: 'order_status_done' },
          { name: 'PENDING', description: 'order_status_pending' },
          { name: 'EDITING', description: 'order_status_editing' },
          { name: 'PENDING_RECEIVE', description: 'order_status_pending_receive' },
          { name: 'INTRANSIT', description: 'order_status_intransit' }
      ]
  },
  {
      name: 'PALLET_STATUS',
      description: 'pallet status',
      details: [
          { name: 'LOST', description: 'LOST' },
          { name: 'DAMAGED', description: 'DAMAGED' },
          { name: 'ACTIVE', description: 'ACTIVE' }
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
          { name: 'ADMIN', description: 'Admin' },
          { name: 'W/H SUPERVISOR', description: 'Warehouse Supervisor' }
      ]
  },
  {
      name: 'WORKER_TYPES',
      description: 'worker types',
      details: [
          { name: 'Warehouse Manager', description: 'Warehouse Manager' },
          { name: 'Warehouse Supervisor', description: 'Warehouse Supervisor' },
          { name: 'Office Admin', description: 'Office Admin' },
          { name: 'Warehouse Staff', description: 'Warehouse Staff' }
      ]
  },
  {
      name: 'PRODUCT_TYPES',
      description: 'product types',
      details: [
          { name: 'PACKAGE', description: 'package' },
          { name: 'POWDER', description: 'powder' },
          { name: 'PAIR', description: 'pair' },
          { name: 'PAIL', description: 'pail' },
          { name: 'PACKAGING MATERIAL', description: 'packaging material' },
          { name: 'TIN', description: 'tin' },
          { name: 'RM', description: 'rm' },
          { name: 'SET', description: 'set' },
          { name: 'PCS', description: 'pcs' },
          { name: 'ROLL', description: 'roll' },
          { name: 'PALLET', description: 'pallet' },
          { name: 'TUBE', description: 'tube' },
          { name: 'UNKNOWN', description: 'unknown' },
          { name: 'PM', description: 'pm' },
          { name: 'SER', description: 'ser' },
          { name: '11i', description: '11i' },
          { name: 'AP', description: 'ap' },
          { name: 'BAG', description: 'bag' },
          { name: 'BOTTLE', description: 'bottle' },
          { name: 'BOX', description: 'box' },
          { name: 'CARBOY', description: 'carboy' },
          { name: 'CARTON', description: 'carton' },
          { name: 'CHEMICAL', description: 'chemical' },
          { name: 'CRATES', description: 'crates' },
          { name: 'DRUM', description: 'drum' },
          { name: 'FG', description: 'fg' },
          { name: 'FILE', description: 'file' },
          { name: 'FRT', description: 'frt' },
          { name: 'IBC', description: 'ibc' },
          { name: 'KG', description: 'kg' },
          { name: 'LABEL', description: 'label' },
          { name: 'METER', description: 'meter' },
          { name: 'MR', description: 'mr' },
          { name: 'OTHERS', description: 'others' }
      ]
  },
  {
      name: 'GAN_REQUESTS_STATUS',
      description: 'arrival notice status',
      details: [
          { name: 'READY_TO_UNLOAD', description: 'order_status_ready_to_unload' },
          { name: 'PROCESSING', description: 'order_status_processing' },
          { name: 'READY_TO_PUTAWAY', description: 'order_status_ready_to_putaway' },
          { name: 'PUTTING_AWAY', description: 'order_status_putting_away' },
          { name: 'REJECTED', description: 'order_status_rejected' },
          { name: 'DONE', description: 'order_status_done' },
          { name: 'CANCELLED', description: 'order_status_cancelled' },
          { name: 'PENDING', description: 'order_status_pending' },
          { name: 'PENDING_RECEIVE', description: 'order_status_pending_receive' },
          { name: 'IN_TRANSIT', description: 'order_status_in_transit' },
          { name: 'ARRIVED', description: 'order_status_arrived' }
      ]
  },
  {
      name: 'WORKSHEET_TYPES',
      description: 'worksheet types',
      details: [
          { name: 'LOADING', description: 'loading' },
          { name: 'VAS', description: 'vas' },
          { name: 'PUTAWAY', description: 'putaway' },
          { name: 'UNLOADING', description: 'unloading' },
          { name: 'PICKING', description: 'picking' }
      ]
  },
  {
      name: 'ORDER_VAS_STATUS',
      description: 'order VAS status',
      details: [
          { name: 'PENDING', description: 'vas_status_pending' },
          { name: 'PROCESSING', description: 'vas_status_processing' }
      ]
  },
  {
      name: 'WEIGHT_UNITS',
      description: 'weight units',
      details: [
          { name: 'kg', description: 'kilogram' },
          { name: 't', description: 'tonne' }
      ]
  },
  {
      name: 'CLAIM_TYPES',
      description: 'trip claim',
      details: [
          { name: 'Toll', description: 'Toll' },
          { name: 'Handling', description: 'Handling' },
          { name: 'Diesel FC', description: 'Diesel FC' },
          { name: 'Forklift', description: 'Forklift' },
          { name: 'Diesel Cash', description: 'Diesel Cash' },
          { name: 'Parking', description: 'Parking' }
      ]
  },
  {
      name: 'APPROVAL_STATUS',
      description: 'approval status',
      details: [
          { name: 'PENDING', description: 'status_pending' },
          { name: 'APPROVED', description: 'status_approved' }
      ]
  },
  {
      name: 'LOCATION_TYPE',
      description: 'location type',
      details: [
          { name: 'SHELF', description: 'shelf' },
          { name: 'BUFFER', description: 'buffer_location' }
      ]
  },
  {
      name: 'COUNTRY_CODES',
      description: 'country codes',
      details: [
          { name: 'SG', description: 'Singapore' },
          { name: 'MY', description: 'Malaysia' },
          { name: 'KR', description: 'Korea' }
      ]
  },
  {
      name: 'CONTAINER_SIZES',
      description: 'container sizes',
      details: [
          { name: '40ft', description: '40ft container' },
          { name: '20ft', description: '20ft container' },
          { name: '10 tonne', description: '10 tonne container' },
          { name: '5 tonne', description: '5 tonne container' },
          { name: '3 tonne', description: '3 tonne container' }
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
