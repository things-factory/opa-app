import { i18next } from '@things-factory/i18n-base'

export const WORKSHEET_TYPE = {
  UNLOADING: {
    name: i18next.t('label.unloading'),
    value: 'UNLOADING'
  },
  PUTAWAY: {
    name: i18next.t('label.putaway'),
    value: 'PUTAWAY'
  },
  CYCLE_COUNT: {
    name: i18next.t('label.cycle_count'),
    value: 'CYCLE_COUNT'
  },
  STOCK_TAKE: {
    name: i18next.t('label.stock_take'),
    value: 'STOCK_TAKE'
  },
  VAS: {
    name: i18next.t('label.vas'),
    value: 'VAS'
  },
  RETURN: {
    name: i18next.t('label.return'),
    value: 'RETURN'
  },
  PICKING: {
    name: i18next.t('label.picking'),
    value: 'PICKING'
  },
  LOADING: {
    name: i18next.t('label.loading'),
    value: 'LOADING'
  }
}

export const WORKSHEET_STATUS = {
  DEACTIVATED: {
    name: i18next.t('label.deactivated'),
    value: 'DEACTIVATED'
  },
  EXECUTING: {
    name: i18next.t('label.executing'),
    value: 'EXECUTING'
  },
  DONE: {
    name: i18next.t('label.done'),
    value: 'DONE'
  },
  ADJUSTED: {
    name: i18next.t('label.adjusted'),
    value: 'ADJUSTED'
  },
  PARTIALLY_UNLOADED: {
    name: i18next.t('label.partially_unloaded'),
    value: 'PARTIALLY_UNLOADED'
  },
  NOT_TALLY: {
    name: i18next.t('label.not_tally'),
    value: 'NOT_TALLY'
  }
}
