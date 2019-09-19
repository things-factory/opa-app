import { LabelSetting } from './label-setting'

export const Query = /* GraphQL */ `
  labelSettings(names: [String]): [LabelSetting]
`
export const Types = [LabelSetting]
