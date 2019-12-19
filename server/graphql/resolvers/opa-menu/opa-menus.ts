import { Priviledge } from '@things-factory/auth-base'
import { Menu } from '@things-factory/menu-base'
import { BizplaceUser, Bizplace } from '@things-factory/biz-base'
import { Equal, getRepository, In, IsNull } from 'typeorm'
import { getManagerRoles } from './get-manager-roles'

export const opaMenusResolver = {
  async opaMenus(_: any, _params: any, context: any) {
    let menus = []
    if (context && context.state && context.state.domain && context.state.domain.id) {
      const response = await getRepository(Menu).query(`
        SELECT
          category
        FROM
          priviledges
        WHERE id IN (
          SELECT
            DISTINCT(priviledges_id)
          FROM
            roles_priviledges
          WHERE
            roles_id IN (
              SELECT
                roles_id
              FROM
                users_roles
              WHERE
                users_id = '${context.state.user.id}'
            )
        ) AND NAME = 'role'
        AND domain_id = '${context.state.domain.id}'
    `)
      let userRoles = response.map((priviledge: Priviledge) => priviledge.category)
      userRoles.push(...(await getManagerRoles(context.state.user, context.state.domain)))

      if (userRoles.length) {
        menus = await getRepository(Menu).find({
          where: [
            {
              hiddenFlag: false,
              menuType: Equal('MENU'),
              domain: context.state.domain,
              category: In(userRoles)
            },
            {
              hiddenFlag: false,
              menuType: Equal('MENU'),
              domain: context.state.domain,
              category: IsNull()
            },
            {
              hiddenFlag: false,
              menuType: Equal('MENU'),
              domain: context.state.domain,
              category: ''
            }
          ],
          order: {
            rank: 'ASC'
          },
          relations: ['domain', 'parent', 'childrens']
        })

        menus = menus
          .map((groupMenu: Menu) => {
            return {
              ...groupMenu,
              childrens: groupMenu.childrens
                .filter(
                  (subMenu: Menu) =>
                    (!subMenu.hiddenFlag && userRoles.includes(subMenu.category)) ||
                    (!subMenu.hiddenFlag && !subMenu.category)
                )
                .sort((a: Menu, b: Menu) => a.rank - b.rank)
            }
          })
          .filter((groupMenu: Menu) => groupMenu.childrens && groupMenu.childrens.length)
      }
    }

    return menus
  }
}
