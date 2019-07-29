import { isMobileDevice } from '@things-factory/shell'

export default function route(page) {
  switch (page) {
    case 'index':
      return isMobileDevice() ? 'menu-list' : 'opa-home'

    case 'system-menu':
      import('./pages/system/system-menu')
      return page

    case 'system-menu-column':
      import('./pages/system/system-menu-column')
      return page

    case 'opa-home':
      import('./pages/opa-home')
      return page

    case 'create-arrival-notice':
      import('./pages/create-arrival-notice')
      return page

    case 'arrival-notice-detail':
      import('./pages/arrival-notice-detail')
      return page

    case 'company-profile':
      import('./pages/company-profile')
      return page

    case 'confirm-arrival-notice':
      import('./pages/confirm-arrival-notice')
      return page

    case 'confirm-shipping-notice':
      import('./pages/confirm-shipping-notice')
      return page

    case 'confirm-transport-order':
      import('./pages/confirm-transport-order')
      return page

    case 'transport-order-detail':
      import('./pages/transport-order-detail')
      return page

    case 'create-release-goods':
      import('./pages/create-release-goods')
      return page

    case 'create-transport-order':
      import('./pages/create-transport-order')
      return page

    case 'inbound-work-order':
      import('./pages/inbound-work-order')
      return page

    case 'outbound-work-order':
      import('./pages/outbound-work-order')
      return page

    case 'picking-by-product':
      import('./pages/picking-by-product')
      return page

    case 'picking-by-unit':
      import('./pages/picking-by-unit')
      return page

    case 'putaway-goods':
      import('./pages/putaway-goods')
      return page

    case 'receive-arrival-notice':
      import('./pages/receive-arrival-notice')
      return page

    case 'receive-goods':
      import('./pages/receive-goods')
      return page

    case 'receive-shipping-notice':
      import('./pages/receive-shipping-notice')
      return page

    case 'receive-transport-order':
      import('./pages/receive-transport-order')
      return page

    case 'summary-bill-amount':
      import('./pages/summary-bill-amount')
      return page

    case 'update-claim-chit':
      import('./pages/update-claim-chit')
      return page

    case 'vas-work-order':
      import('./pages/vas-work-order')
      return page
  }
}
