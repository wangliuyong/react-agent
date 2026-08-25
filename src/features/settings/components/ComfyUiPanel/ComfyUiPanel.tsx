/**
 * 设置页 · ComfyUI 连接面板。
 */

import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import cardStyles from '@/components/entity-card'
import styles from './ComfyUiPanel.module.css'

/** ComfyUI 服务地址与连通性测试 */
export function ComfyUiPanel(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings)
  const loaded = useSettingsStore((s) => s.loaded)
  const postSettings = useSettingsStore((s) => s.postSettings)
  const [testing, setTesting] = useState(false)
  const [draftUrl, setDraftUrl] = useState<string | null>(null)

  const baseUrl = draftUrl ?? settings.comfyUi?.baseUrl ?? 'http://127.0.0.1:8188'
  const enabled = settings.comfyUi?.enabled !== false

  const handleSaveUrl = async (): Promise<void> => {
    try {
      await postSettings({
        comfyUi: {
          baseUrl: baseUrl.trim().replace(/\/+$/, ''),
          enabled
        }
      })
      setDraftUrl(null)
      message.success('已保存 ComfyUI 地址')
    } catch {
      message.error('保存失败')
    }
  }

  const handleTest = async (): Promise<void> => {
    setTesting(true)
    try {
      // 先落盘当前草稿，确保主进程读到最新 URL
      await postSettings({
        comfyUi: {
          baseUrl: baseUrl.trim().replace(/\/+$/, ''),
          enabled
        }
      })
      setDraftUrl(null)
      const res = await window.api.queryComfyUiStatus()
      if (res.ok) {
        message.success(res.message)
      } else {
        message.error(res.message)
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '测试失败')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className={cardStyles.grid}>
      <Card
        variant="borderless"
        className={cardStyles.card}
        style={{ '--card-index': 0 } as CSSProperties}
      >
        <div className={cardStyles.cardHead}>
          <div className={cardStyles.cardIdentity}>
            <span className={cardStyles.cardIcon}>
              <ApiOutlined />
            </span>
            <div className={cardStyles.cardTitleBlock}>
              <span className={cardStyles.cardTitle}>ComfyUI 连接</span>
              <Tag className={cardStyles.primaryTag}>AI 视频</Tag>
            </div>
          </div>
        </div>
        <p className={cardStyles.cardDescription}>
          配置远程 ComfyUI 服务地址，供 AI 视频无限画布调用文生图、图生视频与合成工作流
        </p>
        <div className={styles.fields}>
          <div className={styles.row}>
            <span className={styles.label}>启用</span>
            <Switch
              checked={enabled}
              disabled={!loaded}
              onChange={async (checked) => {
                try {
                  await postSettings({
                    comfyUi: { baseUrl: baseUrl.trim(), enabled: checked }
                  })
                  message.success(checked ? '已启用 ComfyUI' : '已关闭 ComfyUI')
                } catch {
                  message.error('更新失败')
                }
              }}
            />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>服务地址</span>
            <Input
              value={baseUrl}
              disabled={!loaded}
              placeholder="http://127.0.0.1:8188"
              onChange={(e) => setDraftUrl(e.target.value)}
              onPressEnter={() => void handleSaveUrl()}
            />
          </div>
          <div className={styles.actions}>
            <Button disabled={!loaded} onClick={() => void handleSaveUrl()}>
              保存
            </Button>
            <Button
              type="primary"
              loading={testing}
              disabled={!loaded || !enabled}
              icon={<ThunderboltOutlined />}
              onClick={() => void handleTest()}
            >
              测试连接
            </Button>
          </div>
        </div>
        <div className={cardStyles.cardFooter}>
          <span className={cardStyles.footerHint}>默认本地 8188 · 需 API Format 工作流</span>
        </div>
      </Card>
    </div>
  )
}
