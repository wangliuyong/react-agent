import { Segmented, Space, Typography, Button, Tooltip } from 'antd'
import { GlobalOutlined, FormOutlined } from '@ant-design/icons'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '../hooks/useSessionStore'
import { WelcomeHero } from './WelcomeHero'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { TaskChecklist } from './TaskChecklist'
import styles from './ChatPage.module.css'

const { Title } = Typography

/** 聊天页容器：编排 store 与展示组件 */
export function ChatPage(): React.ReactElement {
  const session = useSessionStore((s) => s.getActiveSession())
  const running = useSessionStore((s) => s.running)
  const awaitUserReason = useSessionStore((s) => s.awaitUserReason)
  const streamingText = useSessionStore((s) => s.streamingText)
  const sendMessage = useSessionStore((s) => s.sendMessage)
  const abort = useSessionStore((s) => s.abort)
  const continueRun = useSessionStore((s) => s.continueRun)
  const setBrowserOpen = useAppStore((s) => s.setBrowserOpen)
  const browserOpen = useAppStore((s) => s.browserOpen)

  const messages = session?.messages ?? []
  const isEmpty = messages.length === 0 && !streamingText

  return (
    <div className={styles.page}>
      <header className={`${styles.header} app-drag`}>
        <Title level={5} className={`${styles.title} app-no-drag`}>
          {session?.title ?? '新对话'}
        </Title>
        <div className="app-no-drag">
          <Segmented
            options={[
              { label: '智能助手', value: 'assistant' },
              { label: '业务系统', value: 'biz' }
            ]}
            value="assistant"
          />
        </div>
        <Space className="app-no-drag">
          <Tooltip title="文档">
            <Button type="text" icon={<FormOutlined />} />
          </Tooltip>
          <Tooltip title={browserOpen ? '收起浏览器' : '打开智能体浏览器'}>
            <Button
              type={browserOpen ? 'primary' : 'text'}
              icon={<GlobalOutlined />}
              onClick={() => setBrowserOpen(!browserOpen)}
            />
          </Tooltip>
        </Space>
      </header>

      <div className={styles.body}>
        <TaskChecklist tasks={session?.tasks ?? []} visible={Boolean(session?.tasks?.length)} />
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
          />
        )}
      </div>

      <ChatInput
        running={running}
        awaitUserReason={awaitUserReason}
        tokenUsed={session?.tokenUsed ?? 0}
        onSend={(text, paths) => void sendMessage(text, paths)}
        onAbort={() => void abort()}
        onContinue={() => void continueRun()}
      />
    </div>
  )
}
