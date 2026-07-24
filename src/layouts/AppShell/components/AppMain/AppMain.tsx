import { lazy, Suspense } from 'react'
import type { AppView } from '@/stores/app-store'
import { shellStyles } from '@/components/page-shell'
import { queryNavItem } from '../../config/nav-items'
import { PlaceholderView } from './PlaceholderView'
import styles from './AppMain.module.css'

/** 各功能页按需加载，首屏仅拉取聊天相关代码 */
const ChatPage = lazy(() =>
  import('@/features/chat/components/ChatPage').then((m) => ({ default: m.ChatPage }))
)
const BusinessPanel = lazy(() =>
  import('@/features/business/components/BusinessPanel/BusinessPanel').then((m) => ({
    default: m.BusinessPanel
  }))
)
const PublishWorkbench = lazy(() =>
  import('@/features/publish/components/PublishWorkbench').then((m) => ({
    default: m.PublishWorkbench
  }))
)
const SchedulePage = lazy(() =>
  import('@/features/schedule/components/SchedulePage').then((m) => ({ default: m.SchedulePage }))
)
const SettingsPage = lazy(() =>
  import('@/features/settings/components/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const SkillsPage = lazy(() =>
  import('@/features/skills/components/SkillsPage').then((m) => ({ default: m.SkillsPage }))
)
const ChannelsPage = lazy(() =>
  import('@/features/channels/components/ChannelsPage').then((m) => ({ default: m.ChannelsPage }))
)
const RulesPage = lazy(() =>
  import('@/features/rules/components/RulesPage').then((m) => ({ default: m.RulesPage }))
)
const WorkflowsPage = lazy(() =>
  import('@/features/workflows/components/WorkflowsPage').then((m) => ({
    default: m.WorkflowsPage
  }))
)

interface AppMainProps {
  view: AppView
}

/** 页面切换时的轻量占位，避免白屏 */
function PageFallback(): React.ReactElement {
  return (
    <div className={shellStyles.pageLoading} role="status" aria-live="polite">
      <div className={shellStyles.pageLoadingSpinner} aria-hidden />
      <span className={shellStyles.pageLoadingText}>加载中…</span>
    </div>
  )
}

/** 主内容区：按 view 路由到各 feature 页面 */
export function AppMain({ view }: AppMainProps): React.ReactElement {
  const placeholderNav = queryNavItem(view)

  return (
    <div className={styles.main}>
      <div className={styles.content}>
        <Suspense fallback={<PageFallback />}>
          {view === 'chat' && <ChatPage />}
          {view === 'business' && <BusinessPanel />}
          {view === 'publish' && <PublishWorkbench />}
          {view === 'schedule' && <SchedulePage />}
          {view === 'settings' && <SettingsPage />}
          {view === 'skills' && <SkillsPage />}
          {view === 'channels' && <ChannelsPage />}
          {view === 'rules' && <RulesPage />}
          {view === 'workflows' && <WorkflowsPage />}
          {placeholderNav?.placeholder && (
            <PlaceholderView icon={placeholderNav.icon} label={placeholderNav.label} />
          )}
        </Suspense>
      </div>
    </div>
  )
}
