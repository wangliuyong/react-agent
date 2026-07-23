import type { CSSProperties } from 'react'
import { QUICK_TASK_CARDS, QUICK_TASK_PAGE_SIZE } from './quick-task-cards'
import { useQuickTaskBatch } from './useQuickTaskBatch'
import styles from './WelcomeHero.module.css'

const { Title, Paragraph } = Typography

interface WelcomeHeroProps {
  onPick: (prompt: string) => void
}

/** 新会话落地页：问候语 + 快捷任务卡片网格 + 换一批 */
export function WelcomeHero({ onPick }: WelcomeHeroProps): React.ReactElement {
  const { cards, batchKey, refresh, canRefresh } = useQuickTaskBatch(
    QUICK_TASK_CARDS,
    QUICK_TASK_PAGE_SIZE
  )

  return (
    <div className={styles.wrap}>
      <Title level={2} className={styles.title}>
        今天要处理哪块业务？
      </Title>
      <Paragraph className={styles.sub}>
        全能助手：热点与天气、多渠道发布、剧本成片与定时通知。一句话即可走完调研→创作→发布，或编剧→分镜→成片。
      </Paragraph>

      <div key={batchKey} className={styles.grid}>
        {cards.map((card, index) => (
          <button
            key={card.title}
            type="button"
            className={styles.card}
            style={{ '--card-index': index } as CSSProperties}
            onClick={() => onPick(card.prompt)}
          >
            <span className={styles.cardTitle}>{card.title}</span>
            <p className={styles.cardDesc}>{card.desc}</p>
          </button>
        ))}
      </div>

      {canRefresh ? (
        <div className={styles.refreshRow}>
          <Button
            type="text"
            size="small"
            className={styles.refreshBtn}
            icon={<SyncOutlined className={styles.refreshIcon} />}
            onClick={refresh}
            aria-label="换一批快捷任务"
          >
            换一批
          </Button>
        </div>
      ) : null}
    </div>
  )
}
