/**
 * AI 视频画布节点：文本 / 图片 / 视频统一壳，按 type 切换预览。
 */

import { memo, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { AiVideoCanvasNode } from '@shared/ai-video'
import { AI_VIDEO_KIND_LABEL } from '@shared/ai-video'
import styles from './AiVideoFlowNode.module.css'

export type AiVideoRfNode = Node<
  {
    node: AiVideoCanvasNode
    onRun?: (id: string) => void
    onSelect?: (id: string) => void
  },
  'aiVideo'
>

const STATUS_COLOR: Record<string, string> = {
  idle: 'var(--db-text-tertiary, #999)',
  running: 'var(--db-primary, #1677ff)',
  success: '#52c41a',
  error: '#ff4d4f'
}

function AiVideoFlowNodeInner({ data, selected }: NodeProps<AiVideoRfNode>): React.ReactElement {
  const { node, onRun, onSelect } = data
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const path = node.result?.localPath
    if (!path || node.type === 'text') {
      setPreview(null)
      return
    }
    const loader =
      node.type === 'video'
        ? window.api.queryLocalMediaUrl(path)
        : window.api.queryLocalImageDataUrl(path)
    void loader.then((url) => {
      if (!cancelled) setPreview(url)
    })
    return () => {
      cancelled = true
    }
  }, [node.result?.localPath, node.type])

  return (
    <div
      className={styles.node}
      data-selected={selected || undefined}
      data-type={node.type}
      onClick={() => onSelect?.(node.id)}
    >
      <Handle type="target" position={Position.Left} className={styles.handle} />
      <div className={styles.head}>
        <span className={styles.kind}>{AI_VIDEO_KIND_LABEL[node.kind]}</span>
        <span
          className={styles.statusDot}
          style={{ background: STATUS_COLOR[node.status] ?? STATUS_COLOR.idle }}
          title={node.status}
        />
      </div>
      <div className={styles.title}>{node.title}</div>

      {node.type === 'text' ? (
        <div className={styles.textPreview}>
          {(node.result?.text || node.prompt || '（空）').slice(0, 160)}
        </div>
      ) : (
        <div className={styles.mediaPreview}>
          {preview ? (
            node.type === 'video' ? (
              <video src={preview} className={styles.media} muted playsInline />
            ) : (
              <img src={preview} alt="" className={styles.media} />
            )
          ) : (
            <div className={styles.mediaPlaceholder}>
              {node.status === 'running' ? <Spin size="small" /> : '暂无预览'}
            </div>
          )}
        </div>
      )}

      {node.errorMessage ? (
        <div className={styles.error} title={node.errorMessage}>
          {node.errorMessage.slice(0, 80)}
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button
          size="small"
          type="link"
          loading={node.status === 'running'}
          icon={<ReloadOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            onRun?.(node.id)
          }}
        >
          {node.status === 'error' ? '重试' : '运行'}
        </Button>
      </div>
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  )
}

export const AiVideoFlowNode = memo(AiVideoFlowNodeInner)
