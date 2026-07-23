/** 欢迎页快捷任务卡片 */
export interface QuickCard {
  /** 卡片标题 */
  title: string
  /** 一句话能力说明 */
  desc: string
  /** 点击后填入输入框 / 直接发送的完整 prompt */
  prompt: string
}
