---
name: remotion-create
description: >-
  创建新的 Remotion 视频工程与 Composition。在灵犀中初始化 Remotion 项目时使用。
---

# 创建 Remotion 视频工程

> 改编自 Remotion 官方 `remotion-create` 技能。

## 在灵犀中初始化（替代 npx create-video）

**不要**在灵犀会话中手动运行 `npx create-video`。请调用内置工具：

```
remotion_init_project({
  compositionId: "Main",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 150
})
```

常用画幅：

| 场景 | width | height |
|------|-------|--------|
| 竖版 9:16 | 1080 | 1920 |
| 横版 16:9 | 1920 | 1080 |
| 方形 1:1 | 1080 | 1080 |

工具会在会话目录创建工程，返回 `projectDir` 与 `entryPoint`（`src/index.ts`）。

## 工程结构

```
{projectDir}/
  src/
    index.ts       # registerRoot 入口
    Root.tsx       # 注册所有 <Composition />
    Composition.tsx # 默认画面组件
  public/          # 静态资源（图片/音频/视频）
  remotion.config.ts
  out/             # remotion_render 输出目录
```

## 设计视频画面

1. 加载 `remotion-markup` 技能
2. 用 `write_file` 修改 `src/Composition.tsx`
3. 需要多个成片时，在 `src/Root.tsx` 添加多个 `<Composition id="..." />`

## Composition 注册示例

```tsx
import { Composition } from 'remotion'
import { MyVideo } from './MyVideo'

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ProductDemo"
      component={MyVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
)
```

## 后续步骤

编写完成后调用 `remotion_render({ compositionId: "ProductDemo" })`。

更多实践见 `remotion-best-practices`。
