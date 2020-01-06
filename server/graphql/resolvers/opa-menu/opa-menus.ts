import { Role, User } from '@things-factory/auth-base'
import { Menu } from '@things-factory/menu-base'
import { Domain } from '@things-factory/shell'
import { getRepository, SelectQueryBuilder } from 'typeorm'

export const opaMenusResolver = {
  async opaMenus(_: any, _params: any, context: any) {
    let menus: Menu[] = []
    if (context?.state?.domain?.id && context?.state?.user?.id) {
      try {
        const user: User = await getRepository(User).findOne({
          where: { id: context.state.user.id },
          relations: ['roles', 'roles.domain']
        })

        const domainId: string = context.state.domain.id
        // get menus which are non-restricted by any role.
        menus.push(...(await getNonRestrictedMenus(domainId)))

        const userRoleIds: string[] = user.roles.map((role: Role) => role.id)
        if (userRoleIds?.length) {
          // get menus which are restricted by role ()
          menus.push(...(await getRestrictedMenus(domainId, userRoleIds)))
        }

        // get system menus which are restricted by role declared from system domain.
        if (!context?.state?.domain?.systemFlag) {
          const systemDomain: Domain = await getRepository(Domain).findOne({ where: { systemFlag: true } })
          const userSystemRoleIds: string[] = user.roles
            .filter((role: Role) => role.domain.id === systemDomain.id)
            .map((role: Role) => role.id)
          if (userSystemRoleIds?.length) {
            menus.push(...(await getRestrictedMenus(systemDomain.id, userSystemRoleIds)))
          }
        }

        return menus.filter((groupMenu: Menu) => groupMenu?.childrens?.length)
      } catch (e) {
        throw e
      }
    }
  }
}

async function getNonRestrictedMenus(domainId: string): Promise<Menu[]> {
  const qb: SelectQueryBuilder<Menu> = getRepository(Menu).createQueryBuilder()
  qb.leftJoinAndSelect('Menu.domain', 'domain')
    .leftJoinAndSelect('Menu.role', 'role')
    .leftJoinAndSelect('Menu.childrens', 'childrens')
    .where('"Menu"."hidden_flag" = :hiddenFlag')
    .andWhere('LOWER("Menu"."menu_type") = :menuType')
    .andWhere('"Menu"."domain_id" = :domainId')
    .andWhere(qb => {
      const subQuery: string = qb
        .subQuery()
        .select('Childrens.id', 'id')
        .from(Menu, 'Childrens')
        .andWhere('"Childrens"."hidden_flag" = :hiddenFlag')
        .andWhere('"Childrens"."role_id" ISNULL')
        .orderBy('"Childrens"."rank"')
        .getQuery()

      return `"childrens"."id" IN ${subQuery}`
    })
    .orderBy('Menu.rank')
    .setParameters({
      hiddenFlag: false,
      menuType: 'menu',
      domainId
    })

  return await qb.getMany()
}

async function getRestrictedMenus(domainId: string, roleIds: string[]): Promise<Menu[]> {
  const qb: SelectQueryBuilder<Menu> = getRepository(Menu).createQueryBuilder()
  qb.leftJoinAndSelect('Menu.domain', 'domain')
    .leftJoinAndSelect('Menu.role', 'role')
    .leftJoinAndSelect('Menu.childrens', 'childrens')
    .where('"Menu"."hidden_flag" = :hiddenFlag')
    .andWhere('LOWER("Menu"."menu_type") = :menuType')
    .andWhere('"Menu"."domain_id" = :domainId')
    .andWhere(qb => {
      const subQuery: string = qb
        .subQuery()
        .select('Childrens.id', 'id')
        .from(Menu, 'Childrens')
        .andWhere('"Childrens"."hidden_flag" = :hiddenFlag')
        .andWhere('"Childrens"."role_id" IN (:...roleIds)')
        .orderBy('"Childrens"."rank"')
        .getQuery()

      return `"childrens"."id" IN ${subQuery}`
    })
    .orderBy('Menu.rank')
    .setParameters({
      hiddenFlag: false,
      menuType: 'menu',
      domainId,
      roleIds
    })

  return await qb.getMany()
}
