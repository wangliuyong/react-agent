import { Composition } from 'remotion'
import { MyComposition } from './Composition'

/**
 * Remotion 根入口：在此注册所有 Composition。
 * 每个 Composition 的 id 将用于 remotion_render 的 compositionId 参数。
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={MyComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  )
}
