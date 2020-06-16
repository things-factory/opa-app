import { i18next } from '@things-factory/i18n-base'

export const VAS_BATCH_NO_TYPE = 'BATCH_NO'
export const VAS_PRODUCT_TYPE = 'PRODUCT'
export const VAS_BATCH_AND_PRODUCT_TYPE = 'BATCH_AND_PRODUCT_TYPE'
export const VAS_ETC_TYPE = 'ETC'

export const VAS_TARGET_TYPES = [
  { display: '', value: '' },
  { display: i18next.t('label.batch_no'), value: VAS_BATCH_NO_TYPE },
  { display: i18next.t('label.product'), value: VAS_PRODUCT_TYPE },
  { display: i18next.t('label.batch_and_product'), value: VAS_BATCH_AND_PRODUCT_TYPE },
  { display: i18next.t('label.etc'), value: VAS_ETC_TYPE }
]
