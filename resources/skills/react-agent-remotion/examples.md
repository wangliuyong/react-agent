# 示例：5 秒竖版标题淡入

## 用户输入

> 用 Remotion 做一个竖版片头，标题「灵犀 AI」淡入，5 秒

## Agent 步骤

1. `use_skill('react-agent-remotion')`
2. `use_skill('remotion-markup')`
3. `remotion_init_project({ width: 1080, height: 1920, fps: 30, durationInFrames: 150, compositionId: 'Intro' })`
4. `write_file` 覆盖 `src/Composition.tsx`（useCurrentFrame + interpolate 淡入）
5. `remotion_studio()` — 浏览器打开预览
6. `remotion_render({ compositionId: 'Intro', outputFileName: 'intro.mp4' })`
7. 回复中包含工具返回的 mp4 路径

## Composition 片段参考

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export const Intro: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{
        color: '#fff',
        fontSize: 96,
        opacity: interpolate(frame, [0, 45], [0, 1], { extrapolateRight: 'clamp' })
      }}>
        灵犀 AI
      </h1>
    </AbsoluteFill>
  )
}
```
