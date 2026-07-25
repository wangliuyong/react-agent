# Remotion 模板系统实施计划（落地记录）

> 实施日期：2026-07-25。完整规格见 Cursor 计划文件。

## 已交付

- Registry：`shared/remotion-template.ts`、`electron/main/store/remotion-templates.ts`
- Starter：`ActiveTemplate.tsx`、`Root.generated.tsx`、inputProps 贯通 `remotion_render`
- 内置模板：`brand-intro`、`karaoke-captions`
- Agent 工具：`query_remotion_templates`、`remotion_apply_template`、`remotion_update_input_props`、`remotion_save_template`
- IPC / preload / Skills 页「视频模板」Tab、GitHub 导入
- 聊天成片「存为 Remotion 模板」
- Skill 附属 `remotion-templates/` 注册与卸载清理

## 手动验收

1. Agent：`query_remotion_templates` → `remotion_apply_template` → `remotion_studio` → `remotion_update_input_props` → `remotion_render`
2. 聊天 mp4 路径含 `/remotion/<sessionId>/out/` 时显示「存为 Remotion 模板」
3. 技能页「视频模板」列表含内置 2 项，可 URL 导入与删除本地模板
