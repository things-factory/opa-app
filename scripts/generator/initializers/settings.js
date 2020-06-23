const settings = [
  { name: 'dashboard:CUST', description: 'dashboard for customer', category: 'board' },
  { name: 'dashboard:OFFICE ADMIN', description: 'dashboard for OFFICE ADMIN', category: 'board' },
  { name: 'dashboard:SYSTEM ADMIN', description: 'dashboard for SUPER ADMIN', category: 'board' },
  { name: 'dashboard:W/H MANAGER', description: 'dashboard for W/H MANAGER', category: 'board' },
  { name: 'location-label', description: 'board id for location label', category: 'board' },
  { name: 'pallet-label', description: 'board id for pallet label', category: 'board' },
  { name: 'rule-for-inventory-assignment', description: 'location sorting rules', category: 'location', value: '{"name":"ASC"}' },
  { name: 'pallet-id-rule', description: 'Pallet ID Rule', category: 'id-rule' }
]

module.exports = async function initSettings(trxMgr, domain) {
  const { Setting } = require('@things-factory/setting-base')
  const settingRepo = trxMgr.getRepository(Setting)
  return await settingRepo.save(
    settings.map(setting => {
      return {
        ...setting,
        domain
      }
    })
  )
}
