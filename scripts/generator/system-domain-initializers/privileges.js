let privileges = [
  { name: 'mutation', category: 'bizplace', description: 'to edit bizplace data' },
  { name: 'query', category: 'bizplace', description: 'to read bizplace data' },
  { name: 'mutation', category: 'company', description: 'to edit company data' },
  { name: 'query', category: 'company', description: 'to read company data' },
  { name: 'mutation', category: 'contact_point', description: 'to edit contact point data' },
  { name: 'query', category: 'contact_point', description: 'to read contact point data' },
  { name: 'mutation', category: 'claim', description: 'edit claim data' },
  { name: 'query', category: 'claim', description: 'read claim data' },
  { name: 'mutation', category: 'inventory', description: 'to edit inventory data' },
  { name: 'query', category: 'inventory', description: 'to read inventory data' },
  { name: 'mutation', category: 'movement', description: 'to edit movement data' },
  { name: 'query', category: 'movement', description: 'to read movement data' },
  { name: 'mutation', category: 'order', description: 'edit order data' },
  { name: 'query', category: 'order', description: 'read order data' },
  { name: 'mutation', category: 'setting', description: 'to edit setting data' },
  { name: 'query', category: 'setting', description: 'to read setting data' },
  { name: 'mutation', category: 'transport', description: 'to edit transport data' },
  { name: 'query', category: 'transport', description: 'to read transport data' },
  { name: 'mutation', category: 'user', description: 'to edit user data' },
  { name: 'query', category: 'user', description: 'to read user data' },
  { name: 'mutation', category: 'vas', description: 'edit vas data' },
  { name: 'query', category: 'vas', description: 'read vas data' },
  { name: 'mutation', category: 'warehouse', description: 'to edit warehouse data' },
  { name: 'query', category: 'warehouse', description: 'to read warehouse data' },
  { name: 'mutation', category: 'worker', description: 'to edit worker data' },
  { name: 'query', category: 'worker', description: 'to read worker data' }
]

module.exports = async function initPrivileges(trxMgr, domain) {
  const { Priviledge } = require('@things-factory/auth-base')
  const privilegeRepo = trxMgr.getRepository(Priviledge)
  return await privilegeRepo.save(
    privileges.map(p => {
      return {
        ...p,
        domain
      }
    })
  )
}
