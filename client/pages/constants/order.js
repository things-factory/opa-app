export const ARRIVAL_NOTICE = { name: 'arrival_notice', value: 'ARRIVAL_NOTICE' }
export const SHIPPING = { name: 'shipping_order', value: 'SHIPPING_ORDER' }
export const DELIVERY = { name: 'delivery_order', value: 'DELIVERY' }
export const COLLECTION = { name: 'collection_order', value: 'COLLECTION' }
export const RELEASE_OF_GOODS = { name: 'release_of_goods', value: 'RELEASE_OF_GOODS' }
export const VAS_ORDER = { name: 'vas_order', value: 'VAS_ORDER' }
export const CYCLE_COUNT = { name: 'cycle_count', value: 'CYCLE_COUNT' }
export const RETURN_ORDER = { name: 'return_order', value: 'RETURN_ORDER' }

export const ORDER_TYPES = {
  ARRIVAL_NOTICE,
  SHIPPING,
  DELIVERY,
  COLLECTION,
  RELEASE_OF_GOODS,
  VAS_ORDER,
  CYCLE_COUNT,
  RETURN_ORDER
}

export const ORDER_STATUS = {
  PENDING: { name: 'order_status_pending', value: 'PENDING' },
  PENDING_CANCEL: { name: 'order_status_pending_cancel', value: 'PENDING_CANCEL' },
  PENDING_RECEIVE: { name: 'order_status_pending_receive', value: 'PENDING_RECEIVE' },
  PENDING_REVIEW: { name: 'order_status_pending_review', value: 'PENDING_REVIEW' },
  PENDING_APPROVAL: { name: 'order_status_pending_approval', value: 'PENDING_APPROVAL' },
  CANCELLED: { name: 'order_status_cancelled', value: 'CANCELLED' },
  EDITING: { name: 'order_status_editing', value: 'EDITING' },
  REJECTED: { name: 'order_status_rejected', value: 'REJECTED' },
  INTRANSIT: { name: 'order_status_intransit', value: 'INTRANSIT' },
  ARRIVED: { name: 'order_status_arrived', value: 'ARRIVED' },
  RECEIVED: { name: 'order_status_received', value: 'RECEIVED' },
  READY_TO_UNLOAD: { name: 'ready_to_unload', value: 'READY_TO_UNLOAD' },
  PUTTING_AWAY: { name: 'putting_away', value: 'PUTTING_AWAY' },
  PROCESSING: { name: 'order_status_processing', value: 'PROCESSING' },
  DONE: { name: 'order_status_done', value: 'DONE' },
  COLLECTING: { name: 'order_status_collecting', value: 'COLLECTING' },
  DELIVERING: { name: 'order_status_delivering', value: 'DELIVERING' },
  EXECUTING: { name: 'order_status_executing', value: 'EXECUTING' },
  DISPATCHING: { name: 'order_status_dispatching', value: 'DISPATCHING' },
  INSPECTING: { name: 'order_status_inspecting', value: 'INSPECTING' },
  INPROCESS: { name: 'order_status_in_process', value: 'INPROCESS' },
  READY_TO_PICK: { name: 'order_status_ready_to_pick', value: 'READY_TO_PICK' },
  PICKING: { name: 'order_status_picking', value: 'PICKING' },
  LOADING: { name: 'order_status_loading', value: 'LOADING' },
  READY_TO_DISPATCH: { name: 'order_status_ready_to_dispatch', value: 'READY_TO_DISPATCH' },
  READY_TO_EXECUTE: { name: 'order_status_ready_to_execute', value: 'READY_TO_EXECUTE' },
  READY_TO_SEND: { name: 'order_status_ready_to_send', value: 'READY_TO_SEND' }
}

export const ORDER_PRODUCT_STATUS = {
  READY_TO_APPROVED: { name: 'ready_to_approve', value: 'READY_TO_APPROVED' },
  PENDING: { name: 'product_status_pending', value: 'PENDING' },
  INTRANSIT: { name: 'product_status_intransit', value: 'INTRANSIT' },
  ARRIVED: { name: 'product_status_arrived', value: 'ARRIVED' },
  UNLOADING: { name: 'product_status_unloading', value: 'UNLOADING' },
  UNLOADED: { name: 'product_status_unloaded', value: 'UNLOADED' },
  PUTTING_AWAY: { name: 'product_status_putting_away', value: 'PUTTING_AWAY' },
  INSPECTED: { name: 'product_status_inspected', value: 'INSPECTED' },
  PENDING_APPROVAL: { name: 'product_status_pending_approval', value: 'PENDING_APPROVAL' },
  PENDING_ADJUSTMENT: { name: 'product_status_pending_adjustment', value: 'PENDING_ADJUSTMENT' },
  STORED: { name: 'product_status_stored', value: 'STORED' },
  READY_TO_UNLOAD: { name: 'product_status_ready_to_unload', value: 'READY_TO_UNLOAD' },
  READY_TO_DELIVER: { name: 'product_status_ready_to_deliver', value: 'READY_TO_DELIVER' },
  COLLECTED: { name: 'product_status_collected', value: 'COLLECTED' },
  DELIVERED: { name: 'product_status_delivered', value: 'DELIVERED' }
}

export const ORDER_INVENTORY_STATUS = {
  PENDING: { name: 'inventory_status_pending', value: 'PENDING' },
  PENDING_RECEIVE: { name: 'inventory_status_pending_receive', value: 'PENDING_RECEIVE' },
  PENDING_SPLIT: { name: 'inventory_status_pending_split', value: 'PENDING_SPLIT' },
  READY_TO_PICK: { name: 'inventory_status_ready_topick', value: 'READY_TO_PICK' },
  READY_TO_RETURN: { name: 'inventory_status_ready_to_return', value: 'READY_TO_RETURN' },
  PICKING: { name: 'inventory_status_picking', value: 'PICKING' },
  LOADING: { name: 'inventory_status_loading', value: 'LOADING' },
  PICKED: { name: 'inventory_status_picked', value: 'PICKED' },
  LOADED: { name: 'inventory_status_loaded', value: 'LOADED' },
  REJECTED: { name: 'inventory_status_rejected', value: 'REJECTED' },
  RELEASED: { name: 'inventory_status_released', value: 'RELEASED' },
  DELIVERING: { name: 'inventory_status_delivering', value: 'DELIVERING' },
  RETURNING: { name: 'inventory_status_returning', value: 'RETURNING' },
  INSPECTING: { name: 'inventory_status_inspecting', value: 'INSPECTING' },
  INSPECTED: { name: 'inventory_status_inspected', value: 'INSPECTED' },
  NOT_TALLY: { name: 'inventory_status_not_tally', value: 'NOT_TALLY' },
  MISSING: { name: 'inventory_status_missing', value: 'MISSING' },
  EXTRA: { name: 'inventory_status_extra', value: 'EXTRA' },
  RELOCATED: { name: 'inventory_status_relocated', value: 'RELOCATED' },
  ADDED: { name: 'inventory_status_added', value: 'ADDED' },
  TERMINATED: { name: 'inventory_status_terminated', value: 'TERMINATED' },
  DONE: { name: 'inventory_status_done', value: 'DONE' }
}

export const ORDER_VAS_STATUS = {
  PENDING: { name: 'vas_status_pending', value: 'PENDING' },
  PROCESSING: { name: 'vas_status_processing', value: 'PROCESSING' },
  READY_TO_PROCESS: { name: 'vas_status_ready_to_process', value: 'READY_TO_PROCESS' },
  DONE: { name: 'vas_status_done', value: 'DONE' }
}

export const LOAD_TYPES = [
  { name: 'full_container_load', value: 'FCL' },
  { name: 'low_container_load', value: 'LCL' },
  { name: 'tag_along', value: 'TAG_ALONG' }
]

export const PACKING_TYPES = {
  CORRUGATED_BOX: { name: 'corrugated_box_packing', value: 'CORRUGATED_BOX' },
  CARTON: { name: 'carton_packing', value: 'CARTON' },
  DRUM: { name: 'drum_packing', value: 'DRUM' },
  BOTTLE: { name: 'bottle_packing', value: 'BOTTLE' },
  BAG: { name: 'bag_packing', value: 'BAG' },
  SACK: { name: 'sack_packing', value: 'SACK' },
  BOXBOARD: { name: 'boxboard_packing', value: 'BOXBOARD' },
  CAN: { name: 'can_packing', value: 'CAN' }
}

export const GRN_STATUS = {
  PENDING_PROCESS: { name: 'pending_process_status', value: 'PENDING_PROCESS' },
  SUBMITTED: { name: 'submitted_status', value: 'SUBMITTED' },
  RECEIVED: { name: 'received_status', value: 'RECEIVED' },
  NEW: { name: 'new_status', value: 'NEW' },
  OPENED: { name: 'opened_status', value: 'OPENED' }
}

export const getOrderStatusCandidates = function (orderType) {
  if (!orderType) throw new Error('There is no order type')

  switch (orderType) {
    case ORDER_TYPES.CYCLE_COUNT:
      return [ORDER_STATUS.PENDING, ORDER_STATUS.INSPECTING, ORDER_STATUS.PENDING_REVIEW, ORDER_STATUS.DONE]

    default:
      throw new Error('Failed to find via passed order type')
  }
}
