import { i18next } from '@things-factory/i18n-base'

export const PACKING_UNIT_STDUNIT = {
  value: 'STDUNIT',
  display: i18next.t('label.std_unit_value')
}

export const PACKING_UNIT_QTY = {
  value: 'QTY',
  display: i18next.t('label.qty')
}

export const PACKING_UNITS = [PACKING_UNIT_QTY, PACKING_UNIT_STDUNIT]

export const WOODEN_PALLET = {
  value: 'WOODEN_PALLET',
  display: i18next.t('label.wooden_pallet')
}

export const REUSABLE_PALLET = {
  value: 'REUSABLE_PALLET',
  display: i18next.t('label.reusable_pallet')
}

export const PALLET_TYPES = [WOODEN_PALLET, REUSABLE_PALLET]
