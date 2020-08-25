import { MigrationInterface, QueryRunner, getRepository } from 'typeorm'
import { Setting } from '@things-factory/setting-base'
import { Domain } from '@things-factory/shell'
import { LOCATION_LABEL_SETTING_KEY, PALLET_LABEL_SETTING_KEY, REUSABLE_PALLET_LABEL_SETTING_KEY } from '..//opa-app-setting-constants'

const SEED_SETTINGS = [
  {
    name: LOCATION_LABEL_SETTING_KEY,
    description: 'Location label ID',
    value: '',
    category: 'board'
  },
  {
    name: PALLET_LABEL_SETTING_KEY,
    description: 'Pallet label ID',
    value: '',
    category: 'board'
  },
  {
    name: REUSABLE_PALLET_LABEL_SETTING_KEY,
    description: 'Reusable pallet label ID',
    value: '',
    category: 'board'
  }
]

export class SeedSetting1568858861188 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const repository = getRepository(Setting)
    const domainRepository = getRepository(Domain)
    const domain = await domainRepository.findOne({ name: 'SYSTEM' })

    try {
      SEED_SETTINGS.forEach(async setting => {
        await repository.save({ ...setting, domain })
      })
    } catch (e) {
      console.error(e)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const repository = getRepository(Setting)

    SEED_SETTINGS.reverse().forEach(async setting => {
      let record = await repository.findOne({ name: setting.name })
      await repository.remove(record)
    })
  }
}
