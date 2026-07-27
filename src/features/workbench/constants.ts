/** 应用版本号：与 package.json 对齐，供工作台运行信息展示 */
import appManifest from '../../../package.json'

export const WORKBENCH_APP_VERSION = appManifest.version as string
