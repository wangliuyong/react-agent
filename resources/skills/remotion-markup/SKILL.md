---
name: remotion-markup
description: >-
  编写 Remotion React 画面与动效的最佳实践。编写 Composition 代码前加载本技能。
---

# Remotion React Markup 最佳实践

> 改编自 Remotion 官方 `remotion-markup` 技能（核心要点）。

## 动画规则

- 用 `useCurrentFrame()` 获取当前帧
- 用 `interpolate()` 做插值动画（优先于 `spring()`）
- 用 `Easing.bezier()` 自定义缓动
- **禁止** CSS `transition` / `animation`（渲染不正确）
- **禁止** Tailwind 动画 class

```tsx
import { useCurrentFrame, Easing, interpolate, AbsoluteFill } from 'remotion'

export const Title: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{
      justifyContent: 'center',
      alignItems: 'center',
      opacity: interpolate(frame, [0, 30], [0, 1], {
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1)
      })
    }}>
      <h1 style={{ color: '#fff', fontSize: 72 }}>标题</h1>
    </AbsoluteFill>
  )
}
```

## 变换属性

优先使用 `scale`、`translate`、`rotate` 等 CSS 属性，而非拼接 `transform` 字符串：

```tsx
style={{
  scale: interpolate(frame, [0, 60], [0.8, 1]),
  translate: interpolate(frame, [0, 60], ['0px 20px', '0px 0px'])
}}
```

## 时间轴：Sequence

```tsx
<AbsoluteFill>
  <Sequence from={0} durationInFrames={60} name="Intro">
    <Intro />
  </Sequence>
  <Sequence from={60} durationInFrames={90} name="Body">
    <Body />
  </Sequence>
</AbsoluteFill>
```

- `from`：起始帧（延迟）
- `durationInFrames`：持续帧数
- `layout="none"`：非全屏定位时使用

## 媒体与资源

- 静态文件放 `{projectDir}/public/`
- 用 `staticFile('logo.png')` 引用
- 视频/音频：`import { Video, Audio } from '@remotion/media'`

```tsx
import { Video, Audio } from '@remotion/media'
import { staticFile } from 'remotion'

<Video src={staticFile('clip.mp4')} />
<Audio src={staticFile('bgm.mp3')} />
```

## 字体

- 推荐 `@remotion/google-fonts` 加载 Google Fonts
- 本地字体见官方 local-fonts 文档

## 在灵犀中编写

1. `remotion_init_project` 获得 `projectDir`
2. `write_file` 写入 `src/Composition.tsx`
3. 多场景时拆分组件文件并在 `Root.tsx` 注册
4. `remotion_render` 导出

字幕相关见 `remotion-captions` 技能。

## 官方扩展主题

动效库、3D、Lottie、转场、参数化视频等详见 https://www.remotion.dev/docs
