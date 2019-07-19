import { isMobileDevice } from '@things-factory/shell'

export default function route(page) {
  switch (page) {
    case 'index':
      return isMobileDevice() ? 'menu-list' : 'opa-home'

    case 'opa-home':
      import('./pages/opa-home')
      return page
  }
}
