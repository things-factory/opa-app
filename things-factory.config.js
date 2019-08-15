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
      tagname: 'bizplace-list',
      page: 'bizplaces'
    },
    {
      tagname: 'transport-vehicle',
      page: 'transport_vehicle'
    },
    {
      tagname: 'worker-list',
      page: 'workers'
    },

    /**
     * Order Menus Section
     */
    {
      tagname: 'create-arrival-notice',
      page: 'arrival_notice'
    },
    {
      tagname: 'confirm-arrival-notice',
      page: 'confirm_arrival_notice'
    },
    {
      tagname: 'confirm-arrival-notice',
      page: 'confirm_arrival_notice'
    },
    {
      tagname: 'receive-arrival-notice',
      page: 'receive_arrival_notice'
    },
    {
      tagname: 'create-release-goods',
      page: 'release_goods'
    },
    {
      tagname: 'confirm-release-goods',
      page: 'confirm_release_goods'
    },
    {
      tagname: 'receive-release-goods',
      page: 'receive_release_goods'
    },
    {
      tagname: 'create-transport-order',
      page: 'transport'
    },
    {
      tagname: 'confirm-transport-order',
      page: 'confirm_transport'
    },
    {
      tagname: 'receive-transport-order',
      page: 'receive_transport'
    },
    {
      tagname: 'transport-order-detail',
      page: 'transport_order_detail'
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
      tagname: 'system-user',
      page: 'users'
    },
    {
      tagname: 'system-menu',
      page: 'menus'
    },
    {
      tagname: 'system-menu-column',
      page: 'menu_columns'
    },
    {
      tagname: 'system-domain',
      page: 'domains'
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
      page: 'vas'
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
