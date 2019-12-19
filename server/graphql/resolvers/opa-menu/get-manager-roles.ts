import { User } from '@things-factory/auth-base'
import { Bizplace, Manager } from '@things-factory/biz-base'
import { Domain } from '@things-factory/shell'
import { getRepository, IsNull, Repository } from 'typeorm'

export async function getManagerRoles(user: User, currentDomain: Domain): Promise<string[]> {
  const managerRepo: Repository<Manager> = getRepository(Manager)

  const count: number = await managerRepo.count({
    where: { user }
  })

  if (count) {
    const bizplace: Bizplace = await getRepository(Bizplace).findOne({ where: { domain: currentDomain } })
    let managerRoles: Manager[] = []
    // Get non-restricted managers
    managerRoles.push(
      ...(await managerRepo.find({
        user,
        bizplace: IsNull()
      }))
    )

    // Get bizplace restricted managers
    managerRoles.push(
      ...(await managerRepo.find({
        user,
        bizplace
      }))
    )

    return managerRoles.map(managerRole => managerRole.type)
  } else {
    return []
  }
}
