let menus = [
  {
    name: 'Master Data',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Product',
        template: 'product-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'products'
      },
      {
        name: 'VAS',
        template: 'vas-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'vas'
      },
      {
        name: 'Warehouse',
        template: 'warehouse-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'warehouses'
      },
      {
        name: 'Transport Vehicle',
        template: 'transport-vehicle',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'transport_vehicle'
      },
      {
        name: 'Transport Driver',
        template: 'transport-driver',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'transport_driver'
      }
    ]
  },
  {
    name: 'Arrival Notice',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Create Arrival Notice',
        template: 'create-arrival-notice',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'create_arrival_notice'
      },
      {
        name: 'Arrival Notices',
        template: 'arrival-notice-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'arrival_notices'
      },
      {
        name: 'Arrival Notice Requests',
        template: 'arrival-notice-requests',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'arrival_notice_requests'
      }
    ]
  },
  {
    name: 'Release Order',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Create Release Order',
        template: 'create-release-order',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'create_release_order'
      },
      {
        name: 'Release Orders',
        template: 'release-order-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'release_orders'
      },
      {
        name: 'Release Order Requests',
        template: 'release-order-requests',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'release_order_requests'
      }
    ]
  },
  {
    name: 'VAS Order',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Create VAS Order',
        template: 'create-vas-order',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'create_vas_order'
      },
      {
        name: 'VAS Orders',
        template: 'vas-order-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'vas_orders'
      },
      {
        name: 'VAS Requests',
        template: 'vas-order-requests',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'vas_requests'
      }
    ]
  },
  {
    name: 'Billing',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Create Quotation',
        template: 'create-quotation',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'create_quotation'
      },
      {
        name: 'Quotations',
        template: 'quotation-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'quotations'
      },
      {
        name: 'Invoices',
        template: 'invoice-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'invoices'
      },
      {
        name: 'Create Claim Chit',
        template: 'create-claim-chit',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'create_claim_chit'
      },
      {
        name: 'Claim Chits',
        template: 'claim-chit-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'claim_chit_list'
      },
      {
        name: 'Summary Bill Amount',
        template: 'summary-bill-amount',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'bill'
      }
    ]
  },
  {
    name: 'Inventory',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Customer Onhand Inventory',
        template: 'customer-onhand-inventory',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'customer_onhand_inventory'
      },
      {
        name: 'Customer Intransit Inventory',
        template: 'customer-intransit-inventory',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'customer_intransit_inventory'
      },
      {
        name: 'Inventory Histories',
        template: 'inventory-history',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'inventory_histories'
      },
      {
        name: 'Inventory Adjustment',
        template: 'inventory-adjustment',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'inventory_adjustment'
      }
    ]
  },
  {
    name: 'Inbound',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Inbound Worksheets',
        template: 'inbound-worksheet',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'inbound_worksheets'
      },
      {
        name: 'Unloading',
        template: 'unload-product',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'unloading'
      },
      {
        name: 'Putaway',
        template: 'putaway-product',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'putaway'
      },
      {
        name: 'Goods Received Notes',
        template: 'receival-note-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'receival_note_list'
      }
    ]
  },
  {
    name: 'Outbound',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Outbound Worksheets',
        template: 'outbound-worksheet',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'outbound_worksheets'
      },
      {
        name: 'Picking',
        template: 'picking-product',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'picking'
      }
    ]
  },
  {
    name: 'Report',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Inventory Report',
        template: 'inventory-report',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'inventory_report'
      }
    ]
  },
  {
    name: 'VAS Worksheet',
    menuType: 'MENU',
    childrens: [
      {
        name: 'VAS Worksheets',
        template: 'vas-worksheet-list',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'vas_worksheets'
      },
      {
        name: 'Execute VAS',
        template: 'execute-vas',
        menuType: 'SCREEN',
        routingType: 'STATIC',
        resourceUrl: 'execute_vas'
      }
    ]
  }
]

module.exports = async function initMenus(trxMgr, domain) {
  const { Menu } = require('@things-factory/menu-base')
  const menuRepo = trxMgr.getRepository(Menu)

  await Promise.all(
    menus.map(async (menuGroup, idx) => {
      const parent = await menuRepo.save({
        ...menuGroup,
        domain,
        rank: (idx + 1) * 10
      })

      await menuRepo.save(
        menuGroup.childrens.map((children, idx) => {
          return {
            ...children,
            domain,
            parent,
            rank: (idx + 1) * 10
          }
        })
      )
    })
  )
}
