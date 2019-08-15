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

    case 'bizplaces':
      import('./pages/master/bizplace-list')
      return page

    case 'transport_vehicles':
      import('./pages/master/transport-vehicle')
      return page

    case 'workers':
      import('./pages/master/worker-list')
      return page

    /**
     * Order Menus Section
     */
    case 'arrival_notice':
      import('./pages/order/create-arrival-notice')
      return page

    case 'confirm_arrival_notice':
      import('./pages/order/confirm-arrival-notice')
      return page

    case 'receive_arrival_notice':
      import('./pages/order/receive-arrival-notice')
      return page

    case 'arrival_notice_detail':
      import('./pages/order/arrival-notice-detail')
      return page

    case 'release_goods':
      import('./pages/order/create-release-goods')
      return page

    case 'confirm_release_goods':
      import('./pages/order/confirm-release-goods')
      return page

    case 'receive_release_goods':
      import('./pages/order/receive-release-goods')
      return page

    case 'release_goods_detail':
      import('./pages/order/release-goods-detail')
      return page

    case 'transport':
      import('./pages/order/create-transport-order')
      return page

    case 'confirm_transport':
      import('./pages/order/confirm-transport-order')
      return page

    case 'receive_transport':
      import('./pages/order/receive-transport-order')
      return page

    case 'transport_order_detail':
      import('./pages/order/transport-order-detail')
      return page

      transport_order_detail
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

    case 'menus':
      import('./pages/system/system-menu')
      return page

    case 'menu_columns':
      import('./pages/system/system-menu-column')
      return page

    case 'domains':
      import('./pages/system/system-domain')
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

    case 'vas':
      import('./pages/inbound/vas-work-order')
      return page

    /**
     * Inbound Menus Section
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
