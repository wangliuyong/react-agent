---
name: Remotion 程序化视频（灵犀内置）
description: >-
  当用户要用 React/Remotion 做动效视频、字幕视频、数据可视化、品牌模板视频时加载本技能。
  指导 Agent 调用 remotion_init_project、write_file 编写 Composition、remotion_render 导出 mp4。
---

# Remotion 程序化视频（灵犀内置）

> 改编自 [Remotion](https://github.com/remotion-dev/remotion) 官方 Agent Skills，已对接灵犀内置工具。

## 适用场景

- 用户要求用 **Remotion** / **React 代码** 生成视频
- 精确动效、字幕、图表、Logo 动画、产品演示
- 需要可复用模板、参数化批量出片
- **不适合**：纯 AI 文生视频叙事短片（应走 `ai-video-production` 技能 + `generate_storyboard` 管线）

## 标准流程

1. **加载子技能**（按需）
   - 新建工程：`use_skill('remotion-create')`
   - 编写 React 画面：`use_skill('remotion-markup')`
   - 字幕：`use_skill('remotion-captions')`
   - 渲染细节：`use_skill('remotion-render')`
   - 总览：`use_skill('remotion-best-practices')`

2. **初始化工程**
   ```
   remotion_init_project
   ```
   - 默认横版 16:9（1920×1080）；竖版短视频可传 1080×1920
   - 返回 `projectDir`、`compositionId`、`entryPoint`

3. **编写 Composition**
   - 用 `write_file` 修改 `{projectDir}/src/Composition.tsx`
   - 多 Composition 时编辑 `{projectDir}/src/Root.tsx` 注册 `<Composition id="..." />`
   - 遵循 remotion-markup：用 `useCurrentFrame()` + `interpolate()`，禁止 CSS animation

4. **预览（推荐）**
   ```
   remotion_studio
   ```
   - 启动本地 Studio，系统浏览器打开时间轴预览
   - 同一会话重复调用会复用实例

5. **渲染成片**
   ```
   remotion_render({ compositionId: "Main" })
   ```
   - 成功后在回复中保留工具返回的 **mp4 绝对路径**

6. **任务清单**
   - 多步任务用 `update_task_list` 跟踪：初始化 → 编码 → 预览 → 渲染 → 交付

## 内置工具

| 工具 | 用途 |
|------|------|
| `remotion_init_project` | 复制内置 starter 到会话目录，配置画幅/帧率/时长 |
| `write_file` | 写入/修改 Composition、Root、资源引用 |
| `read_file` | 读取已有工程文件排错 |
| `remotion_studio` | 启动 Remotion Studio 本地预览（浏览器打开） |
| `remotion_render` | 打包并渲染 mp4（首次可能下载 Chromium，较慢） |
| `generate_image` | 可选：生成素材图后放入 `public/` 并用 `staticFile()` 引用 |

## 与 AI 视频管线的选择

| 需求 | 推荐路径 |
|------|----------|
| 猫捉老鼠叙事短片、分镜+旁白 | `ai-video-production` + generate_* 工具链 |
| 字幕卡点、图表动画、品牌片头 | 本技能 + remotion_* 工具 |
| 用户明确说「用 Remotion」 | 本技能 |

## 注意事项

- 不要编造渲染成功；以 `remotion_render` 返回的 `videoPath` 为准
- `compositionId` 必须与 `Root.tsx` 中 `<Composition id>` 一致
- 资源文件放 `{projectDir}/public/`，代码中用 `staticFile('logo.png')`
- 首次渲染耗时较长，提前告知用户
- Remotion 部分场景需商业许可，见 [remotion.dev/license](https://www.remotion.dev/docs/license)

## 示例提示

- 「用 Remotion 做一个 5 秒竖版片头，标题淡入」
- 「生成带卡拉 OK 字幕的产品介绍视频」
- 「把这段数据做成柱状图动画 mp4」
