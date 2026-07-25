import type { CSSProperties } from 'react'
import type { RemotionTemplateSummary } from '@shared/remotion-template'
import { isValidSkillId } from '@/features/skills/types'
import cardStyles from '@/components/entity-card'
import {
  postDeleteRemotionTemplate,
  postImportRemotionTemplateFromUrl,
  queryRemotionTemplateList
} from '../api'
import styles from './RemotionTemplatesTab.module.css'

const { Text } = Typography

interface RemotionTemplatesTabProps {
  search: string
}

/** 视频模板 Tab：列表、GitHub 导入、删除本地模板 */
export function RemotionTemplatesTab({
  search
}: RemotionTemplatesTabProps): React.ReactElement {
  const [list, setList] = useState<RemotionTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importTargetId, setImportTargetId] = useState('')
  const [importing, setImporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = search.trim()
      const items = await queryRemotionTemplateList(q ? { query: q } : undefined)
      setList(items)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载模板失败')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void load()
  }, [load])

  const handleImport = async (): Promise<void> => {
    const url = importUrl.trim()
    if (!url) {
      message.warning('请输入仓库链接')
      return
    }
    const targetId = importTargetId.trim()
    if (targetId && !isValidSkillId(targetId)) {
      message.warning('目标 id 仅允许小写字母、数字和连字符')
      return
    }
    setImporting(true)
    try {
      const installed = await postImportRemotionTemplateFromUrl(url, targetId || undefined)
      message.success(`已导入 ${installed.length} 个模板`)
      setImportOpen(false)
      setImportUrl('')
      setImportTargetId('')
      await load()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async (template: RemotionTemplateSummary): Promise<void> => {
    if (template.origin === 'bundled') {
      message.info('内置模板不可删除')
      return
    }
    setDeletingId(template.id)
    try {
      await postDeleteRemotionTemplate(template.id)
      message.success('已删除')
      await load()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className={styles.toolbar}>
        <Button type="primary" icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
          从 URL 导入
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          刷新
        </Button>
      </div>

      <Spin spinning={loading && list.length === 0}>
        {list.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无视频模板"
            className={styles.empty}
          />
        ) : (
          <div className={cardStyles.grid}>
            {list.map((template, index) => (
              <Card
                key={template.id}
                variant="borderless"
                className={cardStyles.card}
                style={{ '--card-index': index } as CSSProperties}
              >
                <div className={cardStyles.cardHead}>
                  <div className={cardStyles.cardTitleBlock}>
                    <Text className={cardStyles.cardTitle} ellipsis={{ tooltip: template.name }}>
                      {template.name}
                    </Text>
                    <div className={cardStyles.tagRow}>
                      <Tag className={cardStyles.primaryTag}>{template.origin}</Tag>
                      {template.hasSchema ? <Tag>可调参</Tag> : null}
                      {(template.tags ?? []).slice(0, 3).map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
                <p className={cardStyles.cardDescription}>
                  {template.description || '暂无描述'}
                </p>
                <div className={cardStyles.cardFooter}>
                  <Text type="secondary" className={cardStyles.footerHint}>
                    {template.width ?? '?'}×{template.height ?? '?'} · {template.id}
                  </Text>
                  {template.origin !== 'bundled' ? (
                    <Button
                      type="link"
                      size="small"
                      danger
                      loading={deletingId === template.id}
                      onClick={() => void handleDelete(template)}
                    >
                      删除
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Spin>

      <Modal
        title="从 GitHub 导入 Remotion 模板"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onOk={() => void handleImport()}
        confirmLoading={importing}
        okText="导入"
      >
        <p className={styles.importHint}>
          仓库内需含 meta.json + Composition.tsx，或根目录 manifest.json 索引多模板。
        </p>
        <Input
          placeholder="https://github.com/org/repo 或 tree/.../templates/foo"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          className={styles.importField}
        />
        <Input
          placeholder="目标模板 id（可选，单模板导入时）"
          value={importTargetId}
          onChange={(e) => setImportTargetId(e.target.value)}
        />
      </Modal>
    </>
  )
}
