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
      name: 'Domain Manager',
      description: 'Domain mananger priviledge',
      domain
    },
    {
      name: 'Bizplace Manager',
      description: 'Bizplace manager priviledge',
      domain
    }
  ])
}
