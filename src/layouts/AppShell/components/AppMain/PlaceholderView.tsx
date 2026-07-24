import { shellStyles } from '@/components/page-shell'

const { Text } = Typography

interface PlaceholderViewProps {
  icon: React.ReactNode
  label: string
}

/** 尚未上线的功能占位页 */
export function PlaceholderView({ icon, label }: PlaceholderViewProps): React.ReactElement {
  return (
    <div className={shellStyles.emptyState}>
      <div className={shellStyles.emptyStateIcon}>{icon}</div>
      <Text className={shellStyles.emptyStateText}>「{label}」功能即将上线</Text>
    </div>
  )
}
