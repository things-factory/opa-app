export const ORDER_TYPES = {
  ARRIVAL_NOTICE: {
    name: 'arrival_notice',
    value: 'ARRIVAL_NOTICE'
  },
  SHIPPING: {
    name: 'shipping_order',
    value: 'SHIPPING_ORDER'
  },
  DELIVERY: {
    name: 'delivery_order',
    value: 'DELIVERY'
  },
  COLLECTION: {
    name: 'collection_order',
    value: 'COLLECTION'
  },
  RELEASE_OF_GOODS: {
    name: 'release_of_goods',
    value: 'RELEASE_OF_GOODS'
  },
  VAS_ORDER: {
    name: 'vas_order',
    value: 'VAS_ORDER'
  }
}

export const ORDER_STATUS = {
  PENDING: {
    name: 'order_status_pending',
    value: 'PENDING'
  },
  EDITING: {
    name: 'order_status_editing',
    value: 'EDITING'
  },
  REJECTED: {
    name: 'order_status_rejected',
    value: 'REJECTED'
  },
  PENDING_RECEIVE: {
    name: 'order_status_pending_receive',
    value: 'PENDING_RECEIVE'
  },
  INTRANSIT: {
    name: 'order_status_intransit',
    value: 'INTRANSIT'
  },
  ARRIVED: {
    name: 'order_status_arrived',
    value: 'ARRIVED'
  },
  PROCESSING: {
    name: 'order_status_processing',
    value: 'PROCESSING'
  },
  DONE: {
    name: 'order_status_done',
    value: 'DONE'
  },
  COLLECTING: {
    name: 'order_status_collecting',
    value: 'COLLECTING'
  },
  DELIVERING: {
    name: 'order_status_delivering',
    value: 'DELIVERING'
  },
  EXECUTING: {
    name: 'order_status_executing',
    value: 'EXECUTING'
  },
  DISPATCHING: {
    name: 'order_status_dispatching',
    value: 'DISPATCHING'
  },
  INPROCESS: {
    name: 'order_status_in_process',
    value: 'INPROCESS'
  },
  READY_TO_PICK: {
    name: 'order_status_ready_to_pick',
    value: 'READY_TO_PICK'
  },
  READY_TO_DISPATCH: {
    name: 'order_status_ready_to_dispatch',
    value: 'READY_TO_DISPATCH'
  },
  READY_TO_EXECUTE: {
    name: 'order_status_ready_to_execute',
    value: 'READY_TO_EXECUTE'
  }
}

export const ORDER_PRODUCT_STATUS = {
  PENDING: {
    name: 'product_status_pending',
    value: 'PENDING'
  },
  INTRANSIT: {
    name: 'product_status_intransit',
    value: 'INTRANSIT'
  },
  ARRIVED: {
    name: 'product_status_arrived',
    value: 'ARRIVED'
  },
  UNLOADING: {
    name: 'product_status_unloading',
    value: 'UNLOADING'
  },
  UNLOADED: {
    name: 'product_status_unloaded',
    value: 'UNLOADED'
  },
  PUTTING_AWAY: {
    name: 'product_status_putting_away',
    value: 'PUTTING_AWAY'
  },
  STORED: {
    name: 'product_status_stored',
    value: 'STORED'
  },
  READY_TO_COLLECT: {
    name: 'product_status_ready_to_collect',
    value: 'READY_TO_COLLECT'
  },
  READY_TO_DELIVER: {
    name: 'product_status_ready_to_deliver',
    value: 'READY_TO_DELIVER'
  },
  COLLECTED: {
    name: 'product_status_collected',
    value: 'COLLECTED'
  },
  DELIVERED: {
    name: 'product_status_delivered',
    value: 'DELIVERED'
  }
}

export const ORDER_VAS_STATUS = {
  PENDING: {
    name: 'vas_status_pending',
    value: 'PENDING'
  },
  PROCESSING: {
    name: 'vas_status_processing',
    value: 'PROCESSING'
  },
  DONE: {
    name: 'vas_status_done',
    value: 'DONE'
  }
}

export const LOAD_TYPES = [
  {
    name: 'full_container_load',
    value: 'FCL'
  },
  {
    name: 'low_container_load',
    value: 'LCL'
  },
  {
    name: 'tag_along',
    value: 'TAG_ALONG'
  }
]

export const PACKING_TYPES = {
  CORRUGATED_BOX: {
    name: 'corrugated_box_packing',
    value: 'CORRUGATED_BOX'
  },
  CARTON: {
    name: 'carton_packing',
    value: 'CARTON'
  },
  DRUM: {
    name: 'drum_packing',
    value: 'DRUM'
  },
  BOTTLE: {
    name: 'bottle_packing',
    value: 'BOTTLE'
  },
  BAG: {
    name: 'bag_packing',
    value: 'BAG'
  },
  SACK: {
    name: 'sack_packing',
    value: 'SACK'
  },
  BOXBOARD: {
    name: 'boxboard_packing',
    value: 'BOXBOARD'
  },
  CAN: {
    name: 'can_packing',
    value: 'CAN'
  }
}
