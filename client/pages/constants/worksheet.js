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
  CYCLE_COUNT_RECHECK: {
    name: i18next.t('label.cycle_count_recheck'),
    value: 'CYCLE_COUNT_RECHECK'
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
  },
  UNLOADING_RETURN: {
    name: i18next.t('label.unloading_return'),
    value: 'UNLOADING_RETURN'
  },
  PUTAWAY_RETURN: {
    name: i18next.t('label.putaway_return'),
    value: 'PUTAWAY_RETURN'
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
  PENDING_APPROVAL: {
    name: 'pending_approval',
    value: 'PENDING_APPROVAL'
  },
  PENDING_ADJUSTMENT: {
    name: 'pending_adjustment',
    value: 'PENDING_ADJUSTMENT'
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

export const getWorksheetStatusCandidates = function (worksheetType) {
  if (!worksheetType) throw new Error('There is no worksheet type')

  switch (worksheetType) {
    case WORKSHEET_TYPE.CYCLE_COUNT:
      return [
        WORKSHEET_STATUS.DEACTIVATED,
        WORKSHEET_STATUS.EXECUTING,
        WORKSHEET_STATUS.DONE,
        WORKSHEET_STATUS.ADJUSTED,
        WORKSHEET_STATUS.NOT_TALLY
      ]

    default:
      throw new Error('Failed to find via passed order type')
  }
}
