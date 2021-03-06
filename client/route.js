import { isMobileDevice } from '@things-factory/utils'

export default function route(page) {
  switch (page) {
    case '':
      return isMobileDevice() ? '/menu-list' : '/dashboard'

    case 'dashboard':
      import('./pages/board/dashboard')
      return page

    /**
     * Master Menus Section
     */

    case 'transport_vehicle':
      import('./pages/master/transport-vehicle')
      return page

    case 'transport_driver':
      import('./pages/master/transport-driver')
      return page

    case 'warehouses':
      import('./pages/master/warehouse-list')
      return page

    case 'locations':
      import('./pages/master/location-list')
      return page

    case 'workers':
      import('./pages/master/worker-list')
      return page

    case 'pallets':
      import('./pages/master/pallet-list')
      return page

    case 'picking_bins':
      import('./pages/master/picking-bin-list')
      return page

    /**
     * Order Menus Section
     */
    case 'create_arrival_notice':
      import('./pages/order/arrival-notice/create-arrival-notice')
      return page

    case 'duplicate_arrival_notice':
      import('./pages/order/arrival-notice/duplicate-arrival-notice')
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

    case 'rejected_release_order':
      import('./pages/order/release-order/rejected-release-order')
      return page

    case 'vas_orders':
      import('./pages/order/vas-order/vas-order-list')
      return page

    case 'vas_requests':
      import('./pages/order/vas-order/vas-order-requests')
      return page

    case 'create_vas_order':
      import('./pages/order/vas-order/create-vas-order')
      return page

    case 'vas_order_detail':
      import('./pages/order/vas-order/vas-order-detail')
      return page

    case 'receive_vas_order':
      import('./pages/order/vas-order/receive-vas-order')
      return page

    case 'rejected_vas_order':
      import('./pages/order/vas-order/rejected-vas-order')
      return page

    case 'delivery_orders':
      import('./pages/order/transport-order/delivery-order-list')
      return page

    case 'print_delivery_note':
      import('./pages/order/transport-order/print-delivery-note')
      return page

    case 'create_return_order':
      import('./pages/order/return-order/create-return-order')
      return page

    case 'return_order_detail':
      import('./pages/order/return-order/return-order-detail')
      return page

    case 'return_orders':
      import('./pages/order/return-order/return-order-list')
      return page

    case 'return_order_requests':
      import('./pages/order/return-order/return-order-requests')
      return page

    case 'receive_return_order_requests':
      import('./pages/order/return-order/receive-return-order-requests')
      return page

    case 'rejected_return_order':
      import('./pages/order/return-order/rejected-return-order')
      return page

    case 'check_return_order':
      import('./pages/order/return-order/check-return-order')
      return page

    case 'return_order_assign_buffer_location':
      import('./pages/order/return-order/return-order-assign-buffer-location')
      return page

    /**
     * GRN Menus Section
     */
    case 'received_note_list':
      import('./pages/order/goods-received-note/received-note-list')
      return page

    case 'received_note_detail':
      import('./pages/order/goods-received-note/received-note-detail')
      return page

    case 'received_note':
      import('./pages/order/goods-received-note/customer-received-note')
      return page

    case 'customer_grn_list':
      import('./pages/order/goods-received-note/customer-grn-list')
      return page

    /**
     * Billing Menus Section
     */
    case 'create_claim_chit':
      import('./pages/billing/claim-chit/create-claim-chit')
      return page

    case 'claim_chit_list':
      import('./pages/billing/claim-chit/claim-chit-list')
      return page

    case 'claim_chit_detail':
      import('./pages/billing/claim-chit/claim-chit-detail')
      return page

    /**
     * Inventory Menus Section
     */
    case 'onhand_inventory':
      import('./pages/inventory/onhand-inventory')
      return page

    case 'inventory_by_product':
      import('./pages/inventory/inventory-by-product')
      return page

    case 'intransit_inventory':
      import('./pages/inventory/intransit-inventory')
      return page

    case 'inventory_histories':
      import('./pages/inventory/inventory-history')
      return page

    case 'inventory_adjustment':
      import('./pages/inventory/inventory-adjustment')
      return page

    case 'inventory_adjustment_approval':
      import('./pages/inventory/inventory-adjustment-approval')
      return page

    case 'customer_onhand_inventory':
      import('./pages/inventory/customer-onhand-inventory')
      return page

    case 'customer_inventory_by_product':
      import('./pages/inventory/customer-inventory-by-product')
      return page

    case 'customer_intransit_inventory':
      import('./pages/inventory/customer-intransit-inventory')
      return page

    case 'create_cycle_count':
      import('./pages/inventory-check/create-cycle-count')
      return page

    case 'inventory_check_list':
      import('./pages/inventory-check/inventory-check-list')
      return page

    case 'worksheet_cycle_count':
      import('./pages/inventory-check/worksheet-cycle-count')
      return page

    case 'inspecting_product':
      import('./pages/inventory-check/inspecting-product')
      return page

    case 'cycle_count_report':
      import('./pages/inventory-check/cycle-count-report')
      return page

    case 'job_sheets':
      import('./pages/report/job-sheet-list')
      return page

    case 'job_sheet_report':
      import('./pages/report/job-sheet-report')
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

    case 'domains':
      import('./pages/system/system-domain')
      return page

    case 'roles':
      import('./pages/system/system-role')
      return page

    case 'settings':
      import('./pages/system/system-setting')
      return page

    case 'location_sorting_rule':
      import('./pages/system/location-sorting-rule')
      return page

    case 'document_template_list':
      import('./pages/system/document-template-list')
      return page

    /**
     * Inbound Menus Section
     */
    case 'inbound_worksheets':
      import('./pages/inbound/inbound-worksheet')
      return page

    case 'external_return_worksheets':
      import('./pages/inbound/external-return-worksheet')
      return page

    case 'putaway':
      import('./pages/inbound/putaway-product')
      return page

    case 'preunload':
      import('./pages/inbound/preunload-product')
      return page

    case 'worksheet_unloading':
      import('./pages/inbound/worksheet-unloading')
      return page

    case 'worksheet_putaway':
      import('./pages/inbound/worksheet-putaway')
      return page

    case 'worksheet_unloading_return':
      import('./pages/inbound/worksheet-unloading-return')
      return page

    case 'worksheet_putaway_return':
      import('./pages/inbound/worksheet-putaway-return')
      return page

    case 'worksheet_vas':
      import('./pages/vas/worksheet-vas')
      return page

    case 'worksheet_ref_vas':
      import('./pages/vas/worksheet-ref-vas')
      return page

    case 'unloading':
      import('./pages/inbound/unload-product')
      return page

    case 'unloading_return':
      import('./pages/inbound/unload-return-product')
      return page

    case 'execute_vas':
      import('./pages/vas/execute-vas')
      return page

    case 'vas_worksheets':
      import('./pages/vas/vas-worksheet-list')
      return page

    case 'inbound_reusable_pallet':
      import('./pages/inbound/inbound-reusable-pallet')
      return page

    /**
     * Adjustment Menus Section
     */
    case 'transfer_inventory':
      import('./pages/adjustment/transfer-inventory')
      return page

    /**
     * Outbound Menus Section
     */
    case 'outbound_worksheets':
      import('./pages/outbound/outbound-worksheet')
      return page

    case 'worksheet_picking':
      import('./pages/outbound/worksheet-picking')
      return page

    case 'worksheet_loading':
      import('./pages/outbound/worksheet-loading')
      return page

    case 'worksheet_return':
      import('./pages/outbound/worksheet-return')
      return page

    case 'picking':
      import('./pages/outbound/picking-product')
      return page

    case 'loading':
      import('./pages/outbound/loading-product')
      return page

    case 'returning':
      import('./pages/outbound/return-product')
      return page
    /**
     * Report Menus Section
     */
    case 'inventory_report':
      import('./pages/report/inventory-report')
      return page
    case 'inventory_summary_report':
      import('./pages/report/inventory-summary-report')
      return page
    case 'inventory_pallet_report':
      import('./pages/report/inventory-pallet-report')
      return page
    case 'inventory_pallet_storage_report':
      import('./pages/report/inventory-pallet-storage-report')
      return page
    case 'customer_inventory_pallet_storage_report':
      import('./pages/report/customer-inventory-pallet-storage-report')
      return page
    case 'customer_inventory_report':
      import('./pages/report/customer-inventory-report')
      return page
    case 'customer_inventory_pallet_report':
      import('./pages/report/customer-inventory-pallet-report')
      return page
    case 'customer_inventory_summary_report':
      import('./pages/report/customer-inventory-summary-report')
      return page

    /**
     * Custom ELCCL Menus Section
     */
    case 'elccl_daily_collection_report':
      import('./pages/report/custom-elccl/elccl-daily-collection-report')
      return page
    case 'elccl_inventory_summary_report':
      import('./pages/report/custom-elccl/elccl-inventory-summary-report')
      return page
    case 'elccl_inventory_report':
      import('./pages/report/custom-elccl/elccl-inventory-report')
      return page
    case 'elccl_inventory_pallet_detail_report':
      import('./pages/report/custom-elccl/elccl-inventory-pallet-detail-report')
      return page
    case 'elccl_daily_order_inventory_report':
      import('./pages/report/custom-elccl/elccl-daily-order-inventory-report')
      return page
  }
}
