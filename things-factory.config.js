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
    }
  ],
  bootstrap
}
