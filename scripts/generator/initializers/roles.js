module.exports = async function initRoles(trxMgr, domain) {
  const { Role } = require('@things-factory/auth-base')
  const roleRepo = await trxMgr.getRepository(Role)

  return roleRepo.save([
    {
      name: 'Super Admin',
      description: 'full priviledge',
      domain
    },
    {
      name: 'Customer',
      description: 'Role for customers',
      domain
    }
  ])
}
