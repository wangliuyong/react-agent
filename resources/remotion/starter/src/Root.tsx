import { GeneratedMainComposition } from './Root.generated'

/**
 * Remotion 根入口：主 Composition 由 Root.generated.tsx 注册。
 * 可在此追加额外 Composition（竖版/方形等）。
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <GeneratedMainComposition />

      {/* 竖版 9:16 模板（短视频平台）- 如需使用取消注释并创建对应组件
      <Composition
        id="Vertical"
        component={ActiveTemplate}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
      */}
    </>
  )
}
