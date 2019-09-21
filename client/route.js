import { isMobileDevice } from '@things-factory/shell'

export default function route(page) {
  switch (page) {
    case '':
      return isMobileDevice() ? '/menu-list' : '/board-viewer/872a1e69-7acb-45a1-a914-87dfb0d295b4' //'/opa-home'

    /**
     * Master Menus Section
     */
    case 'companies':
      import('./pages/master/company-list')
      return page

    case 'company_profile':
      import('./pages/master/company-profile')
      return page

    case 'products':
      import('./pages/master/product-list')
      return page

    case 'product_options':
      import('./pages/master/product-option-list')
      return page

    case 'vas':
      import('./pages/master/vas-list')
      return page

    case 'bizplaces':
      import('./pages/master/bizplace-list')
      return page

    case 'transport_vehicle':
      import('./pages/master/transport-vehicle')
      return page

    case 'transport_driver':
      import('./pages/master/transport-driver')
      return page

    case 'workers':
      import('./pages/master/worker-list')
      return page

    case 'warehouses':
      import('./pages/master/warehouse-list')
      return page

    case 'locations':
      import('./pages/master/location-list')
      return page

    /**
     * Order Menus Section
     */
    case 'create_arrival_notice':
      import('./pages/order/create-arrival-notice')
      return page

    case 'arrival_notices':
      import('./pages/order/arrival-notice-list')
      return page

    case 'arrival_notice_detail':
      import('./pages/order/arrival-notice-detail')
      return page

    case 'arrival_notice_requests':
      import('./pages/order/arrival-notice-requests')
      return page

    case 'receive_arrival_notice':
      import('./pages/order/receive-arrival-notice')
      return page

    case 'check_arrived_notice':
      import('./pages/order/check-arrived-notice')
      return page

    case 'assign_buffer_location':
      import('./pages/order/assign-buffer-location')
      return page

    case 'create_delivery_order':
      import('./pages/order/create-delivery-order')
      return page

    case 'create_collection_order':
      import('./pages/order/create-collection-order')
      return page

    case 'delivery_order_detail':
      import('./pages/order/delivery-order-detail')
      return page

    case 'delivery_order_requests':
      import('./pages/order/delivery-order-requests')
      return page

    case 'collection_order_detail':
      import('./pages/order/collection-order-detail')
      return page

    case 'collection_order_requests':
      import('./pages/order/collection-order-requests')
      return page

    case 'delivery_orders':
      import('./pages/order/delivery-order-list')
      return page

    case 'collection_orders':
      import('./pages/order/collection-order-list')
      return page

    case 'receive_delivery_order':
      import('./pages/order/receive-delivery-order')
      return page

    case 'receive_collection_order':
      import('./pages/order/receive-collection-order')
      return page

    case 'vas_orders':
      import('./pages/order/vas-order-list')
      return page
    /**
     * Stock Menus Section
     */
    case 'onhand_stock':
      import('./pages/stock/onhand-stock')
      return page

    case 'intransit_stock':
      import('./pages/stock/intransit-stock')
      return page

    /**
     * System Menus Section
     */
    case 'users':
      import('./pages/system/system-user')
      return page

    case 'user_bizplaces':
      import('./pages/system/system-user-bizplaces')
      return page

    case 'menus':
      import('./pages/system/system-menu')
      return page

    case 'domains':
      import('./pages/system/system-domain')
      return page

    case 'roles':
      import('./pages/system/system-role')
      return page

    case 'settings':
      import('./pages/system/system-setting')
      return page

    case 'codes':
      import('./pages/system/system-code')
      return page

    /**
     * Inbound Menus Section
     */
    case 'inbound_work_order':
      import('./pages/inbound/inbound-work-order')
      return page

    case 'receiving':
      import('./pages/inbound/receive-goods')
      return page

    case 'putaway':
      import('./pages/inbound/putaway-goods')
      return page

    case 'vas-work-order':
      import('./pages/inbound/vas-work-order')
      return page

    case 'worksheets':
      import('./pages/inbound/worksheet-list')
      return page

    case 'worksheet_unloading':
      import('./pages/inbound/worksheet-unloading')
      return page

    case 'worksheet_vas':
      import('./pages/inbound/worksheet-vas')
      return page

    case 'unloading':
      import('./pages/inbound/unload-product')
      return page

    case 'execute_vas':
      import('./pages/inbound/execute-vas')
      return page

    /**
     * Outbound Menus Section
     */
    case 'outbound':
      import('./pages/outbound/outbound-work-order')
      return page

    case 'picking_product':
      import('./pages/outbound/picking-by-product')
      return page

    case 'picking_unit':
      import('./pages/outbound/picking-by-unit')
      return page

    /**
     * Label Menus Section
     */
    case 'label_list':
      import('./pages/label/label-list')
      return page
  }
}
