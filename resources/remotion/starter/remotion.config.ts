import { Config } from '@remotion/cli/config'

/** 渲染输出覆盖同名文件，避免 Agent 重复渲染失败 */
Config.setOverwriteOutput(true)
Config.setVideoImageFormat('jpeg')
