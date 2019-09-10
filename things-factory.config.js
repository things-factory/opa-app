import bootstrap from './client/bootstrap'
import route from './client/route'

export default {
  route,
  routes: [
    /**
     * Master Menus Section
     */
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
      tagname: 'create-transport-order',
      page: 'create_transport_order'
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
      tagname: 'putaway-goods',
      page: 'putaway'
    },
    {
      tagname: 'vas-work-order',
      page: 'vas-work-order'
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
    },

    /**
     * Label Menus Section
     */
    {
      tagname: 'label-list',
      page: 'label_list'
    },
    {
      tagname: 'relabel',
      page: 'relabel'
    }
  ],
  bootstrap
}
