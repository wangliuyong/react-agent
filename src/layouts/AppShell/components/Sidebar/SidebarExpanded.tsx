import type { AppView } from '@/stores/app-store'
import { NAV_ITEMS } from '../../config/nav-items'
import type { SessionHistoryItem } from '../../types'
import { SidebarBrand } from './SidebarBrand'
import { SidebarFooter } from './SidebarFooter'
import { SidebarHistory } from './SidebarHistory'
import { SidebarNav } from './SidebarNav'
import { SidebarNewChatButton } from './SidebarNewChatButton'

interface SidebarExpandedProps {
  view: AppView
  historyItems: SessionHistoryItem[]
  activeSessionId: string | null
  isFreshChatSession: boolean
  onNavigate: (view: AppView) => void
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onCreateSession: () => void
  onToggleCollapse: () => void
}

/** 展开态侧边栏：完整导航 + 历史对话 */
export function SidebarExpanded({
  view,
  historyItems,
  activeSessionId,
  isFreshChatSession,
  onNavigate,
  onSelectSession,
  onDeleteSession,
  onCreateSession,
  onToggleCollapse
}: SidebarExpandedProps): React.ReactElement {
  return (
    <>
      <SidebarBrand />
      <SidebarNewChatButton active={isFreshChatSession} onCreate={onCreateSession} />
      <SidebarNav items={NAV_ITEMS} activeView={view} onNavigate={onNavigate} />
      <SidebarHistory
        items={historyItems}
        activeSessionId={activeSessionId}
        activeView={view}
        isFreshChatSession={isFreshChatSession}
        onSelect={onSelectSession}
        onDelete={onDeleteSession}
      />
      <SidebarFooter
        activeView={view}
        onNavigate={onNavigate}
        onToggleCollapse={onToggleCollapse}
      />
    </>
  )
}
