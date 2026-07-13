/// <reference types="vite/client" />

import type { ElectronApi } from '../shared/types'

declare global {
  interface Window {
    api: ElectronApi
  }

  /** 自动引入 React 后，保留 React.* 类型写法（如 React.ReactElement） */
  namespace React {
    type ReactElement = import('react').ReactElement
    type ReactNode = import('react').ReactNode
    type FC<P = object> = import('react').FC<P>
    type PropsWithChildren<P = object> = import('react').PropsWithChildren<P>
  }
}

export {}
