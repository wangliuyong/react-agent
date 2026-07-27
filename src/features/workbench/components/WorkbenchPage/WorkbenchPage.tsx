import type { CSSProperties } from 'react'
import type { AppView } from '@/stores/app-store'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '@/features/chat'
import { useSettingsStore } from '@/features/settings'
import { useScheduleStore } from '@/features/schedule'
import { usePublishStore } from '@/features/publish'
import { useSkillsStore } from '@/features/skills'
import { useWorkflowsStore } from '@/features/workflows'
import { useRulesStore } from '@/features/rules'
import { queryBrowserStatus } from '@/features/browser'
import { queryModelLabel, queryAllProviderOptions } from '@shared/types'
import { DB_THEME } from '@/styles/theme-tokens'
import {
  FeaturePageShell,
  FeaturePageHeader,
  FeatureScrollBody,
  shellStyles
} from '@/components/page-shell'
import { WORKBENCH_APP_VERSION } from '../../constants'
import {
  formatWorkbenchCount,
  queryRecentDayLabels,
  querySessionActivityByDay,
  querySessionTypeBreakdown,
  queryTopSessionsByToken,
  queryTotalTokenUsed,
  queryWorkbenchSessionSlices
} from '../../utils/workbench-stats'
import styles from './WorkbenchPage.module.css'

const { Text } = Typography

/** ECharts 分包懒加载，与聊天 K 线图策略一致 */
const WorkbenchCharts = lazy(() =>
  import('../WorkbenchCharts').then((m) => ({ default: m.WorkbenchCharts }))
)

interface QuickEntry {
  key: AppView | 'soon'
  title: string
  description: string
  icon: React.ReactNode
  tone: 'primary' | 'neutral' | 'muted'
}

const QUICK_ENTRIES: QuickEntry[] = [
  {
    key: 'chat',
    title: '智能对话',
    description: '与灵犀助手协作、执行任务',
    icon: <MessageOutlined />,
    tone: 'primary'
  },
  {
    key: 'publish',
    title: '发布工作台',
    description: '编排内容发布计划与子任务',
    icon: <CloudUploadOutlined />,
    tone: 'neutral'
  },
  {
    key: 'workflows',
    title: '流程编排',
    description: '可视化自动化与节点执行',
    icon: <ApartmentOutlined />,
    tone: 'neutral'
  },
  {
    key: 'schedule',
    title: '定时任务',
    description: '计划触发与后台执行',
    icon: <ClockCircleOutlined />,
    tone: 'neutral'
  },
  {
    key: 'skills',
    title: '技能市场',
    description: '项目技能与模板管理',
    icon: <ThunderboltOutlined />,
    tone: 'neutral'
  },

]

const CHART_DAYS = 7
const TOP_SESSION_LIMIT = 8

/** 工作台：运行概览、快捷入口占位、模型配置摘要与 ECharts 统计 */
export function WorkbenchPage(): React.ReactElement {
  const setView = useAppStore((s) => s.setView)
  const sessions = useSessionStore((s) => s.sessions)
  const settings = useSettingsStore((s) => s.settings)
  const settingsLoaded = useSettingsStore((s) => s.loaded)
  const schedules = useScheduleStore((s) => s.tasks)
  const plans = usePublishStore((s) => s.plans)
  const skills = useSkillsStore((s) => s.skills)
  const workflows = useWorkflowsStore((s) => s.workflows)
  const rules = useRulesStore((s) => s.rules)

  const [browserRunning, setBrowserRunning] = useState(false)
  const [browserUrl, setBrowserUrl] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState(() => Date.now())

  const sessionSlices = useMemo(() => queryWorkbenchSessionSlices(sessions), [sessions])
  const totalTokens = useMemo(() => queryTotalTokenUsed(sessionSlices), [sessionSlices])
  const dayLabels = useMemo(() => queryRecentDayLabels(CHART_DAYS), [])
  const activitySeries = useMemo(
    () => querySessionActivityByDay(sessionSlices, CHART_DAYS),
    [sessionSlices]
  )
  const typeBreakdown = useMemo(
    () => querySessionTypeBreakdown(sessionSlices),
    [sessionSlices]
  )
  const topSessions = useMemo(
    () => queryTopSessionsByToken(sessionSlices, TOP_SESSION_LIMIT),
    [sessionSlices]
  )

  const providerCount = queryAllProviderOptions(settings.customProviders ?? []).length
  const connectionCount = settings.connections?.length ?? 0
  const enabledSkills = skills.filter((s) => s.enabled).length
  const enabledSchedules = schedules.filter((t) => t.enabled).length

  const syncRuntime = useCallback(async () => {
    try {
      const status = await queryBrowserStatus()
      setBrowserRunning(status.running)
      setBrowserUrl(status.url || '')
    } catch {
      setBrowserRunning(false)
      setBrowserUrl('')
    }
  }, [])

  useEffect(() => {
    void syncRuntime()
  }, [syncRuntime])

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true)
    try {
      await syncRuntime()
      setLastRefreshAt(Date.now())
    } finally {
      setRefreshing(false)
    }
  }

  const handleQuickEntry = (entry: QuickEntry): void => {
    if (entry.key === 'soon') return
    setView(entry.key)
  }

  const runtimeCards = [
    {
      label: '应用版本',
      value: `v${WORKBENCH_APP_VERSION}`,
      hint: 'Electron 桌面端',
      icon: <RocketOutlined />
    },
    {
      label: '会话总数',
      value: formatWorkbenchCount(sessions.length),
      hint: `${formatWorkbenchCount(totalTokens)} Token 累计`,
      icon: <MessageOutlined />
    },
    // {
    //   label: '智能体浏览器',
    //   value: browserRunning ? '运行中' : '未启动',
    //   hint: browserRunning && browserUrl ? browserUrl : 'Playwright 有头窗口',
    //   icon: <GlobalOutlined />
    // },
    {
      label: '资源概览',
      value: `${plans.length} 发布 · ${workflows.length} 流程`,
      hint: `${enabledSchedules} 个定时启用 · ${rules.length} 条规则`,
      icon: <AppstoreOutlined />
    }
  ]

  const modelRows = [
    { label: '默认模型', value: queryModelLabel(settings.model) },
    { label: '默认供应商', value: settings.provider },
    { label: '多模型连接', value: `${connectionCount} 条` },
    { label: '供应商登记', value: `${providerCount} 个` },
    { label: '思考模式', value: settings.thinkingEnabled ? '已开启' : '关闭' },
    { label: '完全访问', value: settings.fullAccess ? '已开启' : '关闭' },
    { label: '最大工具轮次', value: String(settings.maxTurns ?? 40) },
    { label: '已启用技能', value: `${enabledSkills} / ${skills.length}` }
  ]

  const refreshHint = new Date(lastRefreshAt).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <FeaturePageShell className={styles.shell}>
      <FeaturePageHeader
        icon={<DashboardOutlined />}
        title="工作台"
        badge="概览"
        badgeVariant="muted"
        description="查看本机运行状态、模型配置与使用统计；更多能力将以卡片形式陆续接入。"
        extra={
          <div className={styles.headerExtra}>
            <Text type="secondary" className={styles.refreshHint}>
              更新于 {refreshHint}
            </Text>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              loading={refreshing}
              onClick={() => void handleRefresh()}
            >
              刷新
            </Button>
          </div>
        }
      />

      <FeatureScrollBody>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>快捷入口</h2>
            <Text type="secondary" className={styles.sectionDesc}>
              已上线功能可一键跳转；灰色卡片为后续规划占位
            </Text>
          </div>
          <div className={styles.entryGrid}>
            {QUICK_ENTRIES.map((entry, index) => {
              const isSoon = entry.key === 'soon'
              return (
                <button
                  key={`${entry.title}-${index}`}
                  type="button"
                  className={styles.entryCard}
                  data-tone={entry.tone}
                  data-disabled={isSoon || undefined}
                  disabled={isSoon}
                  onClick={() => handleQuickEntry(entry)}
                  style={{ '--card-index': index } as CSSProperties}
                >
                  <span className={styles.entryIcon}>{entry.icon}</span>
                  <span className={styles.entryTitle}>{entry.title}</span>
                  <span className={styles.entryDesc}>{entry.description}</span>
                  {isSoon ? <Tag className={styles.soonTag}>即将推出</Tag> : null}
                </button>
              )
            })}
          </div>
        </section>

        <section className={styles.section} aria-label="运行信息">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>运行信息</h2>
            <Text type="secondary" className={styles.sectionDesc}>
              快速查看系统运行信息
            </Text>
          </div>
          <div className={styles.entryGrid}>
            {runtimeCards.map((card, index) => (
              <div
                key={card.label}
                className={styles.runtimeCard}
                style={{ '--card-index': index } as CSSProperties}
              >
                <span className={styles.runtimeIcon} aria-hidden>
                  {card.icon}
                </span>
                <div className={styles.runtimeBody}>
                  <span className={styles.runtimeLabel}>{card.label}</span>
                  <span className={styles.runtimeValue}>{card.value}</span>
                  <Text type="secondary" className={styles.runtimeHint}>
                    {card.hint}
                  </Text>
                </div>
              </div>
            ))}
          </div>


        </section>



        <div className={styles.split}>
          <section className={styles.section} aria-label="模型使用情况">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>模型与 Agent</h2>
              <Text type="secondary" className={styles.sectionDesc}>
                摘自当前设置；修改请前往「设置 → 模型与 API」
              </Text>
            </div>
            <div className={styles.modelPanel}>
              {!settingsLoaded ? (
                <div className={shellStyles.pageLoading} role="status">
                  <div className={shellStyles.pageLoadingSpinner} aria-hidden />
                  <span className={shellStyles.pageLoadingText}>加载设置…</span>
                </div>
              ) : (
                <dl className={styles.modelGrid}>
                  {modelRows.map((row) => (
                    <div key={row.label} className={styles.modelRow}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <Button
                type="link"
                className={styles.modelLink}
                icon={<SettingOutlined />}
                onClick={() => setView('settings')}
              >
                打开设置
              </Button>
            </div>
          </section>

          <section className={styles.section} aria-label="环境信息">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>运行环境</h2>
              <Text type="secondary" className={styles.sectionDesc}>
                渲染进程可读信息（无需额外权限）
              </Text>
            </div>
            <ul className={styles.envList}>
              <li>
                <span>用户代理</span>
                <code title={navigator.userAgent}>{navigator.userAgent.slice(0, 48)}…</code>
              </li>
              <li>
                <span>语言 / 时区</span>
                <code>
                  {navigator.language} · {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </code>
              </li>
              <li>
                <span>屏幕</span>
                <code>
                  {window.screen.width}×{window.screen.height} ·{' '}
                  {window.devicePixelRatio}x DPR
                </code>
              </li>
              <li>
                <span>主题主色</span>
                <code style={{ color: DB_THEME.primary }}>{DB_THEME.primary}</code>
              </li>
            </ul>
          </section>
        </div>

        {/* <section className={styles.section} aria-label="统计图表">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>使用统计</h2>
            <Text type="secondary" className={styles.sectionDesc}>
              基于本地会话数据聚合；Token 为 LLM 回调估算累计值
            </Text>
          </div>
          <Suspense
            fallback={
              <div className={shellStyles.pageLoading} role="status">
                <div className={shellStyles.pageLoadingSpinner} aria-hidden />
                <span className={shellStyles.pageLoadingText}>加载图表…</span>
              </div>
            }
          >
            <WorkbenchCharts
              dayLabels={dayLabels}
              activitySeries={activitySeries}
              typeBreakdown={typeBreakdown}
              topSessions={topSessions}
            />
          </Suspense>
        </section> */}
      </FeatureScrollBody>
    </FeaturePageShell>
  )
}
