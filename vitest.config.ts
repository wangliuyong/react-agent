import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

/**
 * 统一从根目录 tests/ 收集单测，与业务源码分离。
 * 与 electron-vite 保持相同的 @shared 别名，便于直接测 renderer 源码。
 */
export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve('shared')
    }
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node'
  }
})
