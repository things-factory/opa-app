import bootstrap from './client/bootstrap'
import route from './client/route'

export default {
  route,
  routes: [
    /**
     * Master Menus Section
     */
    {
      tagname: 'opa-dashboard',
      page: 'dashboard'
    },
    {
      tagname: 'company-list',
      page: 'companies'
    },
    {
      tagname: 'company-profile',
      page: 'company_profile'
    },
    {
      tagname: 'product-list',
      page: 'products'
    },
    {
      tagname: 'product-option-list',
      page: 'product_options'
    },
    {
      tagname: 'vas-list',
      page: 'vas'
    },
    {
      tagname: 'bizplace-list',
      page: 'bizplaces'
    },
    {
      tagname: 'transport-vehicle',
      page: 'transport_vehicle'
    },
    {
      tagname: 'transport-driver',
      page: 'transport_driver'
    },
    {
      tagname: 'worker-list',
      page: 'workers'
    },
    {
      tagname: 'warehouse-list',
      page: 'warehouses'
    },
    {
      tagname: 'location-list',
      page: 'locations'
    },
    {
      tagname: 'transport-summary-report',
      page: 'transport_summary_reports'
    },
    {
      tagname: 'inventory-summary-report',
      page: 'inventory_summary_reports'
    },

    /**
     * Order Menus Section
     */
    {
      tagname: 'create-arrival-notice',
      page: 'create_arrival_notice'
    },
    {
      tagname: 'arrival-notice-list',
      page: 'arrival_notices'
    },
    {
      tagname: 'arrival-notice-detail',
      page: 'arrival_notice_detail'
    },
    {
      tagname: 'arrival-notice-requests',
      page: 'arrival_notice_requests'
    },
    {
      tagname: 'receive-arrival-notice',
      page: 'receive_arrival_notice'
    },
    {
      tagname: 'check-arrived-notice',
      page: 'check_arrived_notice'
    },
    {
      tagname: 'rejected-arrival-notice',
      page: 'rejected_arrival_notice'
    },
    {
      tagname: 'assign-buffer-location',
      page: 'assign_buffer_location'
    },
    {
      tagname: 'create-release-order',
      page: 'create_release_order'
    },
    {
      tagname: 'release-order-list',
      page: 'release_orders'
    },
    {
      tagname: 'release-order-detail',
      page: 'release_order_detail'
    },
    {
      tagname: 'release-order-requests',
      page: 'release_order_requests'
    },
    {
      tagname: 'receive-release-order-request',
      page: 'receive_release_order_request'
    },
    {
      tagname: 'rejected-release-order',
      page: 'rejected_release_order'
    },
    {
      tagname: 'create-delivery-order',
      page: 'create_delivery_order'
    },
    {
      tagname: 'delivery-order-requests',
      page: 'delivery_order_requests'
    },
    {
      tagname: 'rejected-delivery-order',
      page: 'rejected_delivery_order'
    },
    {
      tagname: 'receive-delivery-order',
      page: 'receive_delivery_order'
    },
    {
      tagname: 'execute-delivery-order',
      page: 'execute_delivery_order'
    },
    {
      tagname: 'complete-delivery-order',
      page: 'complete_delivery_order'
    },
    {
      tagname: 'completed-delivery-order',
      page: 'completed_delivery_order'
    },
    {
      tagname: 'receive-collection-order',
      page: 'receive_collection_order'
    },
    {
      tagname: 'rejected-collection-order',
      page: 'rejected_collection_order'
    },
    {
      tagname: 'execute-collection-order',
      page: 'execute_collection_order'
    },
    {
      tagname: 'complete-collection-order',
      page: 'complete_collection_order'
    },
    {
      tagname: 'completed-collection-order',
      page: 'completed_collection_order'
    },
    {
      tagname: 'create-collection-order',
      page: 'create_collection_order'
    },
    {
      tagname: 'collection-order-requests',
      page: 'collection_order_requests'
    },
    {
      tagname: 'delivery-order-detail',
      page: 'delivery_order_detail'
    },
    {
      tagname: 'collection-order-detail',
      page: 'collection_order_detail'
    },
    {
      tagname: 'delivery-order-list',
      page: 'delivery_orders'
    },
    {
      tagname: 'collection-order-list',
      page: 'collection_orders'
    },
    {
      tagname: 'vas-order-list',
      page: 'vas_orders'
    },
    {
      tagname: 'create-vas-order',
      page: 'create_vas_order'
    },
    {
      tagname: 'confirm-vas-order',
      page: 'confirm_vas_order'
    },
    {
      tagname: 'vas-order-detail',
      page: 'vas_order_detail'
    },

    /**
     * Order Menus Section
     */
    {
      tagname: 'create-claim-chit',
      page: 'create_claim_chit'
    },

    /**
     * Stock Menus Section
     */
    {
      tagname: 'onhand-stock',
      page: 'onhand_stock'
    },
    {
      tagname: 'intransit-stock',
      page: 'intransit_stock'
    },

    /**
     * System Menus Section
     */
    {
      tagname: 'system-user',
      page: 'users'
    },
    {
      tagname: 'system-user-bizplaces',
      page: 'user_bizplaces'
    },
    {
      tagname: 'system-menu',
      page: 'menus'
    },
    {
      tagname: 'system-domain',
      page: 'domains'
    },
    {
      tagname: 'system-role',
      page: 'roles'
    },
    {
      tagname: 'system-setting',
      page: 'settings'
    },
    {
      tagname: 'system-code',
      page: 'codes'
    },

    /**
     * Inbound Menus Section
     */
    {
      tagname: 'inbound-work-order',
      page: 'inbound_work_order'
    },
    {
      tagname: 'receive-goods',
      page: 'receiving'
    },
    {
      tagname: 'vas-work-order',
      page: 'vas-work-order'
    },
    {
      tagname: 'worksheet-list',
      page: 'worksheets'
    },
    {
      tagname: 'worksheet-unloading',
      page: 'worksheet_unloading'
    },
    {
      tagname: 'worksheet-putaway',
      page: 'worksheet_putaway'
    },
    {
      tagname: 'worksheet-vas',
      page: 'worksheet_vas'
    },
    {
      tagname: 'unload-product',
      page: 'unloading'
    },
    {
      tagname: 'putaway-product',
      page: 'putaway'
    },
    {
      tagname: 'execute-vas',
      page: 'execute_vas'
    },
    /**
     * Outbound Menus Section
     */
    {
      tagname: 'outbound-work-order',
      page: 'outbound'
    },
    {
      tagname: 'picking-by-product',
      page: 'picking_product'
    },
    {
      tagname: 'picking-by-unit',
      page: 'picking_unit'
    }
  ],
  bootstrap
}
