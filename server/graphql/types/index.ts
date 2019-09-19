import * as OpaMenu from './opa-menu'
import * as LabelSetting from './label-setting'

export const queries = [OpaMenu.Query, LabelSetting.Query]

export const types = [...OpaMenu.Types, ...LabelSetting.Types]
