import type { Session } from '@shared/types'
import { querySessionType, useSessionStore } from '@/features/chat'
import { SESSION_TYPE_ICONS } from '@/layouts/AppShell/config/session-type-icons'
import { queryLatestWorkflowRunBySession } from '../../api'
import type { NodeExecutionContext, SessionContextSummary } from '../../types'
import {
  queryNodeExecutionContexts,
  querySessionContextSummary,
  querySessionTypeLabel,
  queryTaskStatusColor,
  queryTaskStatusLabel
} from '../../utils/sessionContext'
import styles from './HistoryConversations.module.css'

const { Title, Text } = Typography

/** 格式化 Unix 毫秒为本地时间 */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** 历史对话：列表、删除、批量删除、会话/节点上下文查看 */
export function HistoryConversations(): React.ReactElement {
  const sessions = useSessionStore((s) => s.sessions)
  const hydrate = useSessionStore((s) => s.hydrate)
  const removeSession = useSessionStore((s) => s.removeSession)

  const [search, setSearch] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [contextSummary, setContextSummary] = useState<SessionContextSummary | null>(null)
  const [nodeContexts, setNodeContexts] = useState<NodeExecutionContext[]>([])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  /** 按标题 / id 搜索过滤，按更新时间倒序 */
  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = [...sessions]
    if (q) {
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [sessions, search])

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true)
    try {
      await hydrate()
    } finally {
      setRefreshing(false)
    }
  }

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

  const handleDeleteOne = async (id: string): Promise<void> => {
    try {
      await removeSession(id)
      setSelectedRowKeys((keys) => keys.filter((k) => k !== id))
      message.success('已删除')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleBatchDelete = async (): Promise<void> => {
    if (selectedRowKeys.length === 0) return
    const count = selectedRowKeys.length
    setDeleting(true)
    try {
      for (const id of selectedRowKeys) {
        await removeSession(String(id))
      }
      setSelectedRowKeys([])
      message.success(`已删除 ${count} 条对话`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '批量删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (_: unknown, record: Session) => {
        const type = querySessionType(record)
        return (
          <div className={styles.titleCell}>
            <span className={styles.titleText}>{record.title || '未命名对话'}</span>
            <span className={styles.metaText}>
              {record.messages.length} 条消息 · {record.tasks?.length ?? 0} 个节点
            </span>
            <Tag className={styles.typeTag} icon={SESSION_TYPE_ICONS[type]}>
              {querySessionTypeLabel(type)}
            </Tag>
          </div>
        )
      }
    },
    {
      title: 'Token',
      dataIndex: 'tokenUsed',
      key: 'tokenUsed',
      width: 90,
      render: (v: number) => v.toLocaleString('zh-CN')
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 168,
      render: (v: number) => formatTime(v)
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: Session) => (
        <Space size={4}>
          <Tooltip title="查看上下文">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => void handleViewContext(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除该对话？"
            description="删除后不可恢复，关联的工作流上下文记录仍会保留。"
            onConfirm={() => void handleDeleteOne(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className={styles.page}>
      <div className={styles.subHeader}>
        <div className={styles.subHeaderMain}>
          <div className={styles.subHeaderIcon}>
            <HistoryOutlined />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={5} className={styles.subTitle}>
                历史对话
              </Title>
              <span className={styles.countBadge}>{filteredSessions.length}</span>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              管理全部会话记录，查看工作流 context 与各节点执行上下文
            </Text>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索标题或 ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <div className={styles.toolbarRight}>
          {selectedRowKeys.length > 0 ? (
            <Popconfirm
              title={`确定删除选中的 ${selectedRowKeys.length} 条对话？`}
              onConfirm={() => void handleBatchDelete()}
              okText="批量删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button danger loading={deleting} icon={<DeleteOutlined />}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          ) : null}
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void handleRefresh()}>
            刷新
          </Button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <Table<Session>
          rowKey="id"
          columns={columns}
          dataSource={filteredSessions}
          pagination={{
            pageSize: 12,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          locale={{ emptyText: <Empty description="暂无历史对话" /> }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys.map(String))
          }}
          size="middle"
        />
      </div>

      <Drawer
        title="对话上下文"
        width={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <Spin spinning={drawerLoading}>
          {contextSummary ? (
            <>
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>会话信息</div>
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
                    <div className={styles.drawerSectionTitle}>工作流运行</div>
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
                          {contextSummary.workflowRun.cursorNodeId ?? '—'}
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

                <div className={styles.drawerSectionTitle}>Workflow Context（全局）</div>
                <pre className={styles.contextPre}>
                  {contextSummary.workflowContextJson || '{}'}
                </pre>
              </section>

              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>节点执行上下文</div>
                {nodeContexts.length === 0 ? (
                  <Text type="secondary" className={styles.emptyHint}>
                    暂无任务节点
                  </Text>
                ) : (
                  <Collapse
                    className={styles.nodePanel}
                    defaultActiveKey={nodeContexts.map((n) => n.task.id)}
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

                          <div className={styles.drawerSectionTitle}>Context 切片</div>
                          <pre className={styles.contextPre}>{node.contextJson || '{}'}</pre>

                          <div className={styles.drawerSectionTitle}>关联消息</div>
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
