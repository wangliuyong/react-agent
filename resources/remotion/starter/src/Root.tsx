import { Composition } from 'remotion'
import { MyComposition } from './Composition'

/**
 * Remotion 根入口：在此注册所有 Composition。
 * 每个 Composition 的 id 将用于 remotion_render 的 compositionId 参数。
 *
 * 可根据需要新增多个 Composition，例如：
 * - 不同画幅（横版/竖版/方形）
 * - 不同场景（片头/正文/片尾）
 * - 不同模板风格
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 默认主 Composition - 横版 16:9 */}
      <Composition
        id="Main"
        component={MyComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 竖版 9:16 模板（短视频平台）- 如需使用取消注释并创建对应组件
      <Composition
        id="Vertical"
        component={MyComposition}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
      */}

      {/* 方形 1:1 模板（社交平台）
      <Composition
        id="Square"
        component={MyComposition}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
      />
      */}
    </>
  )
}
