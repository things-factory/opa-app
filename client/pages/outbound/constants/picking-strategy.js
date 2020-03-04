import { i18next } from '@things-factory/i18n-base'

export const PICKING_STRATEGY = [
  {
    name: i18next.t('label.fifo'),
    value: 'FIFO'
  },
  {
    name: i18next.t('label.lilo'),
    value: 'LILO'
  }
]
