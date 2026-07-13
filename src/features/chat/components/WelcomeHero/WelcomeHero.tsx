import styles from './WelcomeHero.module.css'

const { Title, Paragraph } = Typography

interface QuickCard {
  title: string
  desc: string
  prompt: string
  icon: React.ReactNode
}

const CARDS: QuickCard[] = [
  {
    title: '发一条抖音图文',
    desc: '从来源网页抓取配图，生成标题正文并发布到抖音创作者中心',
    prompt:
      '帮我发一条抖音图文，内容关于今日热点。请先找相关新闻来源页，用 fetch_web_images 抓取配图，再调用 douyin_publish_note 发布；标题不超过30字。我本地上传图片仅作可选补充。',
    icon: <SendOutlined />
  },
  {
    title: '发一条小红书',
    desc: '从来源网页抓取配图，生成标题正文并发布（本地上传可选）',
    prompt:
      '帮我发一条小红书，内容关于今日热点。请先找相关新闻来源页，用 fetch_web_images 抓取配图，再发布；标题不超过20字。我本地上传图片仅作可选补充。',
    icon: <SendOutlined />
  },
  {
    title: '打开小红书第二篇笔记',
    desc: '打开智能体浏览器，定位并查看第二篇可见笔记',
    prompt: '请直接打开智能体浏览器，打开小红书并点击第二篇可见笔记，提取标题作者点赞等信息。',
    icon: <ScheduleOutlined />
  },
  {
    title: '从来源页取配图',
    desc: '打开内容页下载大图，供后续发布使用',
    prompt:
      '请打开一个今日 AI 热点相关网页，用 fetch_web_images 下载 2～3 张配图，并告诉我保存路径。',
    icon: <PictureOutlined />
  },
  {
    title: '规划内容发布流',
    desc: '创建多子任务的发布计划并串行执行',
    prompt: '帮我规划一个多渠道发布计划：小红书体育 + 抖音人工智能两个子任务，串行执行；配图从来源网页抓取。',
    icon: <FileWordOutlined />
  }
]

interface WelcomeHeroProps {
  onPick: (prompt: string) => void
}

/** 新对话落地页：豆包式问候 + 快捷任务卡片 */
export function WelcomeHero({ onPick }: WelcomeHeroProps): React.ReactElement {
  return (
    <div className={styles.wrap}>
      {/* <div className={styles.avatar}>灵</div> */}
      <Title level={2} className={styles.title}>
        你好，我是灵犀
      </Title>
      <Paragraph className={styles.sub}>
        智能感知热点、抓取配图、生成文案，并帮你发布到小红书与抖音，试试下面的快捷指令吧
      </Paragraph>
      <div className={styles.grid}>
        {CARDS.map((card) => (
          <button
            key={card.title}
            type="button"
            className={styles.card}
            onClick={() => onPick(card.prompt)}
          >
            <div className={styles.cardTop}>
              <span className={styles.iconBox}>{card.icon}</span>
              <span className={styles.cardTitle}>{card.title}</span>
            </div>
            <p className={styles.cardDesc}>{card.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
