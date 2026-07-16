import type { AppView } from '@/stores/app-store'
import { ChatPage } from '@/features/chat'
import { BusinessPanel } from '@/features/business'
import { ChannelsPage } from '@/features/channels'
import { PublishWorkbench } from '@/features/publish'
import { SchedulePage } from '@/features/schedule'
import { SettingsPage } from '@/features/settings'
import { SkillsPage } from '@/features/skills'
import { RulesPage } from '@/features/rules'
import { WorkflowsPage } from '@/features/workflows'
import { queryNavItem } from '../../config/nav-items'
import { PlaceholderView } from './PlaceholderView'
import styles from './AppMain.module.css'

interface AppMainProps {
  view: AppView
}

/** 主内容区：按 view 路由到各 feature 页面 */
export function AppMain({ view }: AppMainProps): React.ReactElement {
  const placeholderNav = queryNavItem(view)

  return (
    <div className={styles.main}>
      <div className={styles.content}>
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
      </div>
    </div>
  )
}
