let privileges = [
  { name: 'query', category: 'bizplace', description: 'to read bizplace data' },
  { name: 'mutation', category: 'bizplace', description: 'to edit bizplace data' },
  { name: 'query', category: 'claim', description: 'read claim data' },
  { name: 'mutation', category: 'claim', description: 'edit claim data' },
  { name: 'query', category: 'company', description: 'to read company data' },
  { name: 'mutation', category: 'company', description: 'to edit company data' },
  { name: 'mutation', category: 'contact_point', description: 'to edit contact point data' },
  { name: 'query', category: 'contact_point', description: 'to read contact point data' },
  { name: 'query', category: 'customer', description: 'to read contact point data' },
  { name: 'mutation', category: 'customer', description: 'to edit contact point data' },
  { name: 'role', category: 'customer', description: 'to read customer side data' },
  { name: 'query', category: 'inventory', description: 'to read inventory data' },
  { name: 'mutation', category: 'inventory', description: 'to edit inventory data' },
  { name: 'mutation', category: 'inventory_adjustment_approval', description: 'to approve/reject inventory data' },
  { name: 'query', category: 'movement', description: 'to read movement data' },
  { name: 'mutation', category: 'movement', description: 'to edit movement data' },
  { name: 'query', category: 'order', description: 'read order data' },
  { name: 'mutation', category: 'order', description: 'edit order data' },
  { name: 'mutation', category: 'order_customer', description: 'to edit order data on customer side' },
  { name: 'query', category: 'order_customer', description: 'to read order data on customer side' },
  { name: 'mutation', category: 'order_warehouse', description: 'to edit order data on warehouse side' },
  { name: 'query', category: 'order_warehouse', description: 'to read order data on warehouse side' },
  { name: 'role', category: 'owner', description: 'to read owner side data' },
  { name: 'mutation', category: 'setting', description: 'to edit setting data' },
  { name: 'query', category: 'setting', description: 'to read setting data' },
  { name: 'query', category: 'transport', description: 'to read transport data' },
  { name: 'mutation', category: 'transport', description: 'to edit transport data' },
  { name: 'query', category: 'user', description: 'to read user data' },
  { name: 'mutation', category: 'user', description: 'to edit user data' },
  { name: 'query', category: 'vas', description: 'read order data' },
  { name: 'mutation', category: 'vas', description: 'edit order data' },
  { name: 'query', category: 'vendor', description: 'to read contact point data' },
  { name: 'mutation', category: 'vendor', description: 'to edit contact point data' },
  { name: 'mutation', category: 'warehouse', description: 'to edit warehouse data' },
  { name: 'query', category: 'warehouse', description: 'to read warehouse data' },
  { name: 'role', category: 'warehouse', description: 'to read warehouse operations' },
  { name: 'mutation', category: 'worker', description: 'to edit worker data' },
  { name: 'query', category: 'worker', description: 'to read worker data' },
  { name: 'query', category: 'worksheet', description: 'to read worksheet data' },
  { name: 'mutation', category: 'worksheet', description: 'to edit worksheet data' },
  { name: 'mutation', category: 'worksheet_control', description: 'to edit worksheet activation data' },
  { name: 'query', category: 'worksheet_control', description: 'to read worksheet activation data' },
  { name: 'mutation', category: 'worksheet_execute', description: 'to edit worksheet execution data' },
  { name: 'query', category: 'worksheet_execute', description: 'to read worksheet execution data' }
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
