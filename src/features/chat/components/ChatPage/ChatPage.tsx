import { Segmented, Space, Typography, Button, Tooltip } from 'antd'
import { FormOutlined, GlobalOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { useBrowserControl } from '@/features/browser'
import { queryNewChatShortcutLabel } from '@/layouts/AppShell/hooks'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '../../hooks/useSessionStore'
import { queryAgentStatusLabel } from '../../utils/agent-status'
import { WelcomeHero } from '../WelcomeHero'
import { MessageList } from '../MessageList'
import { ChatInput } from '../ChatInput'
import { TaskChecklist } from '../TaskChecklist'
import styles from './ChatPage.module.css'

const { Title } = Typography

/** 聊天页容器：编排 store 与展示组件 */
export function ChatPage(): React.ReactElement {
  const session = useSessionStore((s) => s.getActiveSession())
  const running = useSessionStore((s) => s.running)
  const awaitUserReason = useSessionStore((s) => s.awaitUserReason)
  const streamingText = useSessionStore((s) => s.streamingText)
  const activeToolName = useSessionStore((s) => s.activeToolName)
  const sendMessage = useSessionStore((s) => s.sendMessage)
  const abort = useSessionStore((s) => s.abort)
  const continueRun = useSessionStore((s) => s.continueRun)
  const resumeRun = useSessionStore((s) => s.resumeRun)
  const canResume = useSessionStore((s) => s.canResume)
  const createSession = useSessionStore((s) => s.createSession)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const { browserRunning, loading, toggleBrowser } = useBrowserControl()

  const newChatShortcut = queryNewChatShortcutLabel()

  const messages = session?.messages ?? []
  const isEmpty = messages.length === 0 && !streamingText && !running

  const headerStatus = queryAgentStatusLabel({
    running,
    streamingText,
    activeToolName,
    awaitUserReason
  })

  return (
    <div className={styles.page}>
      <header className={`${styles.header} app-drag`}>
        <div className={styles.headerLeft}>
          <Space size={4} className="app-no-drag">
            <Tooltip title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}>
              <Button
                type="text"
                className={styles.headerIconBtn}
                icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={toggleSidebar}
              />
            </Tooltip>
            <Tooltip title={`新对话 ${newChatShortcut}`}>
              <Button
                type="text"
                className={styles.headerIconBtn}
                icon={<FormOutlined />}
                onClick={() => void createSession()}
              />
            </Tooltip>
          </Space>
          <div className={styles.titleWrap}>
            <Title level={5} className={`${styles.title} app-no-drag`}>
              {session?.title ?? '新对话'}
            </Title>
            {isEmpty ? (
              <span className={`${styles.disclaimer} app-no-drag`}>AI 生成可能出错 注意核实</span>
            ) : headerStatus ? (
              <span className={`${styles.headerStatus} app-no-drag`}>
                <span className={styles.statusDot} />
                {headerStatus}
              </span>
            ) : null}
          </div>
        </div>
        <div className="app-no-drag">
          <Segmented
            options={[
              { label: '智能助手', value: 'assistant' }
            ]}
            value="assistant"
          />
        </div>
        <Space className="app-no-drag">
          <Tooltip title="文档">
            <Button type="text" icon={<FormOutlined />} />
          </Tooltip>
          <Tooltip title={browserRunning ? '关闭智能体浏览器' : '打开智能体浏览器'}>
            <Button
              type={browserRunning ? 'primary' : 'text'}
              icon={<GlobalOutlined />}
              loading={loading}
              onClick={() => void toggleBrowser()}
            />
          </Tooltip>
        </Space>
      </header>

      <TaskChecklist
        tasks={session?.tasks ?? []}
        visible={Boolean(session?.tasks?.length)}
        running={running}
        awaitUserReason={awaitUserReason}
        canResume={canResume}
        onAbort={() => void abort()}
        onContinue={() => void continueRun()}
        onResume={() => void resumeRun()}
      />

      <div className={styles.body} data-empty={isEmpty}>
        {isEmpty ? (
          <WelcomeHero
            onPick={(prompt) => {
              void sendMessage(prompt)
            }}
          />
        ) : (
          <MessageList
            messages={messages}
            streamingText={streamingText}
            tasks={session?.tasks ?? []}
            running={running}
            activeToolName={activeToolName}
          />
        )}
      </div>

      <ChatInput
        running={running}
        streamingText={streamingText}
        activeToolName={activeToolName}
        awaitUserReason={awaitUserReason}
        tokenUsed={session?.tokenUsed ?? 0}
        onSend={(text, paths) => void sendMessage(text, paths)}
        onAbort={() => void abort()}
        onContinue={() => void continueRun()}
      />
    </div>
  )
}
