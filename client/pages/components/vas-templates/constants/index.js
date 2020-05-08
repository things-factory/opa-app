import { i18next } from '@things-factory/i18n-base'

export const PACKING_UNIT_WEIGHT = {
  value: 'WEIGHT',
  display: i18next.t('label.weight')
}
export const PACKING_UNIT_QTY = {
  value: 'QTY',
  display: i18next.t('label.qty')
}

export const PACKING_UNITS = [PACKING_UNIT_QTY, PACKING_UNIT_WEIGHT]
