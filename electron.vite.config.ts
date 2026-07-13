import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
import AntdResolver from 'unplugin-auto-import-antd'
import { antDesignIconsResolver } from './config/auto-import-resolvers'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('electron/main/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('electron/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    root: resolve('src'),
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve('src'),
        '@shared': resolve('shared')
      }
    },
    plugins: [
      react(),
      AutoImport({
        // 仅处理 renderer 层 React 源码
        include: [/\.[jt]sx?$/],
        // React Hooks / API + antd 组件 + @ant-design/icons 图标
        imports: [
          'react',
          {
            react: [['default', 'React']]
          }
        ],
        resolvers: [AntdResolver(), antDesignIconsResolver()],
        // 生成 TS 类型声明，供 IDE 与 tsc 识别自动引入的符号
        dts: resolve('src/auto-imports.d.ts'),
        // 将自动引入的包纳入 Vite 预构建，避免 dev 冷启动反复解析
        viteOptimizeDeps: true
      })
    ]
  }
})
