import { Composition } from 'remotion'
import { MyComposition } from './Composition'

/**
 * Remotion 根入口：starter 仅保留 Main。
 * 业务模版 Composition 由 remotion_apply_template_skill 从技能 template/ 拼装写入。
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={MyComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
