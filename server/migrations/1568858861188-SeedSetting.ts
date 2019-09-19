import { MigrationInterface, QueryRunner, getRepository } from 'typeorm'
import { Setting } from '@things-factory/setting-base'
import { Domain } from '@things-factory/shell'
// import { LOCATION_LABEL_SETTING_KEY, PALLET_LABEL_SETTING_KEY } from '../../client/label-setting-constants' <-- not work

const SEED_SETTINGS = [
  {
    name: 'opa-app:location-label',
    description: 'Location label ID',
    value: '',
    category: 'opa-app'
  },
  {
    name: 'opa-app:pallet-label',
    description: 'Pallet label ID',
    value: '',
    category: 'opa-app'
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
