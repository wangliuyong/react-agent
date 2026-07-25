---
name: remotion-markup
description: >-
  编写 Remotion React 画面与动效的最佳实践。包含动画规则、组件库、
  时间轴控制、媒体资源处理。编写 Composition 代码前加载本技能。
---

# Remotion React Markup 最佳实践

> 改编自 Remotion 官方 `remotion-markup` 技能，扩展了高级动效模式与内置组件库用法。

## 一、核心动画规则

### 基础 API
- 用 `useCurrentFrame()` 获取当前帧号
- 用 `interpolate()` 做插值动画（**优先于 spring()**）
- 用 `Easing.bezier()` 自定义缓动曲线
- **禁止** CSS `transition` / `animation`（渲染不正确）
- **禁止** Tailwind 动画 class

### 变换属性规范
优先使用独立 CSS 属性，而非拼接 `transform` 字符串：

```tsx
// ✅ 推荐
style={{
  scale: interpolate(frame, [0, 60], [0.8, 1]),
  translate: interpolate(frame, [0, 60], ['0px 20px', '0px 0px']),
  rotate: interpolate(frame, [0, 60], [0, 360])
}}

// ❌ 避免
style={{
  transform: `scale(${scale}) translateY(${y}px)`
}}
```

### 缓动曲线预设（Starter 内置）
从 `src/lib/easings.ts` 导入即用：

| 预设 | 场景 |
|------|------|
| `EASE_STANDARD` | 通用状态切换 |
| `EASE_DECELERATE` | 元素入场（快→慢） |
| `EASE_ACCELERATE` | 元素退场（慢→快） |
| `EASE_APPLE` | 苹果风格顺滑质感 |
| `EASE_BOUNCE_IN` | 强调性弹性入场 |
| `SPRING_PRESETS` | 弹簧物理参数预设 |

## 二、内置动画工具函数（Starter 模板）

所有 Hook 位于 `src/lib/animations.ts`，直接 import 使用。

### 入场动画
```tsx
import { useFadeIn, useSlideUp, useScaleIn, useSpringIn } from './lib/animations'

// 淡入
const opacity = useFadeIn(startFrame = 0, duration = 30, easing)

// 从下方滑入 + 淡入
const { opacity, translateY } = useSlideUp(startFrame, duration, distance = 40)

// 缩放入场
const { opacity, scale } = useScaleIn(startFrame, duration, fromScale = 0.8)

// 弹性入场（物理弹簧）
const springProgress = useSpringIn(startFrame, preset = 'standard')
```

### 错落动画（Stagger）
多个元素依次入场时，用 `staggerDelay()` 计算每个元素的起始帧：

```tsx
import { staggerDelay, useSlideUp } from './lib/animations'

{items.map((item, i) => {
  const start = staggerDelay(i, baseDelay = 10, staggerPerItem = 6)
  const anim = useSlideUp(start, 30, 20)
  return <div key={i} style={{ opacity: anim.opacity, transform: `translateY(${anim.translateY}px)` }} />
})}
```

### 持续动画
```tsx
// 呼吸脉动（±3% 缩放）
const breathScale = useBreathing(intensity = 0.03, speed = 0.5)

// 打字机效果
const displayedText = useTypewriter(fullText, startFrame = 0, framesPerChar = 3)

// 进度条动画
const progress = useProgress(startFrame, duration)
```

## 三、内置组件库（Starter 模板）

### 1. AnimatedText — 逐字错落动画文字
```tsx
import { AnimatedText } from './components/AnimatedText'

<AnimatedText
  text="你的标题文字"
  startFrame={10}
  stagger={4}      // 每字错落帧数
  duration={24}    // 单字动画时长
  distance={20}    // 滑入距离
  style={{ fontSize: 72, fontWeight: 700, color: '#fff' }}
/>
```
效果：每个字从下方依次滑入淡入，高级感强。

### 2. TitleCard — 标题卡片
```tsx
import { TitleCard } from './components/TitleCard'

<TitleCard
  title="主标题"
  subtitle="副标题说明"
  startFrame={0}
  align="center"           // left | center | right
  showAccentLine={true}    // 是否显示装饰线
  accentColor="#3b82f6"    // 装饰线颜色
/>
```
适用于章节开场、视频片头。

### 3. BarChart — 柱状图数据可视化
```tsx
import { BarChart } from './components/BarChart'

<BarChart
  data={[
    { label: '一月', value: 65, color: '#3b82f6' },
    { label: '二月', value: 82 },
    { label: '三月', value: 120 }
  ]}
  title="季度增长数据"
  startFrame={20}
  duration={60}
  stagger={8}     // 每根柱子错落延迟
  chartHeight={400}
  showValues={true}
/>
```
柱子从底部弹性增长，带数值标签。

### 4. Subtitles — 字幕组件
```tsx
import { Subtitles, KaraokeSubtitles } from './components/Subtitles'

// 基础字幕
<Subtitles
  captions={[
    { text: '第一句旁白', startMs: 0, endMs: 2000 },
    { text: '第二句旁白', startMs: 2000, endMs: 4500 }
  ]}
  bottomOffset={120}
  fontSize={48}
/>

// 卡拉OK逐字高亮
<KaraokeSubtitles captions={karaokeCaptions} highlightColor="#fff" />
```
自动淡入淡出，支持背景半透明圆角样式。

## 四、时间轴控制：Sequence

```tsx
import { AbsoluteFill, Sequence } from 'remotion'

<AbsoluteFill>
  {/* 第一幕：0-60帧 */}
  <Sequence from={0} durationInFrames={60} name="Intro">
    <IntroScene />
  </Sequence>

  {/* 第二幕：60-180帧 */}
  <Sequence from={60} durationInFrames={120} name="Body">
    <MainContent />
  </Sequence>

  {/* 第三幕：180-240帧 */}
  <Sequence from={180} durationInFrames={60} name="Outro">
    <EndingScene />
  </Sequence>
</AbsoluteFill>
```

- `from`：起始帧（延迟入场）
- `durationInFrames`：持续帧数
- `layout="none"`：非全屏定位元素时使用，避免布局干扰

## 五、媒体与资源

### 静态资源
- 文件放入 `{projectDir}/public/` 目录
- 代码中用 `staticFile('filename.png')` 引用

```tsx
import { staticFile, Img } from 'remotion'

<Img src={staticFile('logo.png')} style={{ width: 200 }} />
```

### 视频与音频
```tsx
import { Video, Audio } from '@remotion/media'
import { staticFile } from 'remotion'

<Video src={staticFile('clip.mp4')} />
<Audio src={staticFile('bgm.mp3')} volume={0.3} />
```

### 字体
- 推荐 `@remotion/google-fonts` 加载 Google Fonts
- 本地字体需放入 public 并通过 CSS @font-face 加载

## 六、设计系统（进阶）

需要专业配色、排版规范时，加载 `remotion-design-system` 技能：
- 3 套预设配色主题（深色科技 / 浅色简约 / 高端黑金）
- 完整字号层级与间距系统
- 动效设计原则与质感加分技巧
- Starter 模板 `src/theme/` 目录内置变量

## 七、常见动效模式

### 数字滚动计数
```tsx
const count = Math.round(interpolate(frame, [30, 120], [0, targetValue], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
  easing: Easing.out(Easing.cubic)
}))
```

### 背景缓慢平移（视差感）
```tsx
const xOffset = interpolate(frame, [0, totalFrames], [0, -100], {
  extrapolateRight: 'clamp'
})
// 背景图缓慢向左移动，营造镜头运动感
```

### 元素循环浮动
```tsx
const floatY = Math.sin(frame * 0.05) * 10
// 元素上下浮动 ±10px，增加呼吸感
```

## 八、性能优化

- 避免每帧创建新对象，能提到组件外就提到外面
- 大量元素时使用 `interpolate` 的 `extrapolate` clamp 减少计算
- 大图素材提前压缩，避免运行时缩放
- 复杂动效拆分为子组件，利用 React 重渲染优化

字幕相关见 `remotion-captions` 技能，渲染相关见 `remotion-render` 技能。
