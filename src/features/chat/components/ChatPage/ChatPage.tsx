import { useElementStickToBottom } from '@/components/VirtualList'
import { useBrowserControl } from '@/features/browser'
import type { ChatMode } from '@/features/business'
import { useSettingsStore } from '@/features/settings'
import { useSkillsStore } from '@/features/skills'
import { queryNewChatShortcutLabel } from '@/layouts/AppShell/hooks'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '../../hooks/useSessionStore'
import { queryAgentStatusLabel } from '../../utils/agent-status'
import { queryIsTaskWorkflowSucceeded } from '../../utils/queryIsTaskWorkflowSucceeded'
import { WelcomeHero } from '../WelcomeHero'
import { MessageList } from '../MessageList'
import { ChatInput } from '../ChatInput'
import { TaskChecklist } from '../TaskChecklist'
import { shellStyles } from '@/components/page-shell'
import styles from './ChatPage.module.css'

const { Title } = Typography

/** 聊天页容器：灵犀助手独立页面；业务系统见 AppView business */
export function ChatPage(): React.ReactElement {
  const session = useSessionStore((s) => s.getActiveSession())
  const running = useSessionStore((s) => s.running)
  const awaitUserReason = useSessionStore((s) => s.awaitUserReason)
  const awaitUserChoices = useSessionStore((s) => s.awaitUserChoices)
  const streamingText = useSessionStore((s) => s.streamingText)
  const thinkingText = useSessionStore((s) => s.thinkingText)
  const thinkingInProgress = useSessionStore((s) => s.thinkingInProgress)
  const activeToolName = useSessionStore((s) => s.activeToolName)
  const activeToolArgs = useSessionStore((s) => s.activeToolArgs)
  const activeToolProgress = useSessionStore((s) => s.activeToolProgress)
  const activeModelLabel = useSessionStore((s) => s.activeModelLabel)
  const skills = useSkillsStore((s) => s.skills)
  const hydrateSkills = useSkillsStore((s) => s.hydrate)
  const sendMessage = useSessionStore((s) => s.sendMessage)
  const abort = useSessionStore((s) => s.abort)
  const continueRun = useSessionStore((s) => s.continueRun)
  const resumeRun = useSessionStore((s) => s.resumeRun)
  const canResume = useSessionStore((s) => s.canResume)
  const createSession = useSessionStore((s) => s.createSession)
  const settings = useSettingsStore((s) => s.settings)
  const settingsLoaded = useSettingsStore((s) => s.loaded)
  const { browserRunning, loading, toggleBrowser } = useBrowserControl()

  const setView = useAppStore((s) => s.setView)
  const newChatShortcut = queryNewChatShortcutLabel()

  /** 技能目录：用于「加载技能：名称」展示；未进技能页时也需有一份摘要 */
  useEffect(() => {
    if (skills.length === 0) void hydrateSkills()
  }, [skills.length, hydrateSkills])

  const skillNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const skill of skills) {
      map.set(skill.id, skill.name)
    }
    return map
  }, [skills])

  useEffect(() => {
    // 为什么：启动时 Store 先使用默认空 API Key，必须等待磁盘配置加载后再判断，
    // 否则已配置用户也会被短暂误导到设置页。
    if (!settingsLoaded) return

    const missingFields = [
      !settings.apiKey.trim() ? 'API Key' : null,
      !settings.baseUrl.trim() ? 'Base URL' : null
    ].filter((field): field is string => Boolean(field))

    if (missingFields.length === 0) return

    message.warning(`请先在设置中填写 ${missingFields.join('、')}`)
    setView('settings')
  }, [settings.apiKey, settings.baseUrl, settingsLoaded, setView])

  const messages = session?.messages ?? []
  const tasks = session?.tasks ?? []
  const isEmpty = messages.length === 0 && !streamingText && !running

  /** 消息区滚动容器：在 body 层统一滚动，便于与顶栏/输入区解耦 */
  const bodyRef = useRef<HTMLDivElement>(null)
  const { onScroll } = useElementStickToBottom(bodyRef, {
    enabled: !isEmpty,
    deps: [messages.length, streamingText, thinkingText, running, activeToolName, activeToolProgress, tasks]
  })

  const headerStatus = queryAgentStatusLabel({
    running,
    streamingText,
    activeToolName,
    activeToolArgs,
    skillNameById,
    activeToolProgress,
    awaitUserReason,
    activeModelLabel
  })

  const taskWorkflowSucceeded = queryIsTaskWorkflowSucceeded(session, running, awaitUserReason)
  const sendDisabledHint = taskWorkflowSucceeded
    ? '任务流程已执行完毕，如需新任务请新建会话'
    : undefined

  return (
    <div className={styles.page} data-task-checklist-anchor>
      <header className={`${styles.header} app-drag`}>
        {/* 左侧：会话标题（保留在拖拽区内，便于拖动窗口） */}
        <div className={styles.headerLeft}>
          <div className={styles.titleWrap}>
            <Title level={5} className={styles.title}>
              {session?.title ?? '新会话'}
            </Title>
            {!isEmpty && headerStatus ? (
              <span className={styles.headerStatus}>
                <span className={styles.statusDot} />
                {headerStatus}
              </span>
            ) : null}
          </div>
        </div>

        {/* 中部：智能助手 / 业务系统 切换（样式对齐技能页 Segmented） */}
        <div className={`${styles.headerCenter} app-no-drag`}>
          <Segmented<ChatMode>
            className={styles.modeSwitch}
            options={[
              { label: <span className={styles.modeLabel}>灵犀AI助手</span>, value: 'assistant' },
              { label: <span className={styles.modeLabel}>业务系统</span>, value: 'business' }
            ]}
            value="assistant"
            onChange={(value) => {
              if (value === 'business') setView('business')
            }}
          />
        </div>

        {/* 右侧：新会话、浏览器控制 */}
        <Space size={4} className={`${styles.headerRight} app-no-drag`}>
          <Tooltip title={`新会话 ${newChatShortcut}`}>
            <Button
              type="text"
              className={shellStyles.headerIconBtn}
              icon={<PlusOutlined />}
              onClick={() => void createSession()}
            />
          </Tooltip>
          <Tooltip title={browserRunning ? '关闭智能体浏览器' : '打开智能体浏览器'}>
            <Button
              type="text"
              className={shellStyles.headerIconBtn}
              icon={<GlobalOutlined />}
              loading={loading}
              data-active={browserRunning}
              onClick={() => void toggleBrowser()}
            />
          </Tooltip>
        </Space>
      </header>

      <TaskChecklist
        tasks={session?.tasks ?? []}
        sessionId={session?.id ?? null}
        visible={Boolean(session?.tasks?.length)}
        running={running}
        awaitUserReason={awaitUserReason}
        canResume={canResume}
        onAbort={() => void abort()}
        onContinue={() => void continueRun()}
        onResume={() => void resumeRun()}
      />

      <div ref={bodyRef} className={styles.body} data-empty={isEmpty} onScroll={onScroll}>
        <div className={styles.chatColumn}>
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
              thinkingText={thinkingText}
              thinkingInProgress={thinkingInProgress}
              tasks={session?.tasks ?? []}
              running={running}
              activeToolName={activeToolName}
              activeToolArgs={activeToolArgs}
              activeToolProgress={activeToolProgress}
              awaitUserReason={awaitUserReason}
              skillNameById={skillNameById}
            />
          )}
        </div>
      </div>

      <ChatInput
        disabled={taskWorkflowSucceeded}
        sendDisabledHint={sendDisabledHint}
        running={running}
        streamingText={streamingText}
        activeToolName={activeToolName}
        activeToolArgs={activeToolArgs}
        activeToolProgress={activeToolProgress}
        activeModelLabel={activeModelLabel}
        skillNameById={skillNameById}
        awaitUserReason={awaitUserReason}
        awaitUserChoices={awaitUserChoices}
        tokenUsed={session?.tokenUsed ?? 0}
        onSend={(text, paths) => void sendMessage(text, paths)}
        onAbort={() => void abort()}
        onContinue={(userInput, choiceId) => void continueRun({ userInput, choiceId })}
      />
    </div>
  )
}
