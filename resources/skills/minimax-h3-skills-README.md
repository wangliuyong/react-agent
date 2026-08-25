# MiniMax H3 Skills（本仓库内置副本）

来源：[MiniMax-AI/MiniMax-H3/skills](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills)

本目录收录官方 **1 个提示词技能** + **8 个风格视频技能**：

| 技能 id | 用途 |
| --- | --- |
| `h3-prompt-writing` | 将请求改写为 H3 T2VA / I2VA / FL2VA / L2VA / Ref2VA 结构（AI 视频画布默认启用） |
| `minimalist-product-ad-generator` | 极简产品广告 |
| `3d-animation-short-generator` | 风格化 3D 动画短片 |
| `papercraft-stop-motion-explainer` | 纸艺定格科普 |
| `brand-promo-video-generator` | 品牌宣传短片 |
| `music-video-subtitle-generator` | MV / 歌词字幕视觉 |
| `co-op-game-intro-generator` | 双人合作游戏开场 |
| `paper-collage-explainer-generator` | 纸拼贴解说 |
| `handdrawn-live-video-generator` | 手绘融合实拍短片 |

风格技能附带官方 `SKILL.cn.md`；本仓库以中文版作为 `SKILL.md`，英文原版保留为 `SKILL.en.md`。

上游 README 与安装说明见官方仓库；应用启动时会调用 `postEnsureMiniMaxH3SkillsEnabled` 确保技能可用并默认启用 `h3-prompt-writing`。
