---
name: remotion-render
description: >-
  Remotion 视频渲染最佳实践。包含画质参数、渲染前检查清单、常见问题排查。
  在灵犀中导出 mp4 前加载本技能。
---

# Remotion 渲染最佳实践

> 改编自 Remotion 官方 `remotion-render` 技能，扩展了画质控制与错误诊断。

## 在灵犀中预览（替代 npx remotion studio）

```
remotion_studio()
```

- 启动本地 Studio 并打开系统浏览器
- 同一会话重复调用会复用已有实例
- Studio 仅供调参预览；最终成片仍需 `remotion_render`
- **强烈建议**：复杂动效先预览再渲染，节省时间

## 在灵犀中渲染（替代 npx remotion render）

### 基础用法
```
remotion_render({
  compositionId: "Main",
  outputFileName: "output.mp4"
})
```

### 画质控制
```
remotion_render({
  compositionId: "Main",
  quality: "standard"   // fast | standard | high
})
```

| 画质预设 | CRF | 并发数 | 适用场景 |
|---------|-----|--------|---------|
| `fast` | 28 | 2 | 快速预览、测试动画、体积优先 |
| `standard`（默认） | 23 | 4 | 常规输出、平衡画质与速度 |
| `high` | 18 | 6 | 最终成片、高质量要求、发布用 |

- CRF 越小画质越好，文件越大（0-51 范围，18 接近无损）
- 并发数越高渲染越快，但占用更多 CPU 资源

### 输出说明
- `compositionId` 必须与 `src/Root.tsx` 中 `<Composition id>` 一致
- 默认输出到 `{projectDir}/out/`
- 成功时工具返回 **mp4 绝对路径**，必须在回复中保留以便预览
- 同一会话同时只允许一个渲染任务，重复调用会复用进行中的任务

## 渲染前检查清单

- [ ] 已调用 `remotion_init_project` 初始化工程
- [ ] `src/Composition.tsx` 无语法错误（import 路径正确）
- [ ] `Root.tsx` 中 `durationInFrames` / `fps` / 画幅符合预期
- [ ] `public/` 中引用的素材文件存在且路径正确
- [ ] `compositionId` 拼写与 Root.tsx 完全一致
- [ ] （推荐）先用 `remotion_studio` 预览确认效果

## 常见问题与错误诊断

### 1. 打包失败（bundle error）
**症状**：渲染在「打包 Composition」阶段报错
**原因**：
- TypeScript 语法错误
- import 的文件路径不存在
- 引用了未安装的依赖包
**排查**：
- 检查 Composition.tsx / Root.tsx 的语法
- 确认所有 import 路径正确
- 查看控制台具体错误行号

### 2. 找不到 Composition
**症状**：报错 `Cannot find composition "xxx"`
**原因**：`compositionId` 与 `Root.tsx` 中注册的 id 不一致
**解决**：
- 打开 `src/Root.tsx` 确认 `<Composition id="...">` 的值
- 注意大小写敏感，`Main` ≠ `main`

### 3. 渲染失败（render error）
**症状**：打包成功，但渲染过程中某帧报错
**原因**：
- 组件运行时错误（除以零、undefined 属性访问等）
- 引用的图片/音频素材不存在
- `staticFile()` 路径错误
**排查**：
- 先用 `remotion_studio` 预览，定位报错的具体帧
- 检查 public 目录下文件是否存在
- 检查动态计算是否有边界情况

### 4. 渲染很慢
**正常情况**：
- 首次渲染需下载 Chromium（约 1-3 分钟）
- 长视频 / 高分辨率 / high 画质本身较慢
**优化建议**：
- 测试阶段使用 `quality: "fast"` 快速出片
- 降低 `durationInFrames` 做短片段测试
- 确认不是在下载浏览器（看进度条是否卡在 0-10%）

### 5. 黑屏 / 空白画面
**常见原因**：
- `<Sequence>` 的 `from` / `durationInFrames` 设置错误，元素不在可视时间内
- `opacity` 插值范围错误（起始值不是 0）
- 元素定位在画面外
**排查**：用 Studio 时间轴拖动逐帧检查

### 6. 素材加载失败
- 确认文件放在 `{projectDir}/public/` 目录下
- 确认使用 `staticFile('filename.png')` 引用，不要写相对路径
- 文件名区分大小写

## 透明视频 / 静帧导出

官方 CLI 支持 `npx remotion still` 导出静帧、WebM 透明视频等。
灵犀当前内置 `remotion_render` 导出 h264 mp4（最通用格式）。
如需其他格式，可在 Composition 中调整或后续扩展工具。

## 性能优化建议

1. **测试用低画质**：开发阶段用 `quality: "fast"`，最终出片再用 `high`
2. **分段测试**：长视频拆成多个短 Composition 分别测试
3. **素材预压缩**：大图、长音频提前压缩，减少运行时开销
4. **避免每帧重计算**：能提到组件外的常量就提到外面

## 参考

- CLI 文档：https://www.remotion.dev/docs/cli/render
- 编码器参数：https://www.remotion.dev/docs/encoding
- 渲染性能：https://www.remotion.dev/docs/performance
