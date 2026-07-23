import type { QuickCard } from './types'

/**
 * 快捷任务卡池（多于一屏，供「换一批」轮换）。
 * prompt 对齐现有 Agent 工具能力，避免引导到未注册工具。
 */
export const QUICK_TASK_CARDS: QuickCard[] = [
  {
    title: '一句话生成视频',
    desc: '编剧→分镜→场景素材→剪辑成片，自动多 Agent 协作',
    prompt:
      '请根据这一句话创作短视频并自动成片：「一只橘猫在雨夜的便利店门口等主人」。' +
      '先生成剧本与分镜，再生成场景素材，最后合成视频，告诉我成片路径。'
  },
  {
    title: '今日天气推送',
    desc: '查询本地天气并推送到已配置的通知渠道',
    prompt:
      '请用 query_weather 获取今日天气，再调用 notify_message 推送到我已配置的通知渠道（可多渠道）。'
  },
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
      '帮我发一条小红书，内容关于今日热点。请先找相关新闻来源页，用 fetch_web_images 抓取配图，再发布；标题不超过20字。我本地上传图片为可选补充。'
  },
  {
    title: 'AI 热点速览',
    desc: '拉取今日科技/AI 热点，整理成可读摘要',
    prompt:
      '请用 fetch_hot_topics 获取今日 AI 与科技热点，整理成 5 条要点摘要（含来源），用简洁中文回复。'
  },
  {
    title: 'A股实时分析',
    desc: '查询个股行情与实时分析，给出简要判断',
    prompt:
      '请用 query_ashare_realtime_analysis 分析贵州茅台（600519）今日走势，结合 query_ashare_kline 补充近期 K 线要点，给出简洁结论。'
  },
  {
    title: 'Remotion 短片成片',
    desc: '初始化 Remotion 项目并渲染可预览成片',
    prompt:
      '请用 Remotion 做一支 15 秒科技感标题短片（包含背景音）：初始化项目、打开 Studio 预览，再渲染成片并告诉我输出路径。'
  },
  {
    title: '网页资料调研',
    desc: '按主题检索网页资料并汇总关键结论',
    prompt:
      '请用 query_web_data 调研「大模型 Agent 工作流」最新进展，汇总 3–5 条要点与可信来源链接。'
  },
  {
    title: '多渠道消息通知',
    desc: '把一段摘要推送到已配置的全部通知渠道',
    prompt:
      '请把下面摘要推送到我已配置的通知渠道：「今日任务已完成，请查收成片与文档。」使用 notify_message。'
  },
  {
    title: '生成一张配图',
    desc: '按主题生成图片并保存到本地资产',
    prompt:
      '请用 generate_image 生成一张「清晨窗边绿植与咖啡杯」的竖版配图，风格清新自然，完成后告诉我保存路径。'
  },
  {
    title: '浏览器打开并摘录',
    desc: '打开指定网页，提取标题与正文要点',
    prompt:
      '请打开智能体浏览器访问 https://www.bing.com/news，截取当前可见新闻列表的前 3 条标题与摘要。'
  },
  {
    title: '用技能包处理任务',
    desc: '先查看可用技能，再按最合适的技能执行',
    prompt:
      '请先查看可用技能包，选择最合适的技能帮我「整理一份可复用的周报写作模板」，并保存为本地 Markdown。'
  },
  {
    title: '热搜改小红书笔记',
    desc: '拉取今日热点→抓配图→生成标题正文并发布',
    prompt:
      '请先用 fetch_hot_topics 获取今日热点，选一条适合小红书的话题；再找相关新闻页用 fetch_web_images 抓配图，最后调用 xhs_publish_note 发布，标题不超过20字。'
  },
  {
    title: '热搜改抖音图文',
    desc: '热点选题→网页配图→抖音创作者中心发布',
    prompt:
      '请先用 fetch_hot_topics 拿今日热点，选一条适合抖音的话题；用 fetch_web_images 从新闻来源页下载配图，再调用 douyin_publish_note 发布，标题不超过30字。'
  },
  {
    title: '写剧本并出分镜',
    desc: '一句话扩写剧本，并生成结构化分镜 JSON',
    prompt:
      '主题：「深夜加班的程序员在便利店遇见未来的自己」。请先扩写完整剧本并用 generate_script 落盘，再调用 generate_storyboard 生成 4–6 镜竖版分镜（含运镜与画幅）。'
  },
  {
    title: '分镜生成场景素材',
    desc: '按分镜表生成关键帧、动效视频与旁白音频',
    prompt:
      '请基于当前会话已有的 storyboard.json（若没有则先生成分镜），调用 generate_scene_assets 为每镜生成关键帧、视频片段与 TTS 旁白，并汇总各素材路径。'
  },
  {
    title: '素材合成视频成片',
    desc: '将已生成的场景素材剪辑合成为完整 mp4',
    prompt:
      '请检查当前会话是否已有场景视频/音频素材；若有则调用 compose_video 合成竖版成片，并告诉我最终 mp4 路径与时长。'
  },
  {
    title: 'Remotion 字幕短片',
    desc: '初始化工程→编写动效字幕→预览并渲染 mp4',
    prompt:
      '请用 Remotion 做一支 10 秒竖版字幕短片：文案「今日 AI 热点速览」。流程：remotion_init_project → write_file 编写 Composition → remotion_studio 预览 → 我确认后 remotion_render 导出。'
  },
  {
    title: '多只 A 股 K 线',
    desc: '批量查询个股 K 线数据并对比要点',
    prompt:
      '请用 query_ashare_kline 查询贵州茅台（600519）、宁德时代（300750）、比亚迪（002594）近一月日 K 线，整理涨跌幅与量能变化要点。'
  },
  {
    title: '查询今日天气',
    desc: '获取指定城市实时天气与气温湿度',
    prompt: '请用 query_weather 查询上海今日天气，包含气温、湿度、风力与简要穿衣建议。'
  },
  {
    title: '网页批量抓配图',
    desc: '从来源页下载高清配图到本地 artifacts',
    prompt:
      '请用 fetch_web_images 从这篇科技新闻页抓取 3 张适合社交发布的配图：https://www.bing.com/news/search?q=AI+agent ，并列出本地绝对路径。'
  },
  {
    title: '总结附件并另存',
    desc: '读取本轮上传附件，提炼要点写入新文件',
    prompt:
      '请先 list_attachments 查看我上传的附件，用 read_file 读取内容后提炼 5 条要点，再用 write_file 保存为「附件摘要.md」。若没有附件请提示我上传。'
  },
  {
    title: '保存调研笔记',
    desc: '联网调研后写入本地 Markdown 备忘',
    prompt:
      '请用 query_web_data 调研「2026 年大模型 Agent 桌面助手」趋势，整理 5 条要点与来源链接，并用 write_file 保存为 artifacts/ai-agent-trends.md。'
  },
  {
    title: '浏览器搜索并摘录',
    desc: '打开搜索引擎，输入关键词并提取结果摘要',
    prompt:
      '请打开智能体浏览器访问 Bing，搜索「Remotion React 视频教程」，用 browser_snapshot 读取前 5 条结果标题与摘要。'
  },
  {
    title: '看图理解附件',
    desc: '识别用户上传图片内容并给出结构化说明',
    prompt:
      '请先 list_attachments 查看我是否上传了图片；若有则切换到 vision 能力识图，说明画面主体、文字内容与可改进建议。没有图片请提示我上传。'
  },
  {
    title: '深度推理排障',
    desc: '切换推理模型，分析复杂问题并给出根因',
    prompt:
      '请切换到 reasoning 能力：我的 Electron 应用在打包后白屏但 dev 正常，请按「现象→可能根因→验证步骤→修复建议」四段式给出排查方案。'
  },
  {
    title: '创作模型写文案',
    desc: '切换创作模型，生成多版小红书标题正文',
    prompt:
      '请切换到 creative 能力，为主题「春季露营装备清单」写 3 版小红书文案（每版含标题≤20字+正文≤300字），风格分别偏实用、氛围感、种草。'
  },
  {
    title: '两种成片方案让我选',
    desc: '复杂任务先列方案，确认后再执行',
    prompt:
      '我想做一支 30 秒产品宣传片。请先调用 present_plan_choices 给我 2 个方案：A）AI 分镜管线自动成片；B）Remotion 字幕动效模板。说明各自优劣，等我选择后再继续。'
  },
  {
    title: '热点摘要并推送',
    desc: '抓取热点→整理摘要→多渠道通知',
    prompt:
      '请用 fetch_hot_topics 获取今日科技热点，整理 5 条中文摘要，再调用 notify_message 推送到我已配置的全部通知渠道。'
  },
  {
    title: '热点生成社交配图',
    desc: '拉取热点选题，用文生图生成原创海报',
    prompt:
      '请先用 fetch_hot_topics 选一条适合传播的热点，再调用 generate_image 生成一张竖版原创海报（非网图），风格简洁现代，并告诉我保存路径。'
  },
  {
    title: '小红书抖音同题双发',
    desc: '同一主题分别适配两平台并串行发布',
    prompt:
      '主题：今日 AI 行业要闻速览。请先调研并撰写内容，分别生成适合小红书和抖音的标题正文；各平台用 fetch_web_images 抓配图后，先 xhs_publish_note 再 douyin_publish_note 发布。'
  },
  {
    title: '拆解任务进度清单',
    desc: '多步骤任务先列清单，逐步更新执行状态',
    prompt:
      '请帮我完成「调研今日天气→写 100 字出行建议→推送通知」：先用 update_task_list 列出 3 步任务清单，再逐步执行并在每步完成后更新状态。'
  },
  {
    title: '生成竖版产品海报',
    desc: '文生图生成 9:16 原创配图，适合短视频封面',
    prompt:
      '请用 generate_image 生成一张 9:16 竖版产品海报：主题「智能办公助手」，主色蓝白，留白充足，适合作为短视频封面，完成后告诉我路径。'
  },
  {
    title: '读取本地文件并改写',
    desc: '读取已有文本，按新要求润色后写回',
    prompt:
      '请用 read_file 读取我指定的本地 Markdown 文件（若我不知道路径请先问我），按「更口语、适合小红书」的要求改写，并用 write_file 另存为「润色版.md」。'
  },
  {
    title: '股市收盘播报稿',
    desc: '实时分析+K线要点，生成口播稿并可选推送',
    prompt:
      '请用 query_ashare_realtime_analysis 分析沪指与创业板指今日表现，写成 200 字以内的口播稿；若我配置了通知渠道，再用 notify_message 推送摘要。'
  }
]

/** 欢迎页默认展示的卡片数量（2 列 × 4 行） */
export const QUICK_TASK_PAGE_SIZE = 8
