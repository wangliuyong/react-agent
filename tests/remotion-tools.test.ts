import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const remotionToolsSource = readFileSync(
  new URL('../electron/main/agent/tools/remotion-tools.ts', import.meta.url),
  'utf8'
)
const remotionServiceSource = readFileSync(
  new URL('../electron/main/media/remotion-service.ts', import.meta.url),
  'utf8'
)
const indexSource = readFileSync(
  new URL('../electron/main/agent/tools/index.ts', import.meta.url),
  'utf8'
)
const promptsSource = readFileSync(
  new URL('../electron/main/agent/graph/prompts.ts', import.meta.url),
  'utf8'
)
const remotionSfxSource = readFileSync(
  new URL('../electron/main/media/remotion-sfx.ts', import.meta.url),
  'utf8'
)
const starterSfxLib = readFileSync(
  new URL('../resources/remotion/starter/src/lib/remotion-sfx.ts', import.meta.url),
  'utf8'
)

const roleToolsSource = readFileSync(
  new URL('../electron/main/agent/graph/role-tools.ts', import.meta.url),
  'utf8'
)

describe('Remotion 内置工具', () => {
  it('注册 remotion_init_project / remotion_enable_sfx / remotion_studio / remotion_render', () => {
    expect(remotionToolsSource).toContain("name: 'remotion_init_project'")
    expect(remotionToolsSource).toContain("name: 'remotion_enable_sfx'")
    expect(remotionToolsSource).toContain("name: 'remotion_studio'")
    expect(remotionToolsSource).toContain("name: 'remotion_render'")
    expect(remotionToolsSource).toContain("name: 'query_remotion_templates'")
    expect(remotionToolsSource).toContain("name: 'remotion_apply_template'")
    expect(remotionToolsSource).toContain("name: 'remotion_update_input_props'")
    expect(remotionToolsSource).toContain("name: 'remotion_save_template'")
    expect(remotionToolsSource).toContain('postInitRemotionProject')
    expect(remotionToolsSource).toContain('postEnableRemotionSfx')
    expect(remotionToolsSource).toContain('postStartRemotionStudio')
    expect(remotionToolsSource).toContain('postRenderRemotionVideo')
    expect(indexSource).toContain('remotionInitProjectTool')
    expect(indexSource).toContain('remotionEnableSfxTool')
    expect(indexSource).toContain('remotionStudioTool')
    expect(indexSource).toContain('remotionRenderTool')
  })

  it('渲染服务使用 @remotion/bundler 与 @remotion/renderer，并支持 Studio', () => {
    expect(remotionServiceSource).toContain('@remotion/bundler')
    expect(remotionServiceSource).toContain('@remotion/renderer')
    expect(remotionServiceSource).toContain("'remotion', 'starter'")
    expect(remotionToolsSource).toContain('emitToolProgress')
    expect(remotionServiceSource).toContain('onProgress')
    expect(remotionServiceSource).toContain('createRemotionProgressReporter')
    expect(remotionServiceSource).toContain('renderBySession')
    expect(remotionServiceSource).toContain('queryIsChildAlive')
    expect(remotionServiceSource).toContain('postWriteRootGenerated')
    expect(remotionServiceSource).toContain('queryRemotionInputPropsFromDisk')
    expect(remotionServiceSource).toContain('inputProps')
    expect(remotionServiceSource).toContain('postEnsureRemotionStudioZh')
    expect(remotionServiceSource).toContain('apply-remotion-studio-zh.mjs')
    expect(remotionSfxSource).toContain('@remotion/sfx/dist/esm/index.mjs')
    expect(starterSfxLib).toContain('REMOTION_SFX')
    expect(starterSfxLib).toContain('remotion.media/whoosh.wav')
  })

  it('提供 Remotion Studio 中文界面补丁脚本与词典', () => {
    const script = readFileSync(
      new URL('../scripts/apply-remotion-studio-zh.mjs', import.meta.url),
      'utf8'
    )
    const dict = readFileSync(
      new URL('../resources/remotion/studio-zh-dict.json', import.meta.url),
      'utf8'
    )
    expect(script).toContain('studio-zh-dict.json')
    expect(script).toContain('@remotion/studio')
    expect(dict).toContain('"Compositions"')
    expect(dict).toContain('"合成列表"')
    expect(dict).toContain('"Inspector"')
    expect(dict).toContain('"检查器"')
  })

  it('general 提示词与视频角色包含 Remotion 指引', () => {
    expect(promptsSource).toContain('remotion_init_project')
    expect(promptsSource).toContain('remotion_studio')
    expect(promptsSource).toContain('remotion_render')
    expect(promptsSource).toContain('react-agent-remotion')
    expect(roleToolsSource).toContain('remotion_enable_sfx')
    expect(roleToolsSource).toContain('remotion_init_project')
    expect(roleToolsSource).toContain('remotion_studio')
    expect(roleToolsSource).toContain('remotion_render')
  })

  it('用户取消渲染时中止 Agent 且清理渲染任务与 Studio', () => {
    expect(remotionToolsSource).toContain('queryIsUserCancelIntent')
    expect(remotionToolsSource).toContain('postCancelRemotionRenderSession')
    expect(remotionToolsSource).toContain('postStopRemotionStudios')
    expect(remotionToolsSource).toContain('postAbortAgent')
    expect(remotionToolsSource).toContain('AgentUserCancelledError')
    expect(remotionServiceSource).toContain('postCancelRemotionRenderSession')
    expect(remotionServiceSource).toContain('postStopRemotionStudios')
    expect(remotionServiceSource).toContain('abortController')
  })
})
