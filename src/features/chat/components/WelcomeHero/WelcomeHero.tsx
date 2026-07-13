import type { CSSProperties } from 'react'
import styles from './WelcomeHero.module.css'

const { Title, Paragraph } = Typography

interface QuickCard {
  title: string
  desc: string
  prompt: string
}

/** 快捷任务卡片配置 — 对齐参考样式的 2 列网格 */
const CARDS: QuickCard[] = [
  {
    title: '打开小红书第二篇笔记',
    desc: '打开智能体浏览器，定位并查看第二篇可见笔记',
    prompt: '请直接打开智能体浏览器，打开小红书并点击第二篇可见笔记，提取标题作者点赞等信息。'
  },
  {
    title: '创建 Word 文档',
    desc: '根据主题自动生成结构化文档并保存到本地',
    prompt: '帮我创建一份关于今日 AI 热点的 Word 文档，包含摘要、要点分析和结论，保存到桌面。'
  },
  {
    title: '制作图片海报',
    desc: '根据文案主题生成适合社交平台的配图海报',
    prompt: '帮我制作一张关于今日热点的图片海报，风格简洁现代，适合小红书发布。'
  },
  {
    title: '设置定时任务',
    desc: '创建周期性执行的自动化任务计划',
    prompt: '帮我设置一个定时任务：每天早上 9 点自动搜索 AI 热点并生成摘要。'
  },
  {
    title: '发一条抖音图文',
    desc: '从来源网页抓取配图，生成标题正文并发布到抖音创作者中心',
    prompt:
      '帮我发一条抖音图文，内容关于今日热点。请先找相关新闻来源页，用 fetch_web_images 抓取配图，再调用 douyin_publish_note 发布；标题不超过30字。我本地上传图片仅作可选补充。'
  },
  {
    title: '发一条小红书',
    desc: '从来源网页抓取配图，生成标题正文并发布（本地上传可选）',
    prompt:
      '帮我发一条小红书，内容关于今日热点。请先找相关新闻来源页，用 fetch_web_images 抓取配图，再发布；标题不超过20字。我本地上传图片仅作可选补充。'
  },
  {
    title: '从来源页取配图',
    desc: '打开内容页下载大图，供后续发布使用',
    prompt:
      '请打开一个今日 AI 热点相关网页，用 fetch_web_images 下载 2～3 张配图，并告诉我保存路径。'
  },
  {
    title: '规划内容发布流',
    desc: '创建多子任务的发布计划并串行执行',
    prompt:
      '帮我规划一个多渠道发布计划：小红书体育 + 抖音人工智能两个子任务，串行执行；配图从来源网页抓取。'
  }
]

interface WelcomeHeroProps {
  onPick: (prompt: string) => void
}

/** 新会话落地页：问候语 + 快捷任务卡片网格 */
export function WelcomeHero({ onPick }: WelcomeHeroProps): React.ReactElement {
  return (
    <div className={styles.wrap}>
      <Title level={2} className={styles.title}>
        今天要处理哪块业务？
      </Title>
      <Paragraph className={styles.sub}>
        我可以帮你连接智能体浏览器、渠道账号、发布工作台与定时任务，从热点调研、内容创作到多渠道发布，一句话搞定整条业务链路。
      </Paragraph>
      <div className={styles.grid}>
        {CARDS.map((card, index) => (
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
    </div>
  )
}
