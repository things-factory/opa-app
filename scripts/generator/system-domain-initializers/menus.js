let menus = [
  {
    name: 'System',
    menuType: 'MENU',
    childrens: [
      {
        name: 'Partner',
        template: 'partner-list',
        menuType: 'SCREEN',
        roleName: 'Domain Manager',
        routingType: 'STATIC',
        resourceUrl: 'partners'
      },
      {
        name: 'Role',
        template: 'system-role',
        menuType: 'SCREEN',
        roleName: 'Domain Manager',
        routingType: 'STATIC',
        resourceUrl: 'roles'
      },
      {
        name: 'Menu',
        template: 'menu-management',
        menuType: 'SCREEN',
        roleName: 'Domain Manager',
        routingType: 'STATIC',
        resourceUrl: 'menus'
      },
      {
        name: 'Code',
        template: 'code-management',
        menuType: 'SCREEN',
        roleName: 'Domain Manager',
        routingType: 'STATIC',
        resourceUrl: 'codes'
      },
      {
        name: 'Setting',
        template: 'system-setting',
        menuType: 'SCREEN',
        roleName: 'Domain Manager',
        routingType: 'STATIC',
        resourceUrl: 'settings'
      },
      {
        name: 'User',
        template: 'system-user',
        menuType: 'SCREEN',
        roleName: 'Bizplace Manager',
        routingType: 'STATIC',
        resourceUrl: 'users'
      }
    ]
  }
]

module.exports = async function initMenus(trxMgr, domain) {
  const { Menu } = require('@things-factory/menu-base')
  const { Role } = require('@things-factory/auth-base')
  const menuRepo = trxMgr.getRepository(Menu)
  const roleRepo = trxMgr.getRepository(Role)

  await Promise.all(
    menus.map(async (menuGroup, idx) => {
      const parent = await menuRepo.save({
        ...menuGroup,
        domain,
        rank: (idx + 1) * 10
      })

      await menuRepo.save(
        await Promise.all(
          menuGroup.childrens.map(async (children, idx) => {
            return {
              ...children,
              domain,
              parent,
              role: await roleRepo.findOne({
                where: {
                  domain,
                  name: children.roleName
                }
              }),
              rank: (idx + 1) * 10
            }
          })
        )
      )
    })
  )
}
