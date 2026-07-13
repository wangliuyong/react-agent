import type { Resolver } from 'unplugin-auto-import/types'

/** @ant-design/icons 图标后缀，用于识别可自动引入的图标组件 */
const ANT_DESIGN_ICON_SUFFIXES = ['Outlined', 'Filled', 'TwoTone'] as const

/**
 * @ant-design/icons 自动引入 resolver。
 * 识别以 Outlined / Filled / TwoTone 结尾的 PascalCase 组件名，按需从 @ant-design/icons 导入。
 */
export function antDesignIconsResolver(): Resolver {
  return {
    type: 'component',
    resolve(name) {
      const matched = ANT_DESIGN_ICON_SUFFIXES.some((suffix) => name.endsWith(suffix))
      if (!matched) return

      return {
        name,
        from: '@ant-design/icons'
      }
    }
  }
}
