import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ChatMessage, MessageRole, Session, SessionType, WorkflowRunStatus } from '@shared/types'
import { querySessionType } from '@/features/chat'
import type { NodeExecutionContext, SessionContextSummary } from '../../types'
import {
  RELATED_MESSAGES_PURPOSE,
  formatContextJson,
  queryMessageRoleTooltip,
  querySessionTypeLabel,
  queryTaskStatusColor,
  queryTaskStatusLabel
} from '../../utils/sessionContext'
import styles from './SessionContextDrawer.module.css'

export interface SessionContextDrawerProps {
  open: boolean
  loading: boolean
  contextSummary: SessionContextSummary | null
  nodeContexts: NodeExecutionContext[]
  onClose: () => void
}

/** 抽屉顶部分段：概览看全局，节点看执行轨迹 */
type DrawerPane = 'overview' | 'nodes'

/** 节点详情子分段 */
type NodeDetailPane = 'input' | 'output' | 'context' | 'notify' | 'messages'

/** 格式化 Unix 毫秒为本地完整时间 */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** 复制文本到剪贴板并提示 */
function postCopyText(text: string, successTip = '已复制'): void {
  void navigator.clipboard.writeText(text).then(
    () => message.success(successTip),
    () => message.error('复制失败')
  )
}

/** 默认选中：优先失败 → 执行中 → 末节点 */
function queryDefaultNodeId(nodes: NodeExecutionContext[]): string | null {
  if (nodes.length === 0) return null
  const failed = nodes.find((n) => n.task.status === 'failed')
  if (failed) return failed.task.id
  const running = nodes.find((n) => n.task.status === 'running')
  if (running) return running.task.id
  return nodes[nodes.length - 1]?.task.id ?? null
}

function querySessionToneClass(type: SessionType): string {
  switch (type) {
    case 'publish':
      return styles.tonePublish
    case 'schedule':
      return styles.toneSchedule
    case 'workflow':
      return styles.toneWorkflow
    default:
      return styles.toneChat
  }
}

/** 工作流运行状态 → Ant Tag color */
function queryWorkflowRunStatusColor(status: WorkflowRunStatus): string {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'error'
    case 'running':
      return 'processing'
    case 'awaiting_user':
      return 'warning'
    default:
      return 'default'
  }
}

function queryRoleToneClass(role: MessageRole): string {
  switch (role) {
    case 'user':
      return styles.roleUser
    case 'assistant':
      return styles.roleAssistant
    case 'tool':
      return styles.roleTool
    default:
      return styles.roleSystem
  }
}

/**
 * 可复制的 JSON / 文本块
 * 布局对齐关联消息：标签在卡片上方，右侧复制，正文统一限高滚动
 */
function CodeBlock({
  value,
  label = '内容',
  emptyHint = '{}',
  hint
}: {
  value: string
  /** 卡片上方标题，对应消息里的角色名位置 */
  label?: string
  emptyHint?: string
  /** 可选说明，悬停在 label 上展示 */
  hint?: string
}): React.ReactElement {
  const text = value?.trim() ? value : emptyHint

  return (
    <article className={styles.messageItem}>
      <header className={styles.messageMeta}>
        {hint ? (
          <Tooltip title={hint} placement="topLeft">
            <span className={`${styles.codeLabel} ${styles.hintUnderline}`} tabIndex={0}>
              {label}
            </span>
          </Tooltip>
        ) : (
          <span className={styles.codeLabel}>{label}</span>
        )}
        <div className={styles.messageMetaActions}>
          <Tooltip title="复制">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => postCopyText(text)}
              aria-label={`复制${label}`}
            />
          </Tooltip>
        </div>
      </header>
      <div className={styles.messageCard}>
        <pre className={`${styles.messageBody} ${styles.codeBody}`}>{text}</pre>
      </div>
    </article>
  )
}

/** 角色名 Tooltip */
function MessageRoleLabel({ role }: { role: MessageRole }): ReactNode {
  const tip = queryMessageRoleTooltip(role)
  if (!tip) return <span className={styles.roleName}>{role}</span>
  return (
    <Tooltip title={tip} placement="topLeft">
      <span className={`${styles.roleName} ${styles.hintUnderline}`} tabIndex={0}>
        {role}
      </span>
    </Tooltip>
  )
}

/** 单条关联消息：角色名在气泡上方，正文统一限高滚动并可复制 */
function RelatedMessageCard({ msg }: { msg: ChatMessage }): React.ReactElement {
  const content = msg.content ?? ''

  return (
    <article className={`${styles.messageItem} ${queryRoleToneClass(msg.role)}`}>
      <header className={styles.messageMeta}>
        <MessageRoleLabel role={msg.role} />
        {msg.toolName ? <span className={styles.messageTool}>{msg.toolName}</span> : null}
        <div className={styles.messageMetaActions}>
          <span className={styles.messageTime}>{formatTime(msg.createdAt)}</span>
          <Tooltip title="复制消息">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => postCopyText(content)}
              aria-label="复制消息内容"
            />
          </Tooltip>
        </div>
      </header>
      <div className={styles.messageCard}>
        <pre className={styles.messageBody}>{content}</pre>
      </div>
    </article>
  )
}

/** 可复制的等宽 ID 行 */
function IdRow({
  label,
  value,
  copyTip
}: {
  label: string
  value: string
  copyTip: string
}): React.ReactElement {
  return (
    <div className={styles.idRow}>
      <span className={styles.idLabel}>{label}</span>
      <code className={styles.idValue}>{value}</code>
      <Tooltip title={copyTip}>
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={() => postCopyText(value, copyTip.replace(/^复制/, '已复制'))}
          aria-label={copyTip}
          className={styles.idCopy}
        />
      </Tooltip>
    </div>
  )
}

/** 概览页：只展示顶栏摘要未覆盖的档案细节（避免标题/指标重复） */
function OverviewPane({
  summary
}: {
  summary: SessionContextSummary
}): React.ReactElement {
  const session = summary.session
  const run = summary.workflowRun

  return (
    <div className={styles.overviewPane}>
      {/* 顶栏已有标题 / 更新时间 / 消息·节点·Token；此处只补创建时间与会话 ID */}
      <section className={`${styles.panel} ${styles.overviewMeta}`} aria-label="会话档案">
        <div className={styles.overviewMetaGrid}>
          <div className={styles.overviewMetaCell}>
            <span className={styles.overviewMetaLabel}>创建时间</span>
            <span className={styles.overviewMetaValue}>{formatTime(session.createdAt)}</span>
          </div>
          <div className={`${styles.overviewMetaCell} ${styles.overviewMetaCellWide}`}>
            <span className={styles.overviewMetaLabel}>会话 ID</span>
            <span className={styles.overviewMetaId}>
              <code className={styles.idValue}>{session.id}</code>
              <Tooltip title="复制会话 ID">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => postCopyText(session.id, '已复制会话 ID')}
                  aria-label="复制会话 ID"
                  className={styles.idCopy}
                />
              </Tooltip>
            </span>
          </div>
        </div>
      </section>

      {run ? (
        <section className={`${styles.panel} ${styles.overviewRun}`}>
          <div className={styles.overviewRunHead}>
            <h3 className={styles.overviewSectionTitle}>工作流运行</h3>
            <Tag color={queryWorkflowRunStatusColor(run.status)}>{run.status}</Tag>
          </div>
          <div className={styles.overviewRunGrid}>
            <IdRow label="Run ID" value={run.id} copyTip="复制 Run ID" />
            <IdRow label="Workflow ID" value={run.workflowId} copyTip="复制 Workflow ID" />
            <div className={styles.idRow}>
              <span className={styles.idLabel}>当前节点</span>
              <code className={styles.idValue}>{run.cursorNodeId ?? '无'}</code>
            </div>
          </div>
        </section>
      ) : (
        <section className={`${styles.panel} ${styles.overviewEmptyRun}`}>
          <h3 className={styles.overviewSectionTitle}>工作流运行</h3>
          <p className={styles.overviewSectionHint}>当前会话暂无关联的工作流运行记录</p>
        </section>
      )}

      <section className={`${styles.panel} ${styles.overviewContext}`}>
        <h3 className={styles.overviewSectionTitle}>Workflow Context</h3>
        <p className={styles.overviewSectionHint}>节点执行可读的全局上下文快照</p>
        <CodeBlock label="全局 Context" value={summary.workflowContextJson || '{}'} />
      </section>
    </div>
  )
}

/** 节点轨迹：左侧列表 + 右侧详情分段 */
function NodesPane({
  nodes
}: {
  nodes: NodeExecutionContext[]
}): React.ReactElement {
  const [activeId, setActiveId] = useState<string | null>(() => queryDefaultNodeId(nodes))
  const [detailPane, setDetailPane] = useState<NodeDetailPane>('messages')

  useEffect(() => {
    setActiveId(queryDefaultNodeId(nodes))
  }, [nodes])

  const active = useMemo(
    () => nodes.find((n) => n.task.id === activeId) ?? nodes[0] ?? null,
    [nodes, activeId]
  )

  useEffect(() => {
    if (!active) return
    // 打开节点时优先展示最有用的分段：有消息看消息，否则看出参
    if (active.relatedMessages.length > 0) setDetailPane('messages')
    else if (active.notifyDebug) setDetailPane('notify')
    else setDetailPane('output')
  }, [active])

  if (nodes.length === 0) {
    return <Empty description="暂无任务节点" className={styles.emptyState} />
  }

  /** 详情子 Tab：消息带数量角标，其余为静态标签 */
  const detailOptions: Array<{
    value: NodeDetailPane
    label: string
    count?: number
  }> = [
    {
      value: 'messages',
      label: '消息',
      count: active?.relatedMessages.length ?? 0
    },
    { value: 'input', label: '入参' },
    { value: 'output', label: '出参' },
    { value: 'context', label: 'Context' },
    ...(active?.notifyDebug ? [{ value: 'notify' as const, label: '通知' }] : [])
  ]

  return (
    <div className={styles.nodesLayout}>
      <aside className={styles.nodeRail} aria-label="节点轨迹">
        <div className={styles.nodeRailHead}>
          <span>执行轨迹</span>
          <span className={styles.nodeRailCount}>{nodes.length}</span>
        </div>
        <div className={styles.nodeRailList}>
          {nodes.map((node, index) => {
            const selected = node.task.id === active?.task.id
            return (
              <button
                key={node.task.id}
                type="button"
                className={`${styles.nodeRailItem} ${selected ? styles.nodeRailItemActive : ''}`}
                onClick={() => setActiveId(node.task.id)}
              >
                <span className={styles.nodeIndex}>{index + 1}</span>
                <span className={styles.nodeRailMain}>
                  <span className={styles.nodeRailTitle}>{node.task.title}</span>
                  <span className={styles.nodeRailSub}>
                    <Tag
                      color={queryTaskStatusColor(node.task.status)}
                      className={styles.nodeStatusTag}
                    >
                      {queryTaskStatusLabel(node.task.status)}
                    </Tag>
                    {node.skipped ? <span className={styles.skippedHint}>跳过</span> : null}
                    <span className={styles.msgCount}>{node.relatedMessages.length} 条消息</span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <div className={styles.nodeDetail}>
        {active ? (
          <>
            <header className={styles.nodeDetailHead}>
              <div className={styles.nodeDetailTitleRow}>
                <h3 className={styles.nodeDetailTitle}>{active.task.title}</h3>
                <Tag color={queryTaskStatusColor(active.task.status)}>
                  {queryTaskStatusLabel(active.task.status)}
                </Tag>
              </div>
              <div className={styles.nodeIdRow}>
                <span className={styles.metaLabel}>节点 ID</span>
                <code className={styles.mono}>{active.task.id}</code>
                <Tooltip title="复制节点 ID">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => postCopyText(active.task.id, '已复制节点 ID')}
                    aria-label="复制节点 ID"
                  />
                </Tooltip>
              </div>
              {active.skipped ? (
                <Typography.Text type="secondary" className={styles.emptyHint}>
                  该节点已跳过
                  {typeof active.nodeOutput.reason === 'string'
                    ? `：${active.nodeOutput.reason}`
                    : ''}
                </Typography.Text>
              ) : null}
              {/* 下划线 Tab：与顶部分段控件形成 L1/L2 层级差 */}
              <div className={styles.detailTabs} role="tablist" aria-label="节点详情分段">
                {detailOptions.map((opt) => {
                  const selected = detailPane === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={`${styles.detailTab} ${selected ? styles.detailTabActive : ''}`}
                      onClick={() => setDetailPane(opt.value)}
                    >
                      <span className={styles.detailTabLabel}>{opt.label}</span>
                      {typeof opt.count === 'number' ? (
                        <span className={styles.detailTabCount}>{opt.count}</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </header>

            <div className={styles.nodeDetailBody}>
              {detailPane === 'input' ? (
                <div className={styles.messageList}>
                  <CodeBlock label="入参" value={active.nodeInputJson || '{}'} />
                </div>
              ) : null}

              {detailPane === 'output' ? (
                <div className={styles.messageList}>
                  <CodeBlock label="出参" value={active.nodeOutputJson || '{}'} />
                </div>
              ) : null}

              {detailPane === 'context' ? (
                <div className={styles.messageList}>
                  <CodeBlock
                    label="Context"
                    hint="节点执行时可用的 workflow context 快照"
                    value={active.contextJson || '{}'}
                  />
                </div>
              ) : null}

              {detailPane === 'notify' && active.notifyDebug ? (
                <div className={styles.messageList}>
                  <CodeBlock
                    label="发送结果"
                    value={active.notifyDebug.summary}
                    emptyHint="无"
                    hint={
                      active.notifyDebug.deduped
                        ? '本次命中短时去重，未实际发起 HTTP 请求'
                        : undefined
                    }
                  />
                  {active.notifyDebug.requestPath ? (
                    <CodeBlock label="请求路径" value={active.notifyDebug.requestPath} />
                  ) : null}
                  {active.notifyDebug.requestHeaders &&
                  Object.keys(active.notifyDebug.requestHeaders).length > 0 ? (
                    <CodeBlock
                      label="请求头"
                      value={formatContextJson(active.notifyDebug.requestHeaders)}
                    />
                  ) : null}
                  {active.notifyDebug.requestBody ? (
                    <CodeBlock
                      label="请求体"
                      value={formatContextJson(active.notifyDebug.requestBody)}
                    />
                  ) : null}
                </div>
              ) : null}

              {detailPane === 'messages' ? (
                <div className={styles.messagePane}>
                  <div className={styles.messagePaneHead}>
                    <Tooltip title={RELATED_MESSAGES_PURPOSE} placement="topLeft">
                      <span className={`${styles.subLabel} ${styles.hintUnderline}`} tabIndex={0}>
                        关联消息
                      </span>
                    </Tooltip>
                    <span className={styles.msgCount}>
                      {active.relatedMessages.length} 条
                    </span>
                  </div>
                  {active.relatedMessages.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="未匹配到与该节点标题相关的消息"
                      className={styles.emptyState}
                    />
                  ) : (
                    <div className={styles.messageList}>
                      {active.relatedMessages.map((msg) => (
                        <RelatedMessageCard key={msg.id} msg={msg} />
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

/** 对话上下文抽屉：摘要一眼可见，节点轨迹左右对照查看 */
export function SessionContextDrawer({
  open,
  loading,
  contextSummary,
  nodeContexts,
  onClose
}: SessionContextDrawerProps): React.ReactElement {
  const [pane, setPane] = useState<DrawerPane>('nodes')

  useEffect(() => {
    if (!open) return
    // 有节点默认进轨迹；纯对话无任务时进概览更合适
    setPane(nodeContexts.length > 0 ? 'nodes' : 'overview')
  }, [open, contextSummary?.session.id, nodeContexts.length])

  const session: Session | null = contextSummary?.session ?? null
  const sessionType = session ? querySessionType(session) : 'chat'

  const title = (
    <div className={styles.titleRow}>
      <span className={styles.drawerTitle}>对话上下文</span>
      {session ? (
        <Tag className={`${styles.typeTag} ${querySessionToneClass(sessionType)}`}>
          {querySessionTypeLabel(sessionType)}
        </Tag>
      ) : null}
    </div>
  )

  return (
    <Drawer
      title={title}
      width="min(1080px, 86vw)"
      open={open}
      onClose={onClose}
      destroyOnClose
      className={styles.drawer}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
    >
      <Spin spinning={loading} className={styles.spinWrap}>
        {contextSummary ? (
          <div className={styles.body}>
            <div className={styles.bodyGlow} aria-hidden />

            <header className={styles.summary}>
              <div className={styles.summaryMain}>
                <h2 className={styles.summaryTitle}>{contextSummary.session.title}</h2>
                <p className={styles.summarySub}>
                  更新于 {formatTime(contextSummary.session.updatedAt)}
                  {contextSummary.workflowRun
                    ? ` · 运行 ${contextSummary.workflowRun.status}`
                    : ''}
                </p>
              </div>
              <div className={styles.statRow}>
                <div className={styles.statChip}>
                  <span className={styles.statValue}>{contextSummary.messageCount}</span>
                  <span className={styles.statLabel}>消息</span>
                </div>
                <div className={styles.statChip}>
                  <span className={styles.statValue}>{contextSummary.taskCount}</span>
                  <span className={styles.statLabel}>节点</span>
                </div>
                <div className={styles.statChip}>
                  <span className={styles.statValue}>
                    {contextSummary.session.tokenUsed.toLocaleString('zh-CN')}
                  </span>
                  <span className={styles.statLabel}>Token</span>
                </div>
              </div>
            </header>

            <div className={styles.paneSwitch}>
              <Segmented<DrawerPane>
                value={pane}
                onChange={setPane}
                className={styles.paneSegmented}
                options={[
                  {
                    value: 'nodes',
                    label: (
                      <span className={styles.paneOption}>
                        节点轨迹
                        <span className={styles.paneBadge}>{nodeContexts.length}</span>
                      </span>
                    )
                  },
                  {
                    value: 'overview',
                    label: <span className={styles.paneOption}>会话概览</span>
                  }
                ]}
              />
            </div>

            <div className={styles.paneContent}>
              {pane === 'overview' ? (
                <OverviewPane summary={contextSummary} />
              ) : (
                <NodesPane nodes={nodeContexts} />
              )}
            </div>
          </div>
        ) : !loading ? (
          <Empty description="暂无上下文" className={styles.emptyState} />
        ) : (
          <div className={styles.loadingPlaceholder} />
        )}
      </Spin>
    </Drawer>
  )
}
