import { i18next } from '@things-factory/i18n-base'

export const BATCH_NO_TYPE = 'BATCH_NO'
export const PRODUCT_TYPE = 'PRODUCT'
export const ETC_TYPE = 'ETC'

export const TARGET_TYPES = [
  { display: '', value: '' },
  { display: i18next.t('label.batch_no'), value: BATCH_NO_TYPE },
  { display: i18next.t('label.product'), value: PRODUCT_TYPE },
  { display: i18next.t('label.etc'), value: ETC_TYPE },
]
