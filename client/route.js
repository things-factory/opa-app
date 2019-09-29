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
      import('./pages/order/arrival-notice/create-arrival-notice')
      return page

    case 'arrival_notices':
      import('./pages/order/arrival-notice/arrival-notice-list')
      return page

    case 'arrival_notice_detail':
      import('./pages/order/arrival-notice/arrival-notice-detail')
      return page

    case 'arrival_notice_requests':
      import('./pages/order/arrival-notice/arrival-notice-requests')
      return page

    case 'receive_arrival_notice':
      import('./pages/order/arrival-notice/receive-arrival-notice')
      return page

    case 'rejected_arrival_notice':
      import('./pages/order/arrival-notice/rejected-arrival-notice')
      return page

    case 'check_arrived_notice':
      import('./pages/order/arrival-notice/check-arrived-notice')
      return page

    case 'assign_buffer_location':
      import('./pages/order/arrival-notice/assign-buffer-location')
      return page

    case 'create_release_order':
      import('./pages/order/release-order/create-release-order')
      return page

    case 'release_orders':
      import('./pages/order/release-order/release-order-list')
      return page

    case 'release_order_detail':
      import('./pages/order/release-order/release-order-detail')
      return page

    case 'release_order_requests':
      import('./pages/order/release-order/release-order-requests')
      return page

    case 'receive_release_order_request':
      import('./pages/order/release-order/receive-release-order-request')
      return page

    case 'execute_release_order':
      import('./pages/order/release-order/execute-release-order')
      return page

    case 'rejected_release_order':
      import('./pages/order/release-order/rejected-release-order')
      return page

    case 'create_delivery_order':
      import('./pages/order/delivery-order/create-delivery-order')
      return page

    case 'create_collection_order':
      import('./pages/order/collection-order/create-collection-order')
      return page

    case 'delivery_order_detail':
      import('./pages/order/delivery-order/delivery-order-detail')
      return page

    case 'rejected_delivery_order':
      import('./pages/order/delivery-order/rejected-delivery-order')
      return page

    case 'delivery_order_requests':
      import('./pages/order/delivery-order/delivery-order-requests')
      return page

    case 'collection_order_detail':
      import('./pages/order/collection-order/collection-order-detail')
      return page

    case 'rejected_collection_order':
      import('./pages/order/collection-order/rejected-collection-order')
      return page

    case 'collection_order_requests':
      import('./pages/order/collection-order/collection-order-requests')
      return page

    case 'delivery_orders':
      import('./pages/order/delivery-order/delivery-order-list')
      return page

    case 'collection_orders':
      import('./pages/order/collection-order/collection-order-list')
      return page

    case 'receive_delivery_order':
      import('./pages/order/delivery-order/receive-delivery-order')
      return page

    case 'execute_delivery_order':
      import('./pages/order/delivery-order/execute-delivery-order')
      return page

    case 'complete_delivery_order':
      import('./pages/order/delivery-order/complete-delivery-order')
      return page

    case 'completed_delivery_order':
      import('./pages/order/delivery-order/completed-delivery-order')
      return page

    case 'receive_collection_order':
      import('./pages/order/collection-order/receive-collection-order')
      return page

    case 'execute_collection_order':
      import('./pages/order/collection-order/execute-collection-order')
      return page

    case 'complete_collection_order':
      import('./pages/order/collection-order/complete-collection-order')
      return page

    case 'completed_collection_order':
      import('./pages/order/collection-order/completed-collection-order')
      return page

    case 'vas_orders':
      import('./pages/order/vas-order/vas-order-list')
      return page

    case 'create_vas_order':
      import('./pages/order/vas-order/create-vas-order')
      return page

    case 'confirm_vas_order':
      import('./pages/order/vas-order/confirm-vas-order')
      return page

    case 'vas_order_detail':
      import('./pages/order/vas-order/vas-order-detail')
      return page

    /**
     * Billing Menus Section
     */
    case 'create_claim_chit':
      import('./pages/billing/create-claim-chit')
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
      import('./pages/inbound/putaway-product')
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

    case 'worksheet_putaway':
      import('./pages/inbound/worksheet-putaway')
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
  }
}
