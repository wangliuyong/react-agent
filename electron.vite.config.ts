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
      // 单 chunk 超过 600 kB 时提示，便于持续优化
      chunkSizeWarningLimit: 600,
      // 首屏不预加载重型懒加载包（echarts / xyflow / markdown）
      modulePreload: {
        resolveDependencies(_filename, deps) {
          return deps.filter(
            (dep) =>
              !dep.includes('vendor-echarts') &&
              !dep.includes('vendor-xyflow') &&
              !dep.includes('vendor-markdown')
          )
        }
      },
      rollupOptions: {
        input: {
          index: resolve('src/index.html')
        },
        output: {
          /**
           * 仅拆分首屏不必加载的重型依赖；页面级拆分交给 React.lazy。
           * 避免 antd/react/dayjs 互引导致 circular chunk 警告。
           */
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('echarts')) return 'vendor-echarts'
            if (id.includes('@xyflow')) return 'vendor-xyflow'
            if (
              id.includes('react-markdown') ||
              id.includes('remark-gfm') ||
              id.includes('micromark') ||
              id.includes('mdast')
            ) {
              return 'vendor-markdown'
            }
            return undefined
          }
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
          },
          // message 走 App.useApp 代理，避免静态方法无法消费主题上下文
          {
            '@/lib/app-message': [['appMessage', 'message']]
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
