import type { AppView } from '@/stores/app-store'
import { AppMain } from './components/AppMain'
import { Sidebar } from './components/Sidebar'
import styles from './AppShell.module.css'

interface AppShellProps {
  view: AppView
}

/** 应用壳层：侧边栏 + 主内容区编排，不含业务数据拉取 */
export function AppShell({ view }: AppShellProps): React.ReactElement {
  return (
    <div className={styles.shell}>
      <Sidebar view={view} />
      <AppMain view={view} />
    </div>
  )
}
