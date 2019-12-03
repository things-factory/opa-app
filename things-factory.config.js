import bootstrap from './client/bootstrap'
import route from './client/route'

export default {
  route,
  routes: [
    /**
     * Master Menus Section
     */
    {
      tagname: 'home-dashboard',
      page: 'dashboard'
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
      tagname: 'product-list',
      page: 'products'
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
      tagname: 'print-delivery-order',
      page: 'print_delivery_order'
    },
    {
      tagname: 'collection-order-list',
      page: 'collection_orders'
    },
    {
      tagname: 'vas-order-requests',
      page: 'vas_requests'
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
      tagname: 'receive-vas-order',
      page: 'receive_vas_order'
    },
    {
      tagname: 'vas-order-detail',
      page: 'vas_order_detail'
    },
    {
      tagname: 'rejected-vas-order',
      page: 'rejected_vas_order'
    },
    {
      tagname: 'create-transport-order',
      page: 'create_transport_order'
    },

    /**
     * Order Menus Section
     */

    /**
     * Billing Menus Section
     */
    {
      tagname: 'create-claim-chit',
      page: 'create_claim_chit'
    },
    {
      tagname: 'claim-chit-list',
      page: 'claim_chit_list'
    },
    {
      tagname: 'claim-chit-detail',
      page: 'claim_chit_detail'
    },
    /**
     * GRN Menus Section
     */
    {
      tagname: 'receival-note-list',
      page: 'receival_note_list'
    },
    {
      tagname: 'create-receival-note',
      page: 'create_receival_note'
    },
    {
      tagname: 'receival-note-detail',
      page: 'receival_note_detail'
    },
    {
      tagname: 'customer-receival-notes',
      page: 'customer_receival_notes'
    },
    /**
     * Billing Menus Section
     */

    /**
     * inventory Menus Section
     */
    {
      tagname: 'onhand-inventory',
      page: 'onhand_inventory'
    },
    {
      tagname: 'customer-onhand-inventory',
      page: 'customer_onhand_inventory'
    },
    {
      tagname: 'customer-intransit-inventory',
      page: 'customer_intransit_inventory'
    },
    {
      tagname: 'intransit-inventory',
      page: 'intransit_inventory'
    },
    {
      tagname: 'inventory-history',
      page: 'inventory_histories'
    },
    {
      tagname: 'inventory-adjustment',
      page: 'inventory_adjustment'
    },
    {
      tagname: 'inventory-by-product',
      page: 'inventory_by_product'
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

    /**
     * Inbound Menus Section
     */
    {
      tagname: 'inbound-worksheet',
      page: 'inbound_worksheets'
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
    {
      tagname: 'vas-worksheet-list',
      page: 'vas_worksheets'
    },

    /**
     * Outbound Menus Section
     */
    {
      tagname: 'outbound-worksheet',
      page: 'outbound_worksheets'
    },
    {
      tagname: 'worksheet-picking',
      page: 'worksheet_picking'
    },
    {
      tagname: 'picking-product',
      page: 'picking'
    },
    {
      tagname: 'loading-product',
      page: 'loading'
    },
    {
      tagname: 'worksheet-loading',
      page: 'worksheet_loading'
    },

    /**
     * Report Menus Section
     */
    {
      tagname: 'inventory-report',
      page: 'inventory_report'
    }
  ],
  bootstrap
}
