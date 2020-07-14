import { User } from '@things-factory/auth-base'
import { Partner } from '@things-factory/biz-base'
import { Column, Entity, Index, PrimaryGeneratedColumn, JoinTable, ManyToOne } from 'typeorm'

@Entity()
@Index(
  'ix_assign-bizplaces_users_0',
  (assignBizplacesUsers: AssignBizplacesUsers) => [assignBizplacesUsers.user, assignBizplacesUsers.partner],
  { unique: true }
)
export class AssignBizplacesUsers {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(type => User)
  @JoinTable()
  user: User

  @ManyToOne(type => Partner)
  @JoinTable()
  partner: Partner
}
