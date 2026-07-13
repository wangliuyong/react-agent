import {
  ClockCircleOutlined,
  CloudUploadOutlined,
  MessageOutlined
} from '@ant-design/icons'
import type { SessionType } from '@shared/types'

/** 会话类型 → 侧边栏历史项图标（与主导航语义对齐） */
export const SESSION_TYPE_ICONS: Record<SessionType, React.ReactNode> = {
  chat: <MessageOutlined />,
  publish: <CloudUploadOutlined />,
  schedule: <ClockCircleOutlined />
}
