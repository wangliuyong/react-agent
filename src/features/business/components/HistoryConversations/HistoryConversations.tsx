import type { CSSProperties } from 'react'
import type { Session, SessionType } from '@shared/types'
import { querySessionType, useSessionStore } from '@/features/chat'
import { SESSION_TYPE_FILTER_OPTIONS, SESSION_TYPE_ICONS, type SessionTypeFilter } from '@/layouts/AppShell/config/session-type-icons'
import { queryLatestWorkflowRunBySession } from '../../api'
import type { NodeExecutionContext, SessionContextSummary } from '../../types'
import {
  formatContextJson,
  queryNodeExecutionContexts,
  querySessionContextSummary,
  querySessionTypeLabel,
  queryTaskStatusColor,
  queryTaskStatusLabel
} from '../../utils/sessionContext'
import styles from './HistoryConversations.module.css'

const { Text } = Typography

/** 同步到 BusinessPanel 顶栏的元信息 */
export interface HistoryConversationsHeaderMeta {
  count: number
  refreshing: boolean
  onRefresh: () => Promise<void>
}

interface HistoryConversationsProps {
  /** 将计数与刷新状态同步到 BusinessPanel 顶栏 */
  onHeaderChange?: (meta: HistoryConversationsHeaderMeta | null) => void
}

/** 列表排序方式 */
type SessionSort = 'updated_desc' | 'updated_asc' | 'token_desc'

/** 默认每页条数 */
const DEFAULT_PAGE_SIZE = 12

/** 可选每页条数 */
const PAGE_SIZE_OPTIONS = [12, 24, 48, 96]

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

/** 格式化为相对时间，便于列表快速扫读 */
function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return formatTime(ts)
}

/** 按标题 / id 匹配搜索词 */
function matchSessionQuery(session: Session, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    session.title.toLowerCase().includes(q) || session.id.toLowerCase().includes(q)
  )
}

/** 会话列表排序 */
function sortSessions(list: Session[], sort: SessionSort): Session[] {
  const next = [...list]
  switch (sort) {
    case 'updated_asc':
      return next.sort((a, b) => a.updatedAt - b.updatedAt)
    case 'token_desc':
      return next.sort((a, b) => b.tokenUsed - a.tokenUsed)
    default:
      return next.sort((a, b) => b.updatedAt - a.updatedAt)
  }
}

/** 会话类型对应的头像 / 标签样式类名 */
function querySessionToneClass(type: SessionType): string {
  switch (type) {
    case 'publish':
      return styles.tone_publish
    case 'schedule':
      return styles.tone_schedule
    case 'workflow':
      return styles.tone_workflow
    default:
      return styles.tone_chat
  }
}

function querySessionTypeTagClass(type: SessionType): string {
  switch (type) {
    case 'publish':
      return styles.typeTag_publish
    case 'schedule':
      return styles.typeTag_schedule
    case 'workflow':
      return styles.typeTag_workflow
    default:
      return styles.typeTag_chat
  }
}

interface HistorySessionCardProps {
  session: Session
  index: number
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
  onViewContext: (session: Session) => void
  onDelete: (id: string) => void
}

/** 单条历史会话卡片：横向布局，左侧勾选 + 类型头像，右侧操作 */
function HistorySessionCard({
  session,
  index,
  selected,
  onSelect,
  onViewContext,
  onDelete
}: HistorySessionCardProps): React.ReactElement {
  const type = querySessionType(session)
  const title = session.title || '未命名对话'

  return (
    <article
      className={`${styles.sessionCard} ${selected ? styles.sessionCardSelected : ''}`}
      style={{ '--card-index': index } as CSSProperties}
    >
      <Checkbox
        checked={selected}
        onChange={(e) => onSelect(session.id, e.target.checked)}
        aria-label={`选择对话 ${title}`}
      />

      <div className={styles.sessionCardMain}>
        <span className={`${styles.sessionAvatar} ${querySessionToneClass(type)}`}>
          {SESSION_TYPE_ICONS[type]}
        </span>
        <div className={styles.sessionInfo}>
          <div className={styles.sessionTitleRow}>
            <Tooltip title={title}>
              <span className={styles.sessionTitle}>{title}</span>
            </Tooltip>
            <Tag className={`${styles.typeTag} ${querySessionTypeTagClass(type)}`}>
              {querySessionTypeLabel(type)}
            </Tag>
          </div>
          <div className={styles.sessionMeta}>
            <span className={styles.sessionMetaItem}>
              <MessageOutlined />
              {session.messages.length} 条消息
            </span>
            <span className={styles.sessionMetaItem}>
              <ApartmentOutlined />
              {session.tasks?.length ?? 0} 个节点
            </span>
            <span className={styles.sessionMetaItem}>
              <ThunderboltOutlined />
              {session.tokenUsed.toLocaleString('zh-CN')} Token
            </span>
          </div>
        </div>
      </div>

      <div className={styles.sessionAside}>
        <Tooltip title={formatTime(session.updatedAt)}>
          <span className={styles.sessionTime}>{formatRelativeTime(session.updatedAt)}</span>
        </Tooltip>
        <div className={styles.sessionActions}>
          <Tooltip title="查看上下文">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewContext(session)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除该对话？"
            description="删除后不可恢复，关联的工作流上下文记录仍会保留。"
            onConfirm={() => onDelete(session.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      </div>
    </article>
  )
}

/** 历史对话：卡片列表、删除、批量删除、会话/节点上下文查看 */
export function HistoryConversations({
  onHeaderChange
}: HistoryConversationsProps): React.ReactElement {
  const sessions = useSessionStore((s) => s.sessions)
  const hydrate = useSessionStore((s) => s.hydrate)
  const removeSession = useSessionStore((s) => s.removeSession)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<SessionTypeFilter>('all')
  const [sort, setSort] = useState<SessionSort>('updated_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [contextSummary, setContextSummary] = useState<SessionContextSummary | null>(null)
  const [nodeContexts, setNodeContexts] = useState<NodeExecutionContext[]>([])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  /** 筛选条件变化时回到第一页，避免空页 */
  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, sort])

  /** 按类型、搜索、排序过滤后的完整列表 */
  const filteredSessions = useMemo(() => {
    let list = sessions.filter((s) => matchSessionQuery(s, search))
    if (typeFilter !== 'all') {
      list = list.filter((s) => querySessionType(s) === typeFilter)
    }
    return sortSessions(list, sort)
  }, [sessions, search, typeFilter, sort])

  /** 总页数变化后校正当前页，避免删除/筛选后停留在空页 */
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSessions.length / pageSize))
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [filteredSessions.length, page, pageSize])

  /** 当前页数据切片 */
  const pagedSessions = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredSessions.slice(start, start + pageSize)
  }, [filteredSessions, page, pageSize])

  /** 分页切换：支持改页码与每页条数 */
  const handlePaginationChange = (nextPage: number, nextPageSize: number): void => {
    setPage(nextPage)
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize)
    }
  }

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    try {
      await hydrate()
      message.success('已刷新')
    } finally {
      setRefreshing(false)
    }
  }, [hydrate])

  /** 顶栏已上移到 BusinessPanel，通过回调同步计数与刷新 */
  useEffect(() => {
    onHeaderChange?.({
      count: filteredSessions.length,
      refreshing,
      onRefresh: handleRefresh
    })
    return () => onHeaderChange?.(null)
  }, [filteredSessions.length, refreshing, handleRefresh, onHeaderChange])

  /** 打开上下文 Drawer：拉取工作流 run 并构建节点上下文 */
  const handleViewContext = async (session: Session): Promise<void> => {
    setDrawerOpen(true)
    setDrawerLoading(true)
    setContextSummary(null)
    setNodeContexts([])
    try {
      const workflowRun = await queryLatestWorkflowRunBySession(session.id)
      const summary = querySessionContextSummary(session, workflowRun)
      const nodes = queryNodeExecutionContexts(session, workflowRun)
      setContextSummary(summary)
      setNodeContexts(nodes)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载上下文失败')
      setDrawerOpen(false)
    } finally {
      setDrawerLoading(false)
    }
  }

  const handleSelectOne = (id: string, checked: boolean): void => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    )
  }

  const handleSelectPage = (checked: boolean): void => {
    const pageIds = pagedSessions.map((s) => s.id)
    if (checked) {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])])
    } else {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    }
  }

  const handleDeleteOne = async (id: string): Promise<void> => {
    try {
      await removeSession(id)
      setSelectedIds((keys) => keys.filter((k) => k !== id))
      message.success('已删除')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleBatchDelete = async (): Promise<void> => {
    if (selectedIds.length === 0) return
    const count = selectedIds.length
    setDeleting(true)
    try {
      for (const id of selectedIds) {
        await removeSession(id)
      }
      setSelectedIds([])
      message.success(`已删除 ${count} 条对话`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '批量删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const pageAllSelected =
    pagedSessions.length > 0 && pagedSessions.every((s) => selectedIds.includes(s.id))
  const pageIndeterminate =
    pagedSessions.some((s) => selectedIds.includes(s.id)) && !pageAllSelected

  return (
    <div className={styles.page}>
      {/* 筛选栏：类型 + 搜索 + 排序 + 批量操作 */}
      <div className={styles.toolbar}>
        <Segmented
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as SessionTypeFilter)}
          options={SESSION_TYPE_FILTER_OPTIONS}
        />
        <div className={styles.toolbarRight}>
          {pagedSessions.length > 0 ? (
            <Checkbox
              checked={pageAllSelected}
              indeterminate={pageIndeterminate}
              onChange={(e) => handleSelectPage(e.target.checked)}
            >
              本页全选
            </Checkbox>
          ) : null}
          {selectedIds.length > 0 ? (
            <Popconfirm
              title={`确定删除选中的 ${selectedIds.length} 条对话？`}
              onConfirm={() => void handleBatchDelete()}
              okText="批量删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button danger loading={deleting} icon={<DeleteOutlined />}>
                删除 ({selectedIds.length})
              </Button>
            </Popconfirm>
          ) : null}
          <span className={styles.resultCount}>{filteredSessions.length} 条</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索标题或 ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            value={sort}
            onChange={setSort}
            className={styles.sortSelect}
            options={[
              { label: '最近更新', value: 'updated_desc' },
              { label: '最早更新', value: 'updated_asc' },
              { label: 'Token 用量', value: 'token_desc' }
            ]}
          />
        </div>
      </div>

      {/* 会话列表（可滚动区域） */}
      <div className={styles.body}>
        {filteredSessions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search || typeFilter !== 'all' ? '没有匹配的对话' : '暂无历史对话'}
            className={styles.empty}
          />
        ) : (
          <div className={styles.list}>
            {pagedSessions.map((session, index) => (
              <HistorySessionCard
                key={session.id}
                session={session}
                index={index}
                selected={selectedIds.includes(session.id)}
                onSelect={handleSelectOne}
                onViewContext={(s) => void handleViewContext(s)}
                onDelete={(id) => void handleDeleteOne(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 分页器吸附在底部：条数切换 + 快速跳转 + 范围统计 */}
      {filteredSessions.length > 0 ? (
        <footer className={styles.pagination}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={filteredSessions.length}
            showSizeChanger
            showQuickJumper
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            showTotal={(total, range) =>
              total > 0 ? `第 ${range[0]}-${range[1]} 条，共 ${total} 条` : '共 0 条'
            }
            onChange={handlePaginationChange}
          />
        </footer>
      ) : null}

      {/* 上下文详情抽屉 */}
      <Drawer
        title="对话上下文"
        width={'68vw'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        className={styles.contextDrawer}
      >
        <Spin spinning={drawerLoading}>
          {contextSummary ? (
            <>
              <section className={styles.drawerSection}>
                <h3 className={styles.sectionLabel}>会话信息</h3>
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>标题</span>
                    <span className={styles.metaValue}>{contextSummary.session.title}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>会话 ID</span>
                    <span className={styles.metaValue}>{contextSummary.session.id}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>类型</span>
                    <span className={styles.metaValue}>
                      {querySessionTypeLabel(querySessionType(contextSummary.session))}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Token 用量</span>
                    <span className={styles.metaValue}>
                      {contextSummary.session.tokenUsed.toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>消息数</span>
                    <span className={styles.metaValue}>{contextSummary.messageCount}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>任务节点</span>
                    <span className={styles.metaValue}>{contextSummary.taskCount}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>创建时间</span>
                    <span className={styles.metaValue}>
                      {formatTime(contextSummary.session.createdAt)}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>更新时间</span>
                    <span className={styles.metaValue}>
                      {formatTime(contextSummary.session.updatedAt)}
                    </span>
                  </div>
                </div>

                {contextSummary.workflowRun ? (
                  <>
                    <h3 className={styles.sectionLabel}>工作流运行</h3>
                    <div className={styles.metaGrid}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Run ID</span>
                        <span className={styles.metaValue}>{contextSummary.workflowRun.id}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>状态</span>
                        <span className={styles.metaValue}>{contextSummary.workflowRun.status}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>当前节点</span>
                        <span className={styles.metaValue}>
                          {contextSummary.workflowRun.cursorNodeId ?? '无'}
                        </span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Workflow ID</span>
                        <span className={styles.metaValue}>
                          {contextSummary.workflowRun.workflowId}
                        </span>
                      </div>
                    </div>
                  </>
                ) : null}

                <h3 className={styles.sectionLabel}>Workflow Context（全局）</h3>
                <pre className={styles.contextPre}>
                  {contextSummary.workflowContextJson || '{}'}
                </pre>
              </section>

              <section className={styles.drawerSection}>
                <h3 className={styles.sectionLabel}>节点执行上下文</h3>
                {nodeContexts.length === 0 ? (
                  <Text type="secondary" className={styles.emptyHint}>
                    暂无任务节点
                  </Text>
                ) : (
                  <Collapse
                    className={styles.nodePanel}
                    defaultActiveKey={[]}
                    items={nodeContexts.map((node) => ({
                      key: node.task.id,
                      label: (
                        <div className={styles.nodeHeader}>
                          <span className={styles.nodeTitle}>{node.task.title}</span>
                          <Tag color={queryTaskStatusColor(node.task.status)}>
                            {queryTaskStatusLabel(node.task.status)}
                          </Tag>
                          <Tag>{node.relatedMessages.length} 条消息</Tag>
                        </div>
                      ),
                      children: (
                        <>
                          <div className={styles.metaItem} style={{ marginBottom: 10 }}>
                            <span className={styles.metaLabel}>节点 ID</span>
                            <span className={styles.metaValue}>{node.task.id}</span>
                          </div>

                          {node.skipped ? (
                            <Text type="secondary" className={styles.emptyHint}>
                              该节点已跳过
                              {typeof node.nodeOutput.reason === 'string'
                                ? `：${node.nodeOutput.reason}`
                                : ''}
                            </Text>
                          ) : null}

                          <h4 className={styles.sectionLabel}>入参</h4>
                          <pre className={styles.contextPre}>
                            {node.nodeInputJson || '{}'}
                          </pre>

                          <h4 className={styles.sectionLabel}>出参</h4>
                          <pre className={styles.contextPre}>
                            {node.nodeOutputJson || '{}'}
                          </pre>

                          {node.notifyDebug ? (
                            <>
                              <h4 className={styles.sectionLabel}>渠道通知结果</h4>
                              <div className={styles.metaItem} style={{ marginBottom: 10 }}>
                                <span className={styles.metaLabel}>发送结果</span>
                                <span className={styles.metaValue}>{node.notifyDebug.summary}</span>
                              </div>
                              {node.notifyDebug.deduped ? (
                                <Text type="secondary" className={styles.emptyHint}>
                                  本次命中短时去重，未实际发起 HTTP 请求
                                </Text>
                              ) : null}
                              {node.notifyDebug.requestPath ? (
                                <>
                                  <h4 className={styles.sectionLabel}>请求路径</h4>
                                  <pre className={styles.contextPre}>{node.notifyDebug.requestPath}</pre>
                                </>
                              ) : null}
                              {node.notifyDebug.requestHeaders &&
                              Object.keys(node.notifyDebug.requestHeaders).length > 0 ? (
                                <>
                                  <h4 className={styles.sectionLabel}>请求头</h4>
                                  <pre className={styles.contextPre}>
                                    {formatContextJson(node.notifyDebug.requestHeaders)}
                                  </pre>
                                </>
                              ) : null}
                              {node.notifyDebug.requestBody ? (
                                <>
                                  <h4 className={styles.sectionLabel}>请求体</h4>
                                  <pre className={styles.contextPre}>
                                    {formatContextJson(node.notifyDebug.requestBody)}
                                  </pre>
                                </>
                              ) : null}
                            </>
                          ) : null}

                          <h4 className={styles.sectionLabel}>Context 切片</h4>
                          <Text type="secondary" className={styles.emptyHint} style={{ marginBottom: 8 }}>
                            节点执行时可用的 workflow context 快照
                          </Text>
                          <pre className={styles.contextPre}>{node.contextJson || '{}'}</pre>

                          <h4 className={styles.sectionLabel}>关联消息</h4>
                          {node.relatedMessages.length === 0 ? (
                            <Text type="secondary" className={styles.emptyHint}>
                              未匹配到与该节点标题相关的消息
                            </Text>
                          ) : (
                            <div className={styles.messageList}>
                              {node.relatedMessages.map((msg) => (
                                <div key={msg.id} className={styles.messageItem}>
                                  <div className={styles.messageRole}>
                                    {msg.role}
                                    {msg.toolName ? ` · ${msg.toolName}` : ''}
                                    {' · '}
                                    {formatTime(msg.createdAt)}
                                  </div>
                                  <pre className={styles.messageContent}>{msg.content}</pre>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    }))}
                  />
                )}
              </section>
            </>
          ) : null}
        </Spin>
      </Drawer>
    </div>
  )
}
