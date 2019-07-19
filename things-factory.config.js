import bootstrap from './client/bootstrap'
import route from './client/route'

export default {
  route,
  routes: [
    {
      tagname: 'opa-home',
      page: 'opa-home'
    },
    {
      tagname: 'create-arrival-notice',
      page: 'create-arrival-notice'
    },
    {
      tagname: 'company-profile',
      page: 'company-profile'
    },
    {
      tagname: 'confirm-arrival-notice',
      page: 'confirm-arrival-notice'
    },
    {
      tagname: 'confirm-shipping-notice',
      page: 'confirm-shipping-notice'
    },
    {
      tagname: 'confirm-transport-order',
      page: 'confirm-transport-order'
    },
    {
      tagname: 'create-shipping-notice',
      page: 'create-shipping-notice'
    },
    {
      tagname: 'create-transport-order',
      page: 'create-transport-order'
    },
    {
      tagname: 'inbound-work-order',
      page: 'inbound-work-order'
    },
    {
      tagname: 'intransit-stock',
      page: 'intransit-stock'
    },
    {
      tagname: 'onhand-stock',
      page: 'onhand-stock'
    },
    {
      tagname: 'outbound-work-order',
      page: 'outbound-work-order'
    },
    {
      tagname: 'picking-by-product',
      page: 'picking-by-product'
    },
    {
      tagname: 'picking-by-unit',
      page: 'picking-by-unit'
    },
    {
      tagname: 'putaway-goods',
      page: 'putaway-goods'
    },
    {
      tagname: 'receive-arrival-notice',
      page: 'receive-arrival-notice'
    },
    {
      tagname: 'receive-goods',
      page: 'receive-goods'
    },
    {
      tagname: 'receive-shipping-notice',
      page: 'receive-shipping-notice'
    },
    {
      tagname: 'receive-transport-order',
      page: 'receive-transport-order'
    },
    {
      tagname: 'summary-bill-amount',
      page: 'summary-bill-amount'
    },
    {
      tagname: 'update-claim-chit',
      page: 'update-claim-chit'
    },
    {
      tagname: 'vas-work-order',
      page: 'vas-work-order'
    }
  ],
  bootstrap
}
