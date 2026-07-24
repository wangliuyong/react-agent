import type { CSSProperties } from 'react'
import type {
  AgentRoleName,
  AgentRoleToolInjection,
  AgentToolCatalogItem,
  AgentToolPermission
} from '@shared/types'
import { queryToolLabel } from '@/features/chat/utils/agent-status'
import { queryAgentToolsCatalog } from '../../api'
import cardStyles from '@/components/entity-card'
import styles from './ToolsPanel.module.css'

const { Text, Title, Paragraph } = Typography

type ToolsView = 'list' | 'injection'

const ROLE_LABELS: Record<AgentRoleName, string> = {
  supervisor: '调度器',
  general: '通用助手',
  researcher: '调研员',
  writer: '撰稿人',
  publisher: '发布员',
  scriptwriter: '编剧',
  videographer: '视频制作',
  editor: '剪辑师'
}

const PERMISSION_TAG_CLASS: Record<AgentToolPermission, string> = {
  safe: cardStyles.successTag,
  sensitive: cardStyles.warningTag,
  dangerous: cardStyles.dangerTag
}

const PERMISSION_META: Record<
  AgentToolPermission,
  { label: string; tagClass: string }
> = {
  safe: { label: '安全', tagClass: PERMISSION_TAG_CLASS.safe },
  sensitive: { label: '敏感', tagClass: PERMISSION_TAG_CLASS.sensitive },
  dangerous: { label: '危险', tagClass: PERMISSION_TAG_CLASS.dangerous }
}

const MODE_LABELS: Record<AgentRoleToolInjection['mode'], string> = {
  all: '全量注入',
  whitelist: '白名单',
  none: '无工具'
}

function matchToolQuery(tool: AgentToolCatalogItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    queryToolLabel(tool.name).toLowerCase().includes(q)
  )
}

/** 设置页「工具」：注册表浏览、源码预览、角色注入一览 */
export function ToolsPanel(): React.ReactElement {
  const [view, setView] = useState<ToolsView>('list')
  const [loading, setLoading] = useState(true)
  const [tools, setTools] = useState<AgentToolCatalogItem[]>([])
  const [injections, setInjections] = useState<AgentRoleToolInjection[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<AgentToolCatalogItem | null>(null)

  const hydrate = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const catalog = await queryAgentToolsCatalog()
      setTools(catalog.tools)
      setInjections(catalog.roleInjections)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载工具目录失败'
      setError(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const filtered = useMemo(
    () => tools.filter((t) => matchToolQuery(t, search)),
    [tools, search]
  )

  /** 聊天 general 角色实际可用的工具（全量注册表） */
  const generalInjected = useMemo(() => {
    const row = injections.find((r) => r.role === 'general')
    return row?.toolNames ?? tools.map((t) => t.name)
  }, [injections, tools])

  const openDetail = (tool: AgentToolCatalogItem): void => {
    setDetail(tool)
    setDetailOpen(true)
  }

  const rolesUsingTool = (toolName: string): AgentRoleName[] =>
    injections
      .filter((row) => row.mode !== 'none' && row.toolNames.includes(toolName))
      .map((row) => row.role)

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.titleRow}>
            <Title level={4} className={styles.title}>
              Agent 工具
            </Title>
            <span className={styles.countBadge}>{tools.length}</span>
          </div>
          <Text type="secondary" className={styles.panelDesc}>
            查看已注册工具、源码定义，以及各角色当前注入的白名单
          </Text>
        </div>
        <Space wrap>
          <Segmented
            value={view}
            onChange={(v) => setView(v as ToolsView)}
            options={[
              { label: '工具列表', value: 'list' },
              { label: '角色注入', value: 'injection' }
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void hydrate()}
          >
            刷新
          </Button>
        </Space>
      </div>

      {error ? (
        <Alert type="error" showIcon message={error} className={styles.errorAlert} />
      ) : null}

      {view === 'list' ? (
        <>
          <div className={styles.toolbar}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索工具名或描述…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <Text type="secondary" className={styles.resultCount}>
              {filtered.length} / {tools.length} · general 注入 {generalInjected.length} 项
            </Text>
          </div>

          {/* 滚动仅发生在卡片网格，标题与搜索栏保持固定 */}
          <div className={styles.listScroll}>
            <Spin spinning={loading && tools.length === 0}>
              {filtered.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={loading ? '加载中…' : '暂无匹配工具'}
                  className={styles.empty}
                />
              ) : (
                <div className={cardStyles.grid}>
                  {filtered.map((tool, index) => {
                    const perm = PERMISSION_META[tool.permission]
                    const roles = rolesUsingTool(tool.name)
                    return (
                      <Card
                        key={tool.name}
                        variant="borderless"
                        hoverable
                        className={cardStyles.card}
                        style={{ '--card-index': index } as CSSProperties}
                        onClick={() => openDetail(tool)}
                      >
                        <div className={cardStyles.cardHead}>
                          <div className={cardStyles.cardIdentity}>
                            <span className={cardStyles.cardIcon}>
                              <ToolOutlined />
                            </span>
                            <div className={cardStyles.cardTitleBlock}>
                              <Text className={cardStyles.cardTitle}>
                                {queryToolLabel(tool.name)}
                              </Text>
                              <code className={cardStyles.cardSubtitle}>{tool.name}</code>
                            </div>
                          </div>
                          <Tag className={perm.tagClass}>{perm.label}</Tag>
                        </div>
                        <p className={cardStyles.cardDescription}>{tool.description}</p>
                        <div className={cardStyles.cardFooter}>
                          <Text type="secondary" className={cardStyles.footerHint}>
                            {roles.length
                              ? `注入 ${roles.map((r) => ROLE_LABELS[r]).join('、')}`
                              : '未注入任何角色'}
                          </Text>
                          {/* <Button type="link" size="small" icon={<CodeOutlined />}>
                            详情
                          </Button> */}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </Spin>
          </div>
        </>
      ) : (
        <div className={styles.listScroll}>
          <Spin spinning={loading && injections.length === 0}>
            <div className={styles.injectionList}>
              {injections.map((row, index) => (
                <Card
                  key={row.role}
                  variant="borderless"
                  className={cardStyles.card}
                  style={{ '--card-index': index } as CSSProperties}
                >
                  <div className={cardStyles.cardHead}>
                    <div className={cardStyles.cardTitleBlock}>
                      <Text className={cardStyles.cardTitle}>{ROLE_LABELS[row.role]}</Text>
                      <code className={cardStyles.cardSubtitle}>{row.role}</code>
                    </div>
                    <Space size={6}>
                      <Tag
                        className={
                          row.mode === 'all'
                            ? cardStyles.primaryTag
                            : row.mode === 'none'
                              ? cardStyles.mutedTag
                              : cardStyles.successTag
                        }
                      >
                        {MODE_LABELS[row.mode]}
                      </Tag>
                      <span className={styles.countBadge}>{row.toolNames.length}</span>
                    </Space>
                  </div>
                  {row.toolNames.length === 0 ? (
                    <Text type="secondary">此角色不挂载任何工具（仅路由）</Text>
                  ) : (
                    <div className={styles.chipWrap}>
                      {row.toolNames.map((name) => (
                        <Tag
                          key={name}
                          className={styles.toolChip}
                          onClick={() => {
                            const tool = tools.find((t) => t.name === name)
                            if (tool) openDetail(tool)
                          }}
                        >
                          {name}
                        </Tag>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Spin>
        </div>
      )}

      <Modal
        title={detail ? queryToolLabel(detail.name) : '工具详情'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={860}
        destroyOnHidden
        className={styles.detailModal}
      >
        {!detail ? (
          <Empty description="未选择工具" />
        ) : (
          <div className={styles.detailBody}>
            <div className={styles.detailMeta}>
              <code className={styles.detailId}>{detail.name}</code>
              <Tag className={PERMISSION_META[detail.permission].tagClass}>
                {PERMISSION_META[detail.permission].label}
              </Tag>
              {detail.source ? (
                <Text type="secondary" className={styles.sourcePath}>
                  {detail.source.relativePath}:{detail.source.startLine}–
                  {detail.source.endLine}
                </Text>
              ) : null}
            </div>

            <Paragraph className={styles.detailDesc}>{detail.description}</Paragraph>

            <div className={styles.detailSection}>
              <h4 className={styles.sectionLabel}>注入角色</h4>
              <Space wrap size={[6, 6]}>
                {rolesUsingTool(detail.name).length === 0 ? (
                  <Text type="secondary">无</Text>
                ) : (
                  rolesUsingTool(detail.name).map((role) => (
                    <Tag key={role}>{ROLE_LABELS[role]}</Tag>
                  ))
                )}
              </Space>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.sectionLabel}>参数 Schema</h4>
              <pre className={styles.codeBlock}>
                {JSON.stringify(detail.parameters, null, 2)}
              </pre>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.sectionLabel}>源码预览</h4>
              {detail.sourceCode ? (
                <pre className={styles.codeBlock}>{detail.sourceCode}</pre>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="未能读取源码（打包环境可能不含 TypeScript 源文件）"
                />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
