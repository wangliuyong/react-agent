import type { ReactNode } from 'react'
import styles from './page-shell.module.css'

const { Title, Text } = Typography

export interface FeaturePageHeaderProps {
  icon: ReactNode
  /** 标题文案；传 ReactNode 时可完全自定义标题区 */
  title: ReactNode
  /** 标题旁徽章（数字会自动套 headerBadge 样式） */
  badge?: ReactNode
  badgeVariant?: 'count' | 'muted'
  description?: ReactNode
  extra?: ReactNode
  /** compact 用于业务子页等较矮顶栏 */
  size?: 'default' | 'compact'
  draggable?: boolean
  /** embedded：仅标题块，用于聊天/业务三栏顶栏左侧 */
  variant?: 'bar' | 'embedded'
}

/**
 * 功能页顶栏：图标盒 + 标题 + 描述 + 右侧操作区。
 * 尺寸与技能/规则等列表页保持一致。
 */
export function FeaturePageHeader({
  icon,
  title,
  badge,
  badgeVariant = 'count',
  description,
  extra,
  size = 'default',
  draggable = true,
  variant = 'bar'
}: FeaturePageHeaderProps): React.ReactElement {
  const headerClass = [
    styles.header,
    size === 'compact' ? styles.headerCompact : '',
    draggable ? 'app-drag' : ''
  ]
    .filter(Boolean)
    .join(' ')

  const iconClass = [
    styles.headerIcon,
    size === 'compact' ? styles.headerIconCompact : ''
  ]
    .filter(Boolean)
    .join(' ')

  const badgeNode =
    badge === undefined || badge === null ? null : typeof badge === 'number' ||
      typeof badge === 'string' ? (
      <span
        className={[
          styles.headerBadge,
          badgeVariant === 'muted' ? styles.headerBadgeMuted : ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {badge}
      </span>
    ) : (
      badge
    )

  const titleNode =
    typeof title === 'string' ? (
      <Title level={3} className={styles.title}>
        {title}
      </Title>
    ) : (
      title
    )

  const mainBlock = (
    <>
      <div className={styles.headerMain}>
        <div className={iconClass}>{icon}</div>
        <div>
          <div className={styles.titleRow}>
            {titleNode}
            {badgeNode}
          </div>
          {description ? (
            typeof description === 'string' ? (
              <Text type="secondary" className={styles.desc}>
                {description}
              </Text>
            ) : (
              <div className={styles.desc}>{description}</div>
            )
          ) : null}
        </div>
      </div>
    </>
  )

  if (variant === 'embedded') {
    return mainBlock
  }

  return (
    <header className={headerClass}>
      {mainBlock}
      {extra ? <div className={`${styles.headerExtra} app-no-drag`}>{extra}</div> : null}
    </header>
  )
}
