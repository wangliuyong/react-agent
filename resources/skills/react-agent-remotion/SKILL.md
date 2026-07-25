---
name: Remotion 程序化视频（灵犀内置）
description: >-
  当用户要用 React/Remotion 做动效视频、字幕视频、数据可视化、品牌模板视频时加载本技能。
  指导 Agent 优先选用模板 remotion_apply_template，再 Studio 预览与 remotion_render 导出 mp4。
---

# Remotion 程序化视频（灵犀内置）

> 改编自 [Remotion](https://github.com/remotion-dev/remotion) 官方 Agent Skills，已对接灵犀内置工具。

## 适用场景

- 用户要求用 **Remotion** / **React 代码** 生成视频
- 精确动效、字幕、图表、Logo 动画、产品演示
- 需要可复用模板、参数化批量出片
- **不适合**：纯 AI 文生视频叙事短片（应走 `ai-video-production` 技能 + `generate_storyboard` 管线）

## 标准流程（推荐：模板优先）

### 1. 加载子技能（按需）
   - 总览导航：`use_skill('remotion-best-practices')`
   - 设计规范（推荐）：`use_skill('remotion-design-system')`
   - 字幕：`use_skill('remotion-captions')`
   - 渲染细节：`use_skill('remotion-render')`

### 2. 选用模板（优先）
   ```
   query_remotion_templates({ tag: "intro" })   // 可选过滤
   remotion_apply_template({
     templateId: "brand-intro",
     props: { title: "月社", theme: "PREMIUM_GOLD" }
   })
   ```
   - 内置精品：`brand-intro`（竖版片头）、`karaoke-captions`（横版字幕）
   - 用户可在「技能 → 视频模板」导入 GitHub 模板；满意成片可 `remotion_save_template` 或聊天内「存为 Remotion 模板」

### 3. 预览与调参
   ```
   remotion_studio
   ```
   - Studio 右侧 **Props** 面板可实时调文案、主题、字号等（模板含 schema 时）
   - 调参后务必：`remotion_update_input_props({ props: { ... } })` 再渲染，保证成片与预览一致

### 4. 渲染成片
   ```
   remotion_render({ compositionId: "Main", outputFileName: "video.mp4" })
   ```
   - 默认读取工程 `.remotion-input-props.json`
   - 成功后在回复中保留 **mp4 绝对路径**；可提示用户存为模板以便复用

### 5. 无合适模板时（定制）
   ```
   remotion_init_project({ width: 1080, height: 1920, ... })
   write_file 修改 src/ActiveTemplate.tsx 或 Composition
   remotion_studio → remotion_render
   ```

## 内置工具

| 工具 | 用途 |
|------|------|
| `query_remotion_templates` | 列出内置/用户模板 |
| `remotion_apply_template` | 一键挂载模板到会话工程 |
| `remotion_update_input_props` | 写入 Studio 调参后的 props |
| `remotion_save_template` | 将当前工程存为用户模板 |
| `remotion_init_project` | 复制 starter（无模板时） |
| `remotion_studio` | 本地预览 |
| `remotion_render` | 导出 mp4 |
| `write_file` / `read_file` | 定制代码 |

## 注意事项

- 不要编造渲染成功；以 `remotion_render` 返回的 `videoPath` 为准
- `compositionId` 须与 `Root.generated.tsx` 中 id 一致（默认 `Main`）
- 资源放 `{projectDir}/public/`，代码用 `staticFile('logo.png')`

## 示例提示

- 「用黑金片头模板，标题月社，竖版 5 秒」
- 「卡拉OK字幕热点速览，横版」
- 「把刚才 Remotion 视频存成模板」
