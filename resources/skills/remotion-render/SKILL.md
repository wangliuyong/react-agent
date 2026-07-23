---
name: remotion-render
description: >-
  Remotion 视频渲染最佳实践。在灵犀中导出 mp4 前加载本技能。
---

# Remotion 渲染最佳实践

> 改编自 Remotion 官方 `remotion-render` 技能。

## 在灵犀中预览（替代 npx remotion studio）

```
remotion_studio()
```

- 启动本地 Studio 并打开系统浏览器
- 同一会话重复调用会复用已有实例
- Studio 仅供调参预览；最终成片仍需 `remotion_render`

## 在灵犀中渲染（替代 npx remotion render）

```
remotion_render({
  compositionId: "Main",
  outputFileName: "output.mp4"
})
```

- `compositionId` 必须与 `src/Root.tsx` 中 `<Composition id>` 一致
- 默认输出到 `{projectDir}/out/`
- 成功时工具返回 **mp4 绝对路径**，必须在回复中保留以便预览

## 渲染前检查清单

- [ ] 已调用 `remotion_init_project`
- [ ] `src/Composition.tsx` 无语法错误
- [ ] `Root.tsx` 中 durationInFrames / fps / 画幅符合预期
- [ ] `public/` 中引用的素材文件存在
- [ ] `compositionId` 拼写正确

## 常见问题

| 问题 | 处理 |
|------|------|
| 找不到 composition | 检查 Root.tsx 的 id 与 render 参数 |
| 渲染很慢 | 首次需下载 Chromium；降低 durationInFrames 或分辨率测试 |
| 黑屏/空白 | 检查 Sequence 的 from/durationInFrames；确认 opacity 插值范围 |
| 素材加载失败 | 确认使用 `staticFile()` 且文件在 public/ |

## 透明视频 / 静帧

官方 CLI 支持 `npx remotion still` 导出静帧；灵犀当前内置 `remotion_render` 导出 h264 mp4。
如需静帧，可在 Composition 中指定较短 duration 或后续扩展工具。

## 参考

- CLI 文档：https://www.remotion.dev/docs/cli/render
- 编码器：https://www.remotion.dev/docs/encoding
