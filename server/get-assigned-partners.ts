import { getRepository } from 'typeorm'
import { User } from '@things-factory/auth-base'
import { AssignBizplacesUsers } from './entities'
export async function getAssignedPartners({ user }: { user: User }) {
  const repo = getRepository(AssignBizplacesUsers)
  const relations = ['partner', 'partner.partnerBizplace']

  const assignedPartners = await repo.find({
    where: {
      user
    },
    relations
  })

  return assignedPartners?.map(ap => {
    return {
      ...ap?.partner?.partnerBizplace
    }
  })
}
