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
      tagname: 'pallet-list',
      page: 'pallets'
    },
    {
      tagname: 'picking-bin-list',
      page: 'picking_bins'
    },

    /**
     * Order Menus Section
     */
    {
      tagname: 'create-arrival-notice',
      page: 'create_arrival_notice'
    },
    {
      tagname: 'duplicate-arrival-notice',
      page: 'duplicate_arrival_notice'
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
      tagname: 'delivery-order-list',
      page: 'delivery_orders'
    },
    {
      tagname: 'print-delivery-note',
      page: 'print_delivery_note'
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
      tagname: 'received-note-list',
      page: 'received_note_list'
    },
    {
      tagname: 'received-note-detail',
      page: 'received_note_detail'
    },
    {
      tagname: 'customer-received-note',
      page: 'received_note'
    },
    {
      tagname: 'customer-grn-list',
      page: 'customer_grn_list'
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
      tagname: 'inventory-by-product',
      page: 'inventory_by_product'
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
      tagname: 'inventory-adjustment-approval',
      page: 'inventory_adjustment_approval'
    },
    {
      tagname: 'customer-onhand-inventory',
      page: 'customer_onhand_inventory'
    },
    {
      tagname: 'customer-inventory-by-product',
      page: 'customer_inventory_by_product'
    },
    {
      tagname: 'customer-intransit-inventory',
      page: 'customer_intransit_inventory'
    },
    {
      tagname: 'inventory-check-list',
      page: 'inventory_check_list'
    },
    {
      tagname: 'worksheet-cycle-count',
      page: 'worksheet_cycle_count'
    },
    {
      tagname: 'inspecting-product',
      page: 'inspecting_product'
    },
    {
      tagname: 'cycle-count-report',
      page: 'cycle_count_report'
    },
    {
      tagname: 'job-sheet-list',
      page: 'job_sheets'
    },
    {
      tagname: 'job-sheet-report',
      page: 'job_sheet_report'
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
    {
      tagname: 'location-sorting-rule',
      page: 'location_sorting_rule'
    },
    {
      tagname: 'document-template-list',
      page: 'document_template_list'
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
      tagname: 'worksheet-return',
      page: 'worksheet_return'
    },
    {
      tagname: 'worksheet-vas',
      page: 'worksheet_vas'
    },
    {
      tagname: 'worksheet-ref-vas',
      page: 'worksheet_ref_vas'
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
      tagname: 'preunload-product',
      page: 'preunload'
    },
    {
      tagname: 'execute-vas',
      page: 'execute_vas'
    },
    {
      tagname: 'vas-worksheet-list',
      page: 'vas_worksheets'
    },
    {
      tagname: 'inbound-reusable-pallet',
      page: 'inbound_reusable_pallet'
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
      tagname: 'return-product',
      page: 'returning'
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
    },
    {
      tagname: 'inventory-pallet-report',
      page: 'inventory_pallet_report'
    },
    {
      tagname: 'inventory-pallet-storage-report',
      page: 'inventory_pallet_storage_report'
    },
    {
      tagname: 'customer-inventory-report',
      page: 'customer_inventory_report'
    },
    {
      tagname: 'customer-inventory-pallet-report',
      page: 'customer_inventory_pallet_report'
    },

    /**
     * Custom ELCCL Menus Section
     */
    {
      tagname: 'elccl-daily-collection-report',
      page: 'elccl_daily_collection_report'
    },
    {
      tagname: 'elccl-inventory-summary-report',
      page: 'elccl_inventory_summary_report'
    },
    {
      tagname: 'elccl-inventory-report',
      page: 'elccl_inventory_report'
    },
    {
      tagname: 'elccl-inventory-pallet-detail-report',
      page: 'elccl_inventory_pallet_detail_report'
    }
  ],
  bootstrap
}
