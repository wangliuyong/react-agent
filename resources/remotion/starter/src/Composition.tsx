import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion'
import { TitleCard } from './components/TitleCard'
import { AnimatedText } from './components/AnimatedText'
import { BarChart } from './components/BarChart'
import { Subtitles } from './components/Subtitles'
import { useBreathing, useFadeIn } from './lib/animations'
import { GRADIENTS, DEFAULT_THEME } from './theme/colors'
import { FONT_SIZES, FONT_WEIGHTS, SPACING } from './theme/typography'

/**
 * 默认示例 Composition - 展示完整动效能力
 * 包含：标题入场、数据可视化、字幕、呼吸动画
 * Agent 应根据用户需求改写本文件，或新增组件并在 Root.tsx 注册。
 */
export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame()
  const bgOpacity = useFadeIn(0, 30)

  return (
    <AbsoluteFill
      style={{
        background: GRADIENTS.deepOcean,
        opacity: bgOpacity
      }}
    >
      {/* 第一幕：标题入场 (0-90帧 / 0-3秒) */}
      <Sequence from={0} durationInFrames={90}>
        <TitleCard
          title="灵犀 AI"
          subtitle="用代码驱动每一个像素"
          startFrame={10}
          duration={50}
        />
      </Sequence>

      {/* 第二幕：数据可视化 (90-210帧 / 3-7秒) */}
      <Sequence from={90} durationInFrames={120}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.xxl
          }}
        >
          <div style={{ width: '100%', maxWidth: 1200 }}>
            <AnimatedText
              text="季度数据概览"
              startFrame={10}
              style={{
                fontSize: FONT_SIZES.h2,
                fontWeight: FONT_WEIGHTS.bold,
                color: DEFAULT_THEME.text,
                marginBottom: SPACING.lg,
                display: 'block'
              }}
            />
            <BarChart
              data={[
                { label: 'Q1', value: 65 },
                { label: 'Q2', value: 82 },
                { label: 'Q3', value: 120 },
                { label: 'Q4', value: 95 }
              ]}
              startFrame={30}
              duration={60}
              chartHeight={350}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* 第三幕：结尾 (210-300帧 / 7-10秒) */}
      <Sequence from={210} durationInFrames={90}>
        <EndingScene />
      </Sequence>

      {/* 全程字幕 */}
      <Subtitles
        captions={[
          { text: '欢迎来到灵犀 AI', startMs: 0, endMs: 2500 },
          { text: '用代码驱动每一个像素', startMs: 2500, endMs: 5000 },
          { text: '精确控制每一帧动画', startMs: 5000, endMs: 7500 },
          { text: '让创意无限延伸', startMs: 7500, endMs: 10000 }
        ]}
        bottomOffset={100}
      />
    </AbsoluteFill>
  )
}

/** 结尾场景 */
const EndingScene: React.FC = () => {
  const frame = useCurrentFrame()
  const scale = useBreathing(0.02, 0.5)
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        <AnimatedText
          text="开始创作你的视频"
          startFrame={20}
          duration={40}
          style={{
            fontSize: FONT_SIZES.h1,
            fontWeight: FONT_WEIGHTS.bold,
            color: DEFAULT_THEME.text,
            display: 'block',
            marginBottom: SPACING.md
          }}
        />
        <p
          style={{
            fontSize: FONT_SIZES.bodyLg,
            color: DEFAULT_THEME.textSecondary,
            opacity: interpolate(frame, [40, 70], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp'
            })
          }}
        >
          Powered by Remotion + 灵犀
        </p>
      </div>
    </AbsoluteFill>
  )
}
