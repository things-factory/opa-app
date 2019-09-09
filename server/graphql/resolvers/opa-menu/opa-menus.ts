import { Priviledge } from '@things-factory/auth-base'
import { Menu } from '@things-factory/menu-base'
import { Equal, getRepository, In, IsNull } from 'typeorm'

export const opaMenusResolver = {
  async opaMenus(_: any, params: any, context: any) {
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
    const userRoles = response.map((priviledge: Priviledge) => priviledge.category)

    const menus = await getRepository(Menu).find({
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
        }
      ],
      order: {
        rank: 'ASC'
      },
      relations: ['domain', 'parent', 'childrens']
    })

    return menus.map((menu: Menu) => {
      return {
        ...menu,
        childrens: menu.childrens.filter((subMenu: Menu) => userRoles.includes(subMenu.category) || !subMenu.category)
      }
    })
  }
}
