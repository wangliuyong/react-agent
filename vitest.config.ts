import { defineConfig } from 'vitest/config'

/**
 * 统一从根目录 tests/ 收集单测，与业务源码分离。
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node'
  }
})
