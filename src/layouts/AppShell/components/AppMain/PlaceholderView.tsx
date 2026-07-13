import styles from './AppMain.module.css'

const { Text } = Typography

interface PlaceholderViewProps {
  icon: React.ReactNode
  label: string
}

/** 尚未上线的功能占位页 */
export function PlaceholderView({ icon, label }: PlaceholderViewProps): React.ReactElement {
  return (
    <div className={styles.placeholder}>
      <div className={styles.placeholderIcon}>{icon}</div>
      <Text className={styles.placeholderText}>「{label}」功能即将上线</Text>
    </div>
  )
}
